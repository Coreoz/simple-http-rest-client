import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true, // Ensure globals like 'expect' are available
    include: ['src/tests/**/*.test.ts'],
  },
});
