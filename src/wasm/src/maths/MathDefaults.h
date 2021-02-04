#pragma once

double G_PI = 3.14159265358979323846;   // pi
float G_FPI = static_cast<float>(3.14159265358979323846);   // pi

template<typename T>
inline const T DegresToRadian(const T& degres) {
	return degres * static_cast<T>(0.01745329251994329576923690768489);
}

template<typename T>
inline const T RadiansToDegres(const T& radians) {
	return radians * static_cast<T>(57.295779513082320876798154814105);
}