#pragma once
#include <mutex>

template<typename T>
class IObjectPool {
public:
	virtual void Push(T* Item) = 0;
	virtual T* Pop() = 0;
};
	
template<typename T, const size_t Size>
class TObjectPool final : public IObjectPool<T> {
public:

	TObjectPool()
		: Bottom(0), Top(0) {}

	~TObjectPool() {
		while (T* FoundJob = Pop()) {
			delete FoundJob;
		}
	}

	void Push(T* Item) override {
		Lock.lock();

		Pool[Bottom] = Item;
		Bottom = (Bottom + 1) % Size;
		
		
		Lock.unlock();
	}

	T* Pop() override {
		T* Item = nullptr;
		Lock.lock();

		if (Top != Bottom) {
			Top = (Bottom + 1) % Size;
			Item = Pool[Top];
		}		
		Lock.unlock();
		return Item;
	}

private:

	T* Pool[Size];

	size_t Bottom;
	size_t Top;
	
	std::mutex Lock;
};
