import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The admin panel talks to the same api-gateway as the student app. Every call
// goes through /api/*, so we proxy that whole prefix to the gateway. Locally the
// gateway is http://localhost:8080; override with VITE_API_TARGET if it moves.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:8080';

  return {
    plugins: [react()],
    base: '/',
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
