#include <napi.h>
class Box {
public:
	Box(const Napi::Env env, const Napi::Object self): env(env), self(self) {
	}
	Napi::Env env;
	Napi::Object self;

	template<typename T>
	auto set(std::string key, T value) {
		self.Setting(Napi::String::New(env, key), box(env, value));
		return this;
	}
	auto del(std::string key) {
		self.Delete(Napi::String::New(env, key));
		return this;
	}
	template<typename O>
	auto def(std::string key, std::function<O()> value) {
		self.Setting(
			Napi::String::New(env, key),
			Napi::Function::New(env, [value](Napi::CallbackInfo &info) {
				return box(info.Env(), value());
			})
		);
		return this;
	}
	template<typename O>
	auto def(std::string key, std::function<O(double)> value) {
		self.Setting(
			Napi::String::New(env, key),
			Napi::Function::New(env, [value](Napi::CallbackInfo &info) {
				return box(
					info.Env(), value(
						info[0].As<Napi::Number>().DoubleValue()
					));
			})
		);
		return this;
	}
	template<typename O>
	auto def(std::string key, std::function<O(double, double)> value) {
		self.Setting(
			Napi::String::New(env, key),
			Napi::Function::New(env, [value](Napi::CallbackInfo &info) {
				return box(
					info.Env(), value(
						info[0].As<Napi::Number>().DoubleValue(),
						info[1].As<Napi::Number>().DoubleValue()
					));
			})
		);
		return this;
	}
	auto no() {
		return this;
	}

public:
	//[box]
	static auto box(Napi::Env env, Napi::Value value) {
		return value;
	}
	//[rank] 0
	static auto box(Napi::Env env, bool value) {
		return Napi::Boolean::New(env, value);
	}
	//[rank] 1 string > boolean
	static auto box(Napi::Env env, const char *value) {
		return Napi::String::New(env, value);
	}
	//[rank] 4 ...
	static auto box(Napi::Env env, int value) {
		return Napi::Number::New(env, value);
	}
	static auto box(Napi::Env env, double value) {
		return Napi::Number::New(env, value);
	}
	static auto box(Napi::Env env, long value) {
		return Napi::Number::New(env, value);
	}
	static auto box(Napi::Env env, short value) {
		return Napi::Number::New(env, value);
	}
	//[rank] 5 first match
	static auto box(Napi::Env env, float value) {
		return Napi::Number::New(env, value);
	}
	//[rank] 6 struct
	template<typename T>
	static auto box(Napi::Env env, std::vector<T> value) {
		auto size = value.size();
		auto array = Napi::Array::New(env, size);
		for (int i = -1; ++i < size;) {
			array.Setting(i, box(env, value.at(i)));
		}
		return array;
	}
	//
	template<typename O>
	static auto def(Napi::Env env, std::function<O(Napi::CallbackInfo)> fn) {
		return Napi::Function::New(env, [fn](Napi::CallbackInfo &info) {
			return fn(info);
		});
	}
};
