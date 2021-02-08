
#include "thirdParty/emscriptenInterface.h"

#include <cmath>


#include "generators/heightGenerator.h"
#include "types/Matrix.h"

HeightGenerator generator;

int main(int argc, char* argv[]) {}

extern "C" {

    void BuildFoliage(char* Data, int Size);
	
    int applyMatrixData(int commandID, float* data, int density, double posX, double posY, double size);
}

void translateMatrix(float* data, float x, float y, float z) {
    SMatrix4 matrix;
    matrix.Translate(SVector(x, y, z));

    std::memcpy(data, matrix.coords, 16 * sizeof(float));
}

void PROJECT_API BuildFoliage(char* Data, int Size) {
	
	const struct FoliageStr {
		int Density;
		double PosX;
		double PosY;
		double Size;
	} Foliage = *reinterpret_cast<FoliageStr*>(Data);
	
    const size_t TreeCount = Foliage.Density * Foliage.Density * 16;
    float* Matrices = (float*)malloc(TreeCount * sizeof(float));
	
    double step = Foliage.Size / Foliage.Density;
    for (size_t x = 0; x < Foliage.Density; ++x) {
        for (size_t y = 0; y < Foliage.Density; ++y) {
            double realX = Foliage.PosX + x * step - Foliage.Size / 2 + (rand() * 10000 % 10000) / 10000.0 * step;
            double realY = Foliage.PosY + y * step - Foliage.Size / 2 + (rand() * 10000 % 10000) / 10000.0 * step;
            translateMatrix(&Matrices[(x + y * Foliage.Density) * 16], realX, realY, generator.GetAltitudeAtLocation(realX, realY) + 4);
        }
    }	

    Matrices[0] = 20.f;
	
    emscripten_worker_respond(reinterpret_cast<char*>(Matrices), TreeCount * sizeof(float));
}
