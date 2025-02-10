### STEP
1. put in vite plugin and install node-gyp , deps
2. import
#### ts & vue
```vue
<template>
  <Button @click="test()"></Button>
</template>
<script lang="ts" setup>
import api from "./hello.cc"
const test = () => {
  api.hello()
}
</script>
 ```
### c
```cpp
#include <napi.h>

Napi::String Method(const Napi::CallbackInfo& info) {
	Napi::Env env = info.Env();
	return Napi::String::New(env, "world");
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
	exports.Setting(Napi::String::New(env, "hello"),
							Napi::Function::New(env, Method));
	return exports;
}

NODE_API_MODULE(hello, Init)
```
