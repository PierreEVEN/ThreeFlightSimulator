#pragma once

namespace Maths
{

	template<typename T>
	inline const T GetMax(const T& inA, const T& inB) {
		return inA > inB ? inA : inB;
	}

	template<typename T>
	inline const T GetMin(const T& inA, const T& inB) {
		return inA < inB ? inA : inB;
	}

	template<typename T>
	inline const T Clamp(const T& inValue, const T& min, const T& max) {
		return inValue > max ? max : inValue < min ? min : inValue;
	}

	template<typename T>
	inline const T Floor(const T& inValue) {
		return static_cast<T>(static_cast<int64_t>(inValue));
	}

	template<typename T>
	inline const T Ceil(const T& inValue) {
		T intValue = static_cast<T>(static_cast<int64_t>(inValue));;
		return intValue == inValue ? inValue : intValue + 1;
	}
}