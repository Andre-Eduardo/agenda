import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { tanstackRouter } from '@tanstack/router-vite-plugin';
import { routes } from './src/views/modules/routes';
import path from 'path';

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
  resolve: {
    alias: {
      '@agenda-app/client': path.resolve(__dirname, './src/lib/client/index.ts'),
    },
  },
  server: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
