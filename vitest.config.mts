import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The database-backed tests share one DATABASE_URL and truncate tables; run files one at a time.
    fileParallelism: false,
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
