import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: true,
    deps: {
      inline: ['**']
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.mjs', '.json']
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', 'skills/', 'dist/']
    }
  }
});