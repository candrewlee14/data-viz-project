import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';
const BASEPATH = process.env.PROJECT_PATH || "";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(),

	kit: {
		trailingSlash: 'never',
		adapter: adapter({
			fallback: 'index.html'
		}),
		paths: {
			base: BASEPATH
		}
	}
};

export default config;
