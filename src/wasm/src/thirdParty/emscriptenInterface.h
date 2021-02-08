#pragma once
#include <string>

#if defined __has_include && __has_include("emscripten.h")

#include <emscripten.h>
#define PROJECT_API EMSCRIPTEN_KEEPALIVE
#define WITH_EMSCRIPTEN true

#else  // __has_include("emscripten.h")

#define WITH_EMSCRIPTEN false
#define PROJECT_API

/* Fonction forward declaration */
typedef int worker_handle;
typedef void (*em_worker_callback_func)(char*, int, void*);
worker_handle emscripten_create_worker(const char*);
void emscripten_destroy_worker(worker_handle worker);
void emscripten_call_worker(worker_handle worker, const char* funcname, char* data, int size, em_worker_callback_func callback, void* arg);
void emscripten_worker_respond(char* data, int size);
void emscripten_worker_respond_provisionally(char* data, int size);
void emscripten_run_script(const char* data);

#endif // __has_include("emscripten.h")




void emprint(const std::string& text);