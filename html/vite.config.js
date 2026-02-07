import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		preact(),
		tailwindcss()
	],
	server: {
		allowedHosts: [
			'raspap.local'
		],
		proxy: {
			'/api': {
				target: 'http://localhost:8085'
			},
		},
	}
});
