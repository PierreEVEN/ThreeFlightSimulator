cmake_minimum_required(VERSION 3.8)

set_property(GLOBAL PROPERTY USE_FOLDERS ON)

project(TSFwasm)

file(GLOB_RECURSE SOURCES src/*.cpp src/*.h src/*.hpp src/*.c)
add_executable(TSFwasm_NONE ${SOURCES})