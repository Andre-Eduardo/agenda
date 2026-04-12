import { defineConfig } from 'orval';

export default defineConfig({
  agenda: {
    input: {
      target: '../../apps/server/openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: './src/services',
      schemas: './src/models',
      client: 'react-query',
      baseUrl: false,
      override: {
        mutator: {
          path: './src/api-client.ts',
          name: 'apiClient',
        },
      },
    },
  },
});
