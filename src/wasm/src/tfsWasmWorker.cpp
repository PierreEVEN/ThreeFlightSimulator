
#include "thirdParty/emscriptenInterface.h"

#include <cmath>


#include "generators/heightGenerator.h"
#include "types/Matrix.h"

HeightGenerator generator;

int main(int argc, char* argv[]) {}

extern "C" {

    void PROJECT_API BuildFoliage(char* Data, int Size);
    void PROJECT_API BuildLandscapeSection(char* Data, int Size);
}

void translateMatrix(float* data, float x, float y, float z) {
    SMatrix4 matrix;
    matrix.Translate(SVector(x, y, z));

    std::memcpy(data, matrix.coords, 16 * sizeof(float));
}

void BuildFoliage(char* Data, int Size) {
	
	const struct FoliageStr {
		int Density;
		double PosX;
		double PosY;
		double Size;
	} Foliage = *reinterpret_cast<FoliageStr*>(Data);
	
    const int DataLength = Foliage.Density * Foliage.Density * 16;
    float* Matrices = new float[DataLength];
	
    double step = Foliage.Size / Foliage.Density;
    for (size_t x = 0; x < Foliage.Density; ++x) {
        for (size_t y = 0; y < Foliage.Density; ++y) {
            double realX = Foliage.PosX + x * step - Foliage.Size / 2 + (rand() * 10000 % 10000) / 10000.0 * step;
            double realY = Foliage.PosY + y * step - Foliage.Size / 2 + (rand() * 10000 % 10000) / 10000.0 * step;
            translateMatrix(&Matrices[(x + y * Foliage.Density) * 16], realX, realY, generator.GetAltitudeAtLocation(realX, realY) + 6);
        }
    }
	
    emscripten_worker_respond(reinterpret_cast<char*>(Matrices), DataLength * sizeof(float));
}

size_t counter = 0;

void BuildLandscapeSection(char* Data, int Size) {

	const struct LandscapeStr {
		int Density;
		double PosX;
		double PosY;
		double Size;
	} Landscape = *reinterpret_cast<LandscapeStr*>(Data);

	const int VerticeCount = (Landscape.Density + 3) * (Landscape.Density + 3) * 3;
	const int IndiceCount = (Landscape.Density + 2) * (Landscape.Density + 2) * 6;

	int DataSize = VerticeCount * sizeof(float) * 2 + IndiceCount * sizeof(int) + sizeof(int) * 2;
	void* VertexData = std::malloc(DataSize);

	*static_cast<int*>(VertexData) = VerticeCount;
	*(static_cast<int*>(VertexData) + 1) = IndiceCount;
	
	int* Indices = static_cast<int*>(VertexData) + 2;
	float* VerticexPositions = static_cast<float*>(VertexData) + 2 + IndiceCount;
	float* VertexColors = static_cast<float*>(VertexData) + 2 + IndiceCount + VerticeCount;

	double CellSize = Landscape.Size / Landscape.Density;

	int VerticesPerChunk = Landscape.Density + 3;
	int FacesPerChunk = Landscape.Density + 2;
	
	double OffsetX = Landscape.PosX - Landscape.Size / 2;
	double OffsetY = Landscape.PosY - Landscape.Size / 2;

	/* Generate vertices */
	for (int x = 0; x < VerticesPerChunk; ++x) {
		for (int y = 0; y < VerticesPerChunk; ++y) {
			
			double PosX = (x - 1) * CellSize + OffsetX;
			double PosY = (y - 1) * CellSize + OffsetY;

			int VertexIndex = (x + y * VerticesPerChunk) * 3;
			
			VerticexPositions[VertexIndex] = PosX;
			VerticexPositions[VertexIndex + 1] = PosY;
			VerticexPositions[VertexIndex + 2] = generator.GetAltitudeAtLocation(PosX, PosY);

			VertexColors[VertexIndex] = 0;
			VertexColors[VertexIndex + 1] = 0;
			VertexColors[VertexIndex + 1] = 0;			
		}
	}

	/* Generate indices */
	for (int x = 0; x < FacesPerChunk; ++x)	{
		for (int y = 0; y < FacesPerChunk; ++y) {


			int IndiceIndex = (x + y * FacesPerChunk) * 6;
			
			Indices[IndiceIndex] = (x + y * VerticesPerChunk);
			Indices[IndiceIndex + 1] = (x + 1 + y * VerticesPerChunk);
			Indices[IndiceIndex + 2] = (x + 1 + (y + 1) * VerticesPerChunk);
			
			Indices[IndiceIndex + 3] = (x + y * VerticesPerChunk);
			Indices[IndiceIndex + 4] = (x + 1 + (y + 1) * VerticesPerChunk);
			Indices[IndiceIndex + 5] = (x + (y + 1) * VerticesPerChunk);			
		}		
	}	

	emscripten_worker_respond(reinterpret_cast<char*>(VertexData), DataSize);
}