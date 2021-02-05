#pragma once
#include <vector>

#include "Job.h"
#include "JobPool.h"
#include "Worker.h"
#include <thread>

#define CPU_THREAD_COUNT (std::thread::hardware_concurrency() - 1)

class JobSystem final {
public:
	JobSystem()	{
		std::cout << "Starting job system with " << CPU_THREAD_COUNT << " workers" << std::endl;
		Workers = static_cast<Worker*>(std::malloc(CPU_THREAD_COUNT * sizeof(Worker)));

		//new std::thread(CreateWorker);

		
	}

	static void CreateWorker()
	{
	}

	template<typename Lambda>
	void NewJob(Lambda&& InLambda) {
		JobPool.Push(new TJob<Lambda>(std::forward<Lambda>(InLambda)));
		Worker::WakeUp();
	}
	
private:
	Worker* Workers;
	TObjectPool<Worker, 256> WorkerPool;
	TObjectPool<IJob, 256> JobPool;
};
