cmake_minimum_required(VERSION 3.8)

project(TSFwasm)
set_property(GLOBAL PROPERTY USE_FOLDERS ON)

file(GLOB_RECURSE SOURCES src/*.cpp src/*.h src/*.hpp src/*.c)
add_executable(TSFwasm_NONE ${SOURCES})