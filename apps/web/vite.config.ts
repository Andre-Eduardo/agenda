import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { tanstackRouter } from '@tanstack/router-vite-plugin';
import { routes } from './src/views/modules/routes';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tanstackRouter({
      virtualRouteConfig: routes,
      routesDirectory: 'src/views/modules',
      autoCodeSplitting: true,
    }),
    react(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
    },
  },
});
