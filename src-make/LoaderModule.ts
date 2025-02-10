import fs from "node:fs";
import path from "node:path";
import {Maker} from "./Maker.ts";
import type {Plugin, ResolvedConfig} from "vite";


import FsE, {CopyOptionsSync, MoveOptions} from 'fs-extra'
import FsType from "node:fs";

const FsApi = FsType

export class LoaderModule {
	//===================================
	//[config]
	readonly dev = process.env.NODE_ENV == 'development'
	plugin: Plugin
	config: ResolvedConfig
	//[electron] if use electron, change target to electron version
	electron = false
	electron_url = `https://atom.io/download/electron`
	//[gyp-options] append
	gyp_option = ''
	//[gyp-options]  options
	jobs = 'max'
	//[gyp-options]  version
	target = process.version
	//[gyp-options] level
	loglevel: 'silly' | 'verbose' | 'silent' = 'silly'
	//[vite] log details after build
	logconsole = false
	//[gyp-options] debug mode
	debug = false
	//[gyp-options] make override
	make: string
	//arch in dev
	arch: string = process.arch
	//archs in build
	archs: string[] = [process.arch]
	platform: string = process.platform
	platforms: string[] = [process.platform]
	//===================================
	//[api]
	maker: Record<string, Maker> = {}
	assign(assign?: Partial<LoaderModule>) {
		if (!assign) return this
		for (const i in assign) {
			// @ts-ignore
			this[i] = assign[i]
		}
		return this;
	}
	load(id: string) {
		id = this.src(id)
		const exts: string[] = [
			'cp',
			'cpp',
			'c',
			'cc',
			'h',
			'hp',
			'hpp',
			'c+',
			'c++',
			'cx',
			'cxx',
			'cu',
			'cuh',
		]
		if (id.endsWith(".abc")) {
			try {
				return `export default ${JSON.stringify(JSON.parse(fs.readFileSync(path.resolve(id)) + ''))};`
			} catch (e) {
				console.error(`Error processing .abc file: ${id}`, e);
				throw e;
			}
		}
		for (const i of exts) if (id.endsWith(i)) return this.load_cpp(id)
		return null
	}
	load_cpp(id: string) {
		if (this.maker[id]) return this.maker[id].load()
		this.maker[id] = new Maker(this, id)
		return this.maker[id].load()
	}
	//===================================
	//[fs]
	filename(path: string): string {
		return this.src(path).split('/').pop() || ''
	}
	dirname(path: string): string {
		return this.src(path).split('/').slice(0, -1).join('/') || ''
	}
	remove_name(path: string, rm: string) {
		return this.path(this.path(path).replace(this.path(rm), ''))
	}
	//main.ext
	extname(path: string) {
		const filename = this.filename(path)
		const p = filename.split('.')
		return p.pop() || ''
	}
	//main.ext
	mainname(path: string) {
		const filename = this.filename(path)
		const p = filename.split('.')
		return p.length > 1 ? p.slice(0, -1).join('.') : p[0] || ''
	}
	//child or self
	is_child_name(path: string, parent: string) {
		return this.path(path).startsWith(this.path(parent))
	}
	get_file_and_dir(path: string) {
		path = this.src(path)
		const list = path.split('/')
		return {
			path,
			"filename": list[list.length - 1] || '',
			"dirname": list.slice(0, -1).join('/') || ''
		}
	}
	path(path: string = '') {
		let src = this.src(path)
		while (true) {
			if (!src.length) break
			if (src[0] == '/') src = src.substring(1)
			else break
		}
		while (true) {
			if (!src.length) break
			if (src[src.length - 1] == '/') src = src.substring(0, src.length - 2)
			else break
		}
		return src
	}
	src(path: string = '') {
		return path.replace(/(\\)/g, '/').replace(/(\/\/)/g, '/').replace(/(\.\.)/g, '.')
	}
	isdir(path: string): boolean {
		try {
			return FsApi.statSync(path).isDirectory();
		} catch (e) {
			return false
		}
	}
	setdir(path: string) {
		try {
			FsApi.mkdirSync(path, {
				"recursive": true
			});
			return true
		} catch (e) {
			return false
		}
	}
	//deep
	delpath(path: string) {
		try {
			if (this.isfile(path)) return this.delfile(path)
			if (this.isdir(path)) {
				FsE.emptyDirSync(path)
				return this.deldir(path)
			}
		} catch (e) {
			console.log(e)
			console.log('error:', e)
		}
	}
	//not Deep
	deldir(path: string): boolean {
		console.log('[warn] del dir ', path)
		try {
			FsApi.rmdirSync(path)
			return true
		} catch (e) {
			return false
		}
	}
	getdir(path: string) {
		try {
			return FsApi.readdirSync(path)
		} catch (e) {
			return []
		}
	}
	isempty(path: string) {
		return this.isdir(path) && !this.getdir(path).length
	}
	isfile(path: string): boolean {
		try {
			return FsApi.statSync(path).isFile()
		} catch (e) {
			return false
		}
	}
	ispath(path: string): boolean {
		return this.isdir(path) || this.isfile(path)
	}
	append(fi: string, code: any) {
		try {
			FsApi.appendFileSync(fi, code)
		} catch (e) {
			return false
		}
		return true
	}
	setfile(file: FsType.PathOrFileDescriptor, data: string | NodeJS.ArrayBufferView, options?: FsType.WriteFileOptions | undefined) {
		try {
			FsApi.writeFileSync(file, data, options)
			return true
		} catch (e) {
			return false
		}
	}
	getfile(path: FsType.PathOrFileDescriptor, options?: {
		encoding?: null | undefined,
		flag?: string | undefined
	} | null | undefined) {
		try {
			return FsApi.readFileSync(path, options)
		} catch (e) {
			return null
		}
	}
	getjson(path: string) {
		try {
			return JSON.parse(this.getfile(path) + '') || null
		} catch (e) {
			return null
		}
	}
	setjson(path: string, json: any, tab = true) {
		try {
			return this.setfile(path, tab ? JSON.stringify(json, null, '\t') : JSON.stringify(json))
		} catch (e) {
			console.log(e)
			return false
		}
	}
	delfile(path: string): boolean {
		try {
			FsApi.unlinkSync(path)
			return true
		} catch (e) {
			return false
		}
	}
	rename(a: string, b: string): Error | true {
		try {
			FsE.renameSync(a, b)
			return true
		} catch (e: any) {
			return e
		}
	}
	copy(a: string, b: string, opt?: CopyOptionsSync): Error | true {
		try {
			FsE.copySync(a, b, opt)
			return true
		} catch (e: any) {
			console.log(e)
			return e
		}
	}
	move(a: string, b: string, opt?: MoveOptions): Error | true {
		try {
			FsE.moveSync(a, b, opt)
			return true
		} catch (e: any) {
			return e
		}
	}
	//===================================
	//[utils]
	message(level: 'info' | 'error' | 'warn' | 'debug', code: any) {
		const date = new Date()
		const time = [
			date.getFullYear(),
			date.getMonth() + 1,
			date.getDate()
		]
		const time1 = [
			date.getHours(),
			date.getMinutes(),
			date.getSeconds()
		]
		const braket = (item: any) => {
			return ('['.bold + '').gray + item.bold + ((']'.gray + '').bold + '').reset
		}
		const info = braket(`${time.join('-')} ${time.join(':')}`) + ' ' + braket(level.toLowerCase()[
			level == 'info' ? 'blue' :
				level == 'warn' ? 'yellow' :
					level == 'error' ? 'red' :
						level == 'debug' ? 'magenta' : 'bold'
			]) + ' ' + (code + '').gray
		console.log(info)
	}
	info(...data: any[]) {
		data.forEach(d => this.message('info', d + ''))
	}
	error(...data: any[]) {
		data.forEach(d => this.message('error', d + ''))
	}
	warn(...data: any[]) {
		data.forEach(d => this.message('warn', d + ''))
	}
}