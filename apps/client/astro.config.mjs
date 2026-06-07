// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000/',
          changeOrigin: false,
          secure: false,
        }
      }
    },
  },

  adapter: node({
    mode: 'middleware'
  })
});
