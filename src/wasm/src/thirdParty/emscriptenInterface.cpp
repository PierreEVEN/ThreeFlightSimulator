#include "emscriptenInterface.h"

#include <string>

void emprint(const std::string& text) {
    emscripten_run_script(("console.log('" + text + "')").c_str());
}