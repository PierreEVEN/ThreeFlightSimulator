
#if defined __has_include && __has_include("emscripten.h")
#include <emscripten.h>
#define PROJECT_API EMSCRIPTEN_KEEPALIVE
#else
#define PROJECT_API
#endif

#include <cstdint>
#include <cmath>

#include "libs/FastNoiseLite.h"

#include "types/Matrix.h"

#include <iostream>

extern "C" {	
	double getAltitudeAtLocation(double posX, double posY);
	void init();
    uint64_t applyMatrixData(float* data, int density, double posX, double posY, double size);
}



void translateMatrix(float* data, float x, float y, float z) {
    SMatrix4 matrix;

    matrix.Translate(SVector(x, y, z));

    std::memcpy(data, matrix.coords, 16 * sizeof(float));
}

uint64_t PROJECT_API applyMatrixData(float* data, int density, double posX, double posY, double size) {

    double step = size / density;
    for (size_t x = 0; x < density; ++x) {
        for (size_t y = 0; y < density; ++y) {
            double realX = posX + x * step - size / 2 + (rand() * 10000 % 10000) / 10000.0 * step ;
            double realY = posY + y * step - size / 2 + (rand() * 10000 % 10000) / 10000.0 * step;
            translateMatrix(&data[(x + y * density) * 16], realX, realY, getAltitudeAtLocation(realX, realY) + 4);
        }
    }

    return density * density;
}



struct FoliageGenerationRequest {
    FoliageGenerationRequest(double x, double y, double size, uint32_t density) {

    }


};




FastNoiseLite noise(100);
FastNoiseLite mountainLevelNoise(2000);
FastNoiseLite hillLevelNoise(50000);





void PROJECT_API init() {
    noise.SetNoiseType(FastNoiseLite::NoiseType_ValueCubic);
    noise.SetFractalType(FastNoiseLite::FractalType_Ridged);
    noise.SetFractalOctaves(8);
    noise.SetFractalLacunarity(2);


    mountainLevelNoise.SetNoiseType(FastNoiseLite::NoiseType_Perlin);
    mountainLevelNoise.SetFractalType(FastNoiseLite::FractalType_Ridged);
    mountainLevelNoise.SetFractalOctaves(5);
    mountainLevelNoise.SetFractalLacunarity(2);

    hillLevelNoise.SetFractalType(FastNoiseLite::FractalType_FBm);
    mountainLevelNoise.SetFractalOctaves(3);
}

double getMountainLevel(double posX, double posY) {
    double scale = 0.001;
    double level = 1.5 - mountainLevelNoise.GetNoise<double>(posX * scale, posY * scale) * 1.5;
    level -= 0.5;

    return level;
}

double getHillsLevel(double posX, double posY, double mountainLevel) {
    double scale = 0.01;
    return hillLevelNoise.GetNoise<double>(posX * scale, posY * scale) * (1 - pow(abs(mountainLevel), 1));
}

double addBeaches(double posX, double posY, double currentAltitude) {
    return currentAltitude > 5 ? currentAltitude + 20 : currentAltitude;
}
	
double PROJECT_API getAltitudeAtLocation(double posX, double posY) {

    posX += 100000;
    posY += 10000;

    double mountainLevel = getMountainLevel(posX, posY);

	double alt = mountainLevel * 800;

	float scale = 0.01;
    double mountainNoise = pow(noise.GetNoise<double>(posX * scale, posY * scale), 2) * 3000;

    alt +=  mountainLevel * mountainNoise;

    alt += getHillsLevel(posX, posY, mountainLevel) * 200;

    alt = addBeaches(posX, posY, alt);

	return alt;
}