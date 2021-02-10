#pragma once

#include "../libs/FastNoiseLite.h"
#define _USE_MATH_DEFINES
#include <math.h>

class HeightGenerator
{
public:
	HeightGenerator()
	{
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

    double GetAltitudeAtLocation(double posX, double posY) {

        posX += 100000;
        posY += 10000;

        double mountainLevel = getMountainLevel(posX, posY);

        double alt = mountainLevel * 800;

        float scale = 0.01;
        double mountainNoise = pow(noise.GetNoise<double>(posX * scale, posY * scale), 2) * 3000;

        alt += mountainLevel * mountainNoise;

        alt += getHillsLevel(posX, posY, mountainLevel) * 200;

        alt = addBeaches(posX, posY, alt);

        return alt;
    }

private:

    FastNoiseLite noise = FastNoiseLite(8);
    FastNoiseLite mountainLevelNoise = FastNoiseLite(37);
    FastNoiseLite hillLevelNoise = FastNoiseLite(123);
    FastNoiseLite cliffNoise = FastNoiseLite(254);


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

        return currentAltitude;
    }
	


};
