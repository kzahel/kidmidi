import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ command, isPreview }) => ({
  base:
    command === 'build' || isPreview
      ? (process.env.KIDMIDI_BASE_PATH ?? '/')
      : '/',
  plugins: [react()],
}));
