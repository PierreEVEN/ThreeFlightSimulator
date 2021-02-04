#pragma once

#include <cstring>
#include "Vector.h"
#include "Rotator.h"

template<typename T>
struct IMatrix3 final
{
		inline IMatrix3() : IMatrix3(1) {}
	inline IMatrix3(const T& scalar) :
		x1(scalar), x2(0), x3(0),
		y1(0), y2(scalar), y3(0),
		z1(0), z2(0), z3(scalar)
	{ }

	inline const IVector3<T>& operator[](const size_t& elem) const { return rows[elem]; }

	union
	{
		struct {
			T
				x1, x2, x3,
				y1, y2, y3,
				z1, z2, z3;
		};
		struct {
			IVector3<T>
				a,
				b,
				c;
		};
		IVector3<T> rows[3];
		T coords[9];
	};
};


template<typename T>
struct IMatrix4 final
{
	inline IMatrix4() : IMatrix4(1) {}
	inline IMatrix4(IVector4<T> ina, IVector4<T> inb, IVector4<T> inc, IVector4<T> ind) : a(ina), b(inb), c(inc), d(ind) {}
	inline IMatrix4(const IMatrix4<T>& other) { memcpy(coords, other.coords, sizeof(coords)); }
	inline IMatrix4(const IMatrix4<T>&& other) { memcpy(coords, other.coords, sizeof(coords)); }
	inline IMatrix4(const T& scalar) :
		x1(scalar), x2(0), x3(0), x4(0),
		y1(0), y2(scalar), y3(0), y4(0),
		z1(0), z2(0), z3(scalar), z4(0),
		w1(0), w2(0), w3(0), w4(scalar)
	{}
	inline IMatrix4(T* data) :
	    x1(data[0]), x2(data[1]), x3(data[2]), x4(data[3]),
	    y1(data[4]), y2(data[5]), y3(data[6]), y4(data[7]),
	    z1(data[8]), z2(data[9]), z3(data[10]), z4(data[11]),
	    w1(data[12]), w2(data[13]), w3(data[14]), w4(data[15]) {}
	inline IMatrix4(const IQuaternion<T>& quat)
		: IMatrix4(1)
	{
		Rotate(quat);
	}

	inline IMatrix4(const IVector3<T>& pos, const IQuaternion<T>& rot, const IVector3<T>& scale)
		: IMatrix4(1)
	{
		Translate(pos);
		Rotate(rot);
		Scale(scale);
	}

	inline void Translate(const IVector3<T>& translation) {
		d = a * translation.x + b * translation.y + c * translation.z + d;
	}

	inline void Rotate(const IQuaternion<T>& quat) {
		const T qxx(quat.x * quat.x);
		const T qyy(quat.y * quat.y);
		const T qzz(quat.z * quat.z);
		const T qxz(quat.x * quat.z);
		const T qxy(quat.x * quat.y);
		const T qyz(quat.y * quat.z);
		const T qwx(quat.w * quat.x);
		const T qwy(quat.w * quat.y);
		const T qwz(quat.w * quat.z);

		a.x = T(1) - T(2) * (qyy + qzz);
		a.y = T(2) * (qxy + qwz);
		a.z = T(2) * (qxz - qwy);

		b.x = T(2) * (qxy - qwz);
		b.y = T(1) - T(2) * (qxx + qzz);
		b.z = T(2) * (qyz + qwx);

		c.x = T(2) * (qxz + qwy);
		c.y = T(2) * (qyz - qwx);
		c.z = T(1) - T(2) * (qxx + qyy);
	}

	inline void Scale(const IVector3<T>& scale) {
		a = a * scale.x;
		b = b * scale.y;
		c = c * scale.z;
		d = d;
	}


	/** From glm library, see https://github.com/g-truc/glm/ */
	bool Decompose(IVector3<T>& Scale, IQuaternion<T>& Orientation, IVector3<T>& Translation, IVector3<T>& Skew, IVector4<T>& Perspective)
	{
		IMatrix4<T> LocalMatrix(*this);

		// Normalize the matrix.
		if (epsilonEqual(LocalMatrix[3][3], static_cast<T>(0), epsilon<T>()))
			return false;

		for (size_t i = 0; i < 4; ++i)
			for (size_t j = 0; j < 4; ++j)
				LocalMatrix[i][j] /= LocalMatrix[3][3];

		// perspectiveMatrix is used to solve for perspective, but it also provides
		// an easy way to test for singularity of the upper 3x3 component.
		IMatrix4<T> PerspectiveMatrix(LocalMatrix);

		for (size_t i = 0; i < 3; i++)
			PerspectiveMatrix[i][3] = static_cast<T>(0);
		PerspectiveMatrix[3][3] = static_cast<T>(1);

		/// TODO: Fixme!
		if (epsilonEqual(PerspectiveMatrix.Determinant(), static_cast<T>(0), epsilon<T>()))
			return false;

		// First, isolate perspective.  This is the messiest.
		if (
			epsilonNotEqual(LocalMatrix[0][3], static_cast<T>(0), epsilon<T>()) ||
			epsilonNotEqual(LocalMatrix[1][3], static_cast<T>(0), epsilon<T>()) ||
			epsilonNotEqual(LocalMatrix[2][3], static_cast<T>(0), epsilon<T>()))
		{
			// rightHandSide is the right hand side of the equation.
			IVector4<T> RightHandSide;
			RightHandSide[0] = LocalMatrix[0][3];
			RightHandSide[1] = LocalMatrix[1][3];
			RightHandSide[2] = LocalMatrix[2][3];
			RightHandSide[3] = LocalMatrix[3][3];

			// Solve the equation by inverting PerspectiveMatrix and multiplying
			// rightHandSide by the inverse.  (This is the easiest way, not
			// necessarily the best.)
			IMatrix4<T> InversePerspectiveMatrix = PerspectiveMatrix.Inverse();//   inverse(PerspectiveMatrix, inversePerspectiveMatrix);
			IMatrix4<T> TransposedInversePerspectiveMatrix = InversePerspectiveMatrix.Transpose();//   transposeMatrix4(inversePerspectiveMatrix, transposedInversePerspectiveMatrix);

			Perspective = TransposedInversePerspectiveMatrix * RightHandSide;
			//  v4MulPointByMatrix(rightHandSide, transposedInversePerspectiveMatrix, perspectivePoint);

			// Clear the perspective partition
			LocalMatrix[0][3] = LocalMatrix[1][3] = LocalMatrix[2][3] = static_cast<T>(0);
			LocalMatrix[3][3] = static_cast<T>(1);
		}
		else
		{
			// No perspective.
			Perspective = IVector4<T>(0, 0, 0, 1);
		}

		// Next take care of translation (easy).
		Translation = IVector3<T>(LocalMatrix[3]);
		LocalMatrix[3] = IVector4<T>(0, 0, 0, LocalMatrix[3].w);

		IVector3<T> Row[3], Pdum3;

		// Now get scale and shear.
		for (size_t i = 0; i < 3; ++i)
			for (size_t j = 0; j < 3; ++j)
				Row[i][j] = LocalMatrix[i][j];


		// Compute X scale factor and normalize first row.
		Scale.x = Row[0].Length();// v3Length(Row[0]);

		Row[0] = Row[0].Scale(static_cast<T>(1));

		// Compute XY shear factor and make 2nd row orthogonal to 1st.
		Skew.z = IVector3<T>::Dot(Row[0], Row[1]);
		Row[1] = IVector3<T>::Combine(Row[1], Row[0], static_cast<T>(1), -Skew.z);

		// Now, compute Y scale and normalize 2nd row.
		Scale.y = Row[1].Length();
		Row[1] = Row[1].Scale(static_cast<T>(1));
		Skew.z /= Scale.y;

		// Compute XZ and YZ shears, orthogonalize 3rd row.
		Skew.y = IVector3<T>::Dot(Row[0], Row[2]);
		Row[2] = IVector3<T>::Combine(Row[2], Row[0], static_cast<T>(1), -Skew.y);
		Skew.x = IVector3<T>::Dot(Row[1], Row[2]);
		Row[2] = IVector3<T>::Combine(Row[2], Row[1], static_cast<T>(1), -Skew.x);

		// Next, get Z scale and normalize 3rd row.
		Scale.z = Row[2].Length();
		Row[2] = Row[2].Scale(static_cast<T>(1));
		Skew.y /= Scale.z;
		Skew.x /= Scale.z;

		// At this point, the matrix (in rows[]) is orthonormal.
		// Check for a coordinate system flip.  If the determinant
		// is -1, then negate the matrix and the scaling factors.
		Pdum3 = IVector3<T>::Cross(Row[1], Row[2]); // v3Cross(row[1], row[2], Pdum3);
		if (IVector3<T>::Dot(Row[0], Pdum3) < 0)
		{
			for (size_t i = 0; i < 3; i++)
			{
				Scale[i] *= static_cast<T>(-1);
				Row[i] *= static_cast<T>(-1);
			}
		}

		int i, j, k = 0;
		T root, trace = Row[0].x + Row[1].y + Row[2].z;
		if (trace > static_cast<T>(0))
		{
			root = sqrt(trace + static_cast<T>(1.0));
			Orientation.w = static_cast<T>(0.5) * root;
			root = static_cast<T>(0.5) / root;
			Orientation.x = root * (Row[1].z - Row[2].y);
			Orientation.y = root * (Row[2].x - Row[0].z);
			Orientation.z = root * (Row[0].y - Row[1].x);
		}
		else
		{
			static int Next[3] = { 1, 2, 0 };
			i = 0;
			if (Row[1].y > Row[0].x) i = 1;
			if (Row[2].z > Row[i][i]) i = 2;
			j = Next[i];
			k = Next[j];

			root = sqrt(Row[i][i] - Row[j][j] - Row[k][k] + static_cast<T>(1.0));

			Orientation[i] = static_cast<T>(0.5) * root;
			root = static_cast<T>(0.5) / root;
			Orientation[j] = root * (Row[i][j] + Row[j][i]);
			Orientation[k] = root * (Row[i][k] + Row[k][i]);
			Orientation.w = root * (Row[j][k] - Row[k][j]);
		}

		return true;
	}

	IMatrix4<T> Inverse() const
	{
		T Coef00 = rows[2][2] * rows[3][3] - rows[3][2] * rows[2][3];
		T Coef02 = rows[1][2] * rows[3][3] - rows[3][2] * rows[1][3];
		T Coef03 = rows[1][2] * rows[2][3] - rows[2][2] * rows[1][3];

		T Coef04 = rows[2][1] * rows[3][3] - rows[3][1] * rows[2][3];
		T Coef06 = rows[1][1] * rows[3][3] - rows[3][1] * rows[1][3];
		T Coef07 = rows[1][1] * rows[2][3] - rows[2][1] * rows[1][3];

		T Coef08 = rows[2][1] * rows[3][2] - rows[3][1] * rows[2][2];
		T Coef10 = rows[1][1] * rows[3][2] - rows[3][1] * rows[1][2];
		T Coef11 = rows[1][1] * rows[2][2] - rows[2][1] * rows[1][2];

		T Coef12 = rows[2][0] * rows[3][3] - rows[3][0] * rows[2][3];
		T Coef14 = rows[1][0] * rows[3][3] - rows[3][0] * rows[1][3];
		T Coef15 = rows[1][0] * rows[2][3] - rows[2][0] * rows[1][3];

		T Coef16 = rows[2][0] * rows[3][2] - rows[3][0] * rows[2][2];
		T Coef18 = rows[1][0] * rows[3][2] - rows[3][0] * rows[1][2];
		T Coef19 = rows[1][0] * rows[2][2] - rows[2][0] * rows[1][2];

		T Coef20 = rows[2][0] * rows[3][1] - rows[3][0] * rows[2][1];
		T Coef22 = rows[1][0] * rows[3][1] - rows[3][0] * rows[1][1];
		T Coef23 = rows[1][0] * rows[2][1] - rows[2][0] * rows[1][1];

		IVector4<T> Fac0(Coef00, Coef00, Coef02, Coef03);
		IVector4<T> Fac1(Coef04, Coef04, Coef06, Coef07);
		IVector4<T> Fac2(Coef08, Coef08, Coef10, Coef11);
		IVector4<T> Fac3(Coef12, Coef12, Coef14, Coef15);
		IVector4<T> Fac4(Coef16, Coef16, Coef18, Coef19);
		IVector4<T> Fac5(Coef20, Coef20, Coef22, Coef23);

		IVector4<T> Vec0(rows[1][0], rows[0][0], rows[0][0], rows[0][0]);
		IVector4<T> Vec1(rows[1][1], rows[0][1], rows[0][1], rows[0][1]);
		IVector4<T> Vec2(rows[1][2], rows[0][2], rows[0][2], rows[0][2]);
		IVector4<T> Vec3(rows[1][3], rows[0][3], rows[0][3], rows[0][3]);

		IVector4<T> Inv0(Vec1 * Fac0 - Vec2 * Fac1 + Vec3 * Fac2);
		IVector4<T> Inv1(Vec0 * Fac0 - Vec2 * Fac3 + Vec3 * Fac4);
		IVector4<T> Inv2(Vec0 * Fac1 - Vec1 * Fac3 + Vec3 * Fac5);
		IVector4<T> Inv3(Vec0 * Fac2 - Vec1 * Fac4 + Vec2 * Fac5);

		IVector4<T> SignA(+1, -1, +1, -1);
		IVector4<T> SignB(-1, +1, -1, +1);
		IMatrix4<T> inv(Inv0 * SignA, Inv1 * SignB, Inv2 * SignA, Inv3 * SignB);

		IVector4<T> Row0(inv[0][0], inv[1][0], inv[2][0], inv[3][0]);

		IVector4<T> Dot0(rows[0] * Row0);
		T Dot1 = (Dot0.x + Dot0.y) + (Dot0.z + Dot0.w);

		T OneOverDeterminant = static_cast<T>(1) / Dot1;

		return inv * OneOverDeterminant;
	}

	inline IMatrix4<T> Transpose()
	{
		IMatrix4<T> Result;
		Result[0][0] = rows[0][0];
		Result[0][1] = rows[1][0];
		Result[0][2] = rows[2][0];
		Result[0][3] = rows[3][0];

		Result[1][0] = rows[0][1];
		Result[1][1] = rows[1][1];
		Result[1][2] = rows[2][1];
		Result[1][3] = rows[3][1];

		Result[2][0] = rows[0][2];
		Result[2][1] = rows[1][2];
		Result[2][2] = rows[2][2];
		Result[2][3] = rows[3][2];

		Result[3][0] = rows[0][3];
		Result[3][1] = rows[1][3];
		Result[3][2] = rows[2][3];
		Result[3][3] = rows[3][3];
		return Result;
	}

	inline T Determinant()
	{
		T SubFactor00 = rows[2][2] * rows[3][3] - rows[3][2] * rows[2][3];
		T SubFactor01 = rows[2][1] * rows[3][3] - rows[3][1] * rows[2][3];
		T SubFactor02 = rows[2][1] * rows[3][2] - rows[3][1] * rows[2][2];
		T SubFactor03 = rows[2][0] * rows[3][3] - rows[3][0] * rows[2][3];
		T SubFactor04 = rows[2][0] * rows[3][2] - rows[3][0] * rows[2][2];
		T SubFactor05 = rows[2][0] * rows[3][1] - rows[3][0] * rows[2][1];

		IVector4<T> DetCof(
			+(rows[1][1] * SubFactor00 - rows[1][2] * SubFactor01 + rows[1][3] * SubFactor02),
			-(rows[1][0] * SubFactor00 - rows[1][2] * SubFactor03 + rows[1][3] * SubFactor04),
			+(rows[1][0] * SubFactor01 - rows[1][1] * SubFactor03 + rows[1][3] * SubFactor05),
			-(rows[1][0] * SubFactor02 - rows[1][1] * SubFactor04 + rows[1][2] * SubFactor05));

		return
			rows[0][0] * DetCof[0] + rows[0][1] * DetCof[1] +
			rows[0][2] * DetCof[2] + rows[0][3] * DetCof[3];
	}

	inline IVector3<T> GetTranslation() const {
		return IVector3<T>(d.x, d.y, d.z);
	}

	inline IMatrix4<T>& operator=(const IMatrix4<T>& other) { memcpy(coords, other.coords, sizeof(coords)); return *this; }

	inline const IVector4<T>& operator[](const size_t& elem) const { return rows[elem]; }

	inline IVector4<T>& operator[](const size_t& elem) { return rows[elem]; }

	inline const IMatrix4<T> operator *(const IMatrix4<T>& other) const {
		const IVector4<T> oa = other.a;
		const IVector4<T> ob = other.b;
		const IVector4<T> oc = other.c;
		const IVector4<T> od = other.d;

		IMatrix4<T> result;
		result.a = a * oa.x + b * oa.y + c * oa.z + d * oa.w;
		result.b = a * ob.x + b * ob.y + c * ob.z + d * ob.w;
		result.c = a * oc.x + b * oc.y + c * oc.z + d * oc.w;
		result.d = a * od.x + b * od.y + c * od.z + d * od.w;
		return result;
	}

	inline const IVector4<T> operator *(const IVector4<T>& other) const {
		T Mov0 = other[0];
		T Mov1 = other[1];
		IVector4<T> const Mul0 = rows[0] * Mov0;
		IVector4<T> const Mul1 = rows[1] * Mov1;
		IVector4<T> const Add0 = Mul0 + Mul1;
		T const Mov2(other[2]);
		T const Mov3(other[3]);
		IVector4<T> const Mul2 = rows[2] * Mov2;
		IVector4<T> const Mul3 = rows[3] * Mov3;
		IVector4<T> const Add1 = Mul2 + Mul3;
		IVector4<T> const Add2 = Add0 + Add1;
		return Add2;
	}

	inline const IMatrix4<T> operator *(const T& other) const {
		return IMatrix4<T>(
			a * other,
			b * other,
			c * other,
			d * other
			);
	}

	union
	{
		struct {
			T
				x1, x2, x3, x4,
				y1, y2, y3, y4,
				z1, z2, z3, z4,
				w1, w2, w3, w4;
		};
		struct {
			IVector4<T>
				a,
				b,
				c,
				d;
		};

		IVector4<T> rows[4];
		T coords[16];
	};


private:

	template<typename genType>
	static constexpr genType epsilon()
	{
		return std::numeric_limits<genType>::epsilon();
	}

	static bool epsilonEqual
	(
		float const& x,
		float const& y,
		float const& epsilon
	)
	{
		return abs(x - y) < epsilon;
	}


	static bool epsilonEqual(
		double const& x,
		double const& y,
		double const& epsilon
	) {
		return abs(x - y) < epsilon;
	}

	static bool epsilonNotEqual(float const& x, float const& y, float const& epsilon)
	{
		return abs(x - y) >= epsilon;
	}

	static bool epsilonNotEqual(double const& x, double const& y, double const& epsilon)
	{
		return abs(x - y) >= epsilon;
	}
};

typedef IMatrix3<float> SMatrix3;
typedef IMatrix4<float> SMatrix4;
typedef IMatrix3<double> SMatrix3Double;
typedef IMatrix4<double> SMatrix4Double;


namespace Matrix
{
	inline const SMatrix4 MakePerspectiveMatrix(float fov, float aspectRatio, float zNear, float zFar) {
		float const tanHalfFovy = tan(fov / 2.f);

		SMatrix4 Result(0.f);
		Result.a.x = 1.f / (aspectRatio * tanHalfFovy);
		Result.b.y = 1.f / (tanHalfFovy);
		Result.c.z = -(zFar + zNear) / (zFar - zNear);
		Result.c.w = -1.f;
		Result.d.z = -(2.f * zFar * zNear) / (zFar - zNear);
		return Result;
	}

	inline const SMatrix4 MakeLookAtMatrix(const SVector& cameraLocation, const SVector& viewTarget, const SVector& upVector)
	{
		SVector const f(SVector::Normalize(viewTarget - cameraLocation));
		SVector const s(SVector::Normalize(SVector::Cross(f, upVector)));
		SVector const u(SVector::Cross(s, f));

		SMatrix4 Result(1);
		Result[0][0] = s.x;
		Result[1][0] = s.y;
		Result[2][0] = s.z;
		Result[0][1] = u.x;
		Result[1][1] = u.y;
		Result[2][1] = u.z;
		Result[0][2] = -f.x;
		Result[1][2] = -f.y;
		Result[2][2] = -f.z;
		Result[3][0] = -SVector::Dot(s, cameraLocation);
		Result[3][1] = -SVector::Dot(u, cameraLocation);
		Result[3][2] = SVector::Dot(f, cameraLocation);
		return Result;
	}

}
