#include "generators/heightGenerator.h"
#include "thirdParty/emscriptenInterface.h"

int main(int argc, char* argv[]) {}

HeightGenerator Generator;
typedef void(*WorkerMessageCallback)(int, int, int);

size_t CallID = 0;
worker_handle Worker;
WorkerMessageCallback WorkerCallback;

extern "C" {
	double PROJECT_API GetAltitudeAtLocation(double PosX, double PosY) { return Generator.GetAltitudeAtLocation(PosX, PosY); }
	void PROJECT_API Init(const char* workerPath, WorkerMessageCallback Callback);
	int PROJECT_API BuildFoliage(int Density, double PosX, double PosY, double Size);
}

void Init(const char* WorkerPath, WorkerMessageCallback Callback) {
	WorkerCallback = Callback;
	Worker = emscripten_create_worker(WorkerPath);
}


int BuildFoliage(int Density, double PosX, double PosY, double Size) {

	/** Pack data into a custom structure */
	struct {
		int Density;
		double PosX;
		double PosY;
		double Size;
	} Foliage{ Density , PosX , PosY , Size };

	/** Run worker */
	emscripten_call_worker(
		Worker,
		"BuildFoliage",
		reinterpret_cast<char*>(&Foliage),
		sizeof(Foliage),
		[](char* Data, int Size, void* Args){
			emprint("received : " + std::to_string(reinterpret_cast<float*>(Data)[0]) + std::string(" / ") + std::to_string(Size));
			WorkerCallback(reinterpret_cast<int>(Args), reinterpret_cast<int>(Data), Size);
		},
		reinterpret_cast<void*>(CallID));

	/** Increment call count */
	return static_cast<int>(CallID++);
}