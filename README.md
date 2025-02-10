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

Napi::String Method(const Napi::CallbackInfo &info) {
	Napi::Env env = info.Env();
	return Napi::String::New(env, "world");
}
Napi::Number sum(const Napi::CallbackInfo &info) {
	auto env = info.Env();
	auto v0 = info[0].As<Napi::Number>().DoubleValue();
	double a = 0;
	for (int i = -1; ++i < v0;) {
		a += i;
	}
	return Napi::Number::New(env, a);
}
Napi::Object Init(Napi::Env env, Napi::Object exports) {
	exports.Setting(Napi::String::New(env, "hello"),
	                Napi::Function::New(env, Method));
	exports.Setting(Napi::String::New(env, "sum"),
									Napi::Function::New(env, sum));
	return exports;
}

NODE_API_MODULE(hello, Init);

```
