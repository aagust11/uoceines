import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/uoceines/', // Reemplaça-ho pel nom exacte del teu repositori de GitHub
});