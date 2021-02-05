#pragma once

#include <iostream>

#include "JobPool.h"
#include "Job.h"


class Worker
{
public:
	Worker(IObjectPool<IJob>& UsedPool)
		: Pool(UsedPool) {
		NextAction();		
	}

	static void WakeUp() {
		std::cout << "release worker" << std::endl;
		WakeUpWorkerConditionVariable.notify_one();
	}
	
private:

	void NextAction() {
		std::cout << "searching for jobs" << std::endl;
		while (IJob* FoundJob = Pool.Pop()) {
			std::cout << "Found job" << std::endl;
			FoundJob->Execute();
			delete FoundJob;
		}
		std::cout << "all job done, going to sleep" << std::endl;
		Sleep();
	}

	void Sleep() {
		std::unique_lock<std::mutex> WakeUpWorkerLock(ReleaseThreadsMutex);
		WakeUpWorkerConditionVariable.wait(WakeUpWorkerLock);
		std::cout << "TADADAA" << std::endl;
		//NextAction();
	}

	static std::condition_variable WakeUpWorkerConditionVariable;
	IObjectPool<IJob>& Pool;
	std::mutex ReleaseThreadsMutex;
};
