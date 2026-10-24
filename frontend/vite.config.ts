import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The API runs on Spring Boot; proxying keeps the session cookie same-origin.
    proxy: { '/api': 'http://localhost:8080' },
  },
});
