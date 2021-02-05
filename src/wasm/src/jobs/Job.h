#pragma once
#include <type_traits>

class IJob {
public:
	virtual ~IJob() {}
	virtual void Execute() = 0;	
};

template<typename Lambda>
class TJob final : public IJob  {
public:
	TJob(Lambda&& inLambda) : JobLambda(std::forward<Lambda>(inLambda)) {}
	
	void Execute() override { JobLambda(); }
private:
	Lambda JobLambda;
};