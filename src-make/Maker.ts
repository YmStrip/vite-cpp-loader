import {LoaderModule} from "./LoaderModule.ts";
import {FSWatcher} from "chokidar";
import {exec} from "node:child_process";
import {watch} from "chokidar";
import {rebuild} from "@electron/rebuild";

export class Maker {
	data: string
	arch: string
	platform: string
	watcher: FSWatcher
	changed = true
	name: string
	//reload version when dev
	reload = -1
	cache_path() {
		return this.loader.src(`${process.cwd()}/.cpp_loader_cache/${this.platform}-${this.arch}/${this.fi.replace(this.loader.src(process.cwd()), '')}`)
	}
	cache_path_copy() {
		return this.loader.src(`${process.cwd()}/.cpp_loader_cache/copy/${this.platform}${this.arch}/${this.fi.replace(this.loader.src(process.cwd()), '')}`)
	}
	build_path() {
		const folder = this.loader.debug ? 'Debug' : 'Release'
		return this.loader.src(`${this.cache_path()}/build/${folder}/${this.name}.node`)
	}
	build_path_copy() {
		const folder = this.loader.debug ? 'Debug' : 'Release'
		return this.loader.src(`${this.cache_path_copy()}/build/${folder}/${this.name}${this.reload > 0 ? this.reload : ''}.node`)
	}
	cache_init() {
		const path = this.cache_path()
		console.log(path)
		this.loader.setdir(path)
	}
	cache_clear() {
		const path = this.cache_path()
		this.loader.delpath(path)
	}
	includes() {
		return []
	}
	gyp() {
		const includes = this.includes()
		const path = this.cache_path() + '/binding.gyp'
		const target: any = {
			include_dirs: [],
			defines: ['NAPI_DISABLE_CPP_EXCEPTIONS'],
			"cflags!": ["-fno-exceptions"],
			"cflags_cc!": ["-fno-exceptions"]
		}
		//if exist fi.gyp , append config
		const json = this.loader.getjson(this.fi + '.gyp')
		if (json) for (const i in json) {
			target[i] = json[i]
		}
		if (!Array.isArray(target.include_dirs)) target.include_dirs = []
		if (!Array.isArray(target.sources)) target.sources = []
		//===================================
		//[config] name
		target.target_name = this.name
		//[config] source and deps
		target.sources.push(this.fi)
		target.include_dirs.push("<!@(node -p \"require('node-addon-api').include\")")
		for (const i of includes) target.include_dirs.push(i)
		this.loader.setfile(path, JSON.stringify({
			targets: [
				target
			]
		}, null, '\t'))
	}
	async build() {
		const time = Date.now()
		const cmd = [
			'node-gyp',
			'rebuild',
			`-j ${this.loader.jobs}`,
			`--loglevel=${this.loader.loglevel}`,
			this.loader.debug ? '--debug' : "",
			this.loader.make ? `--make=${this.loader.make}` : "",
			this.loader.gyp_option,
			`--arch=${this.arch}`,
			this.loader.electron ? `--dist-url=${this.loader.electron_url}` : ''
		]
		await new Promise((resolve, reject) => {
			this.loader.info(`build ${this.fi}`)
			exec(
				cmd.join(' '),
				{
					cwd: this.cache_path(),
				},
				(error, stdout, stderr) => {
					if (this.loader.logconsole) console.log(stdout)
					if (error) {
						const message = [`Build ${this.fi.split('/').pop()} Error`]
						message.push('reference: ' + this.fi)
						message.push('reference: \n' + stdout)
						message.push('reference: \n' + stderr)
						reject(message.join('\n'))
					}
					else {
						if (this.loader.dev) this.reload++
						const from = this.build_path()
						const to = this.build_path_copy()
						this.loader.setdir(this.loader.dirname(to))
						this.loader.copy(from, to)
						resolve(true)
					}
				})
		})
		this.loader.info(`build success in ${((Date.now() - time) / 1000).toFixed(2)}s`)
		this.changed = false
	}
	del() {
		this.loader.info(`remove ${this.fi}`)
		if (this.watcher) {
			this.watcher.close()
		}
		delete this.loader.maker[this.fi]
	}
	onchange() {
		this.gyp()
		this.changed = true
		this.loader.info(`change ${this.fi}`)
	}
	//get requires
	requires() {
		const path = this.build_path_copy();
		try {
			const data = require(path)
			console.log(data)
			const res = []
			for (const i in data) {
				res.push(i)
			}
			return res
		} catch (e) {
			console.log(e)
			return []
		}
	}
	//[vite]return script
	async load() {
		if (this.changed) await this.build()
		if (this.loader.dev) {
			return `export default require("${this.build_path_copy()}")`
		}
		else {
			return 'require()'
		}
	}
	constructor(public loader: LoaderModule, public fi: string) {
		loader.maker[fi] = this
		this.name = this.loader.mainname(fi)
		this.arch = loader.arch
		this.platform = loader.platform
		this.watcher = watch(this.fi, {
			depth: 0
		})
		this.watcher.on('unlink', () => {
			this.del()
		})
		this.watcher.on('change', () => {
			this.onchange()
		})
		this.cache_init()
		this.gyp()
	}
}
