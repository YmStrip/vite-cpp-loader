import type {Plugin} from "vite";
import {LoaderModule} from "./LoaderModule.ts";
import "colors"
export const ViteCppLoader = (config?: Partial<LoaderModule>): Plugin => {
	const loader = new LoaderModule().assign(config)
	const plugin: Record<any, any> & Plugin = {
		name: 'cpp-runtime',
		loader,
		buildStart() {
			return
		},
		async load(id: any) {
			try {
				return await loader.load(id)
			} catch (e) {
				this.error(<any>e)
			}
		},
		config(config) {
			loader.config = <any>plugin.config
		},
		configResolved(config) {
			loader.config = <any>plugin.config
		}
	}
	loader.plugin = plugin
	return plugin
}