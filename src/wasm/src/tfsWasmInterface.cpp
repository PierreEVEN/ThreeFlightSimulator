
#if defined __has_include && __has_include("emscripten.h")
#include <emscripten.h>
#define PROJECT_API EMSCRIPTEN_KEEPALIVE
#define WITH_EMSCRIPTEN true
#else
#define WITH_EMSCRIPTEN false
#define PROJECT_API
#endif

#include <cstdint>
#include <cmath>
#include <fstream>
#include <string>

#include "libs/FastNoiseLite.h"
#include "types/Matrix.h"

void log(const std::string& text) {
#if WITH_EMSCRIPTEN
    emscripten_run_script(("console.log('" + text + "')").c_str());
#endif
}

extern "C" {	
	double getAltitudeAtLocation(double posX, double posY);
	void init();
    int applyMatrixData(int commandID, float* data, int density, double posX, double posY, double size);
    int allocMemory(int size);
    void freeMemory(void* memory);
}

uint8_t* lastMem = 0;

uint8_t* randMem;

int PROJECT_API allocMemory(int size) {
    uint8_t* mem = new uint8_t[size];
    lastMem = mem;
    return (int)lastMem;
}

void PROJECT_API freeMemory(void* memory) {
    free(memory);
}


void translateMatrix(float* data, float x, float y, float z) {
    SMatrix4 matrix;
    matrix.Translate(SVector(x, y, z));

    std::memcpy(data, matrix.coords, 16 * sizeof(float));
}

int PROJECT_API applyMatrixData(int commandID, float* data, int density, double posX, double posY, double size) {
    data = (float*)allocMemory(density * 64);
    double step = size / density;
    for (size_t x = 0; x < density; ++x) {
        for (size_t y = 0; y < density; ++y) {
            double realX = posX + x * step - size / 2 + (rand() * 10000 % 10000) / 10000.0 * step ;
            double realY = posY + y * step - size / 2 + (rand() * 10000 % 10000) / 10000.0 * step;
            translateMatrix(&data[(x + y * density) * 16], realX, realY, getAltitudeAtLocation(realX, realY) + 4);
        }
    }

    data[0] = 1;
    data[1] = 10564;
    data[3] = 874789;
    data[5] = 9789744;
    data[9] = 25744254;

    return (int)lastMem;
}




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

    log("Wasm module initialized");
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