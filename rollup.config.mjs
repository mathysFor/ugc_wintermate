import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  input: 'back/src/index.ts',
  output: {
    file: 'back/dist/index.js',
    format: 'cjs',
    sourcemap: false,
    inlineDynamicImports: true
  },
  external: [
    // Core Node.js modules
    'fs', 'path', 'url', 'crypto', 'os', 'util', 'events', 'stream',
    'http', 'https', 'net', 'tls', 'child_process', 'dns',
    'querystring', 'buffer', 'assert', 'perf_hooks',
    // Dépendances backend
    'express', 'pg', 'drizzle-orm', 'bcryptjs', 'jsonwebtoken',
    'cors', 'dotenv', 'node-cron', 'pg-connection-string'
  ],
  onwarn(warning, warn) {
    // Ignorer les warnings de dépendances circulaires communes
    if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.message.includes('drizzle-orm')) return;
    warn(warning);
  },
  plugins: [
    alias({
      entries: [
        // Mapping du dossier shared depuis la racine
        { find: /^@shared\/(.*)/, replacement: path.resolve(__dirname, 'shared/$1') },
        { find: '@shared', replacement: path.resolve(__dirname, 'shared') },
        // Mappings internes du backend
        { find: '@', replacement: path.resolve(__dirname, 'back/src') },
        { find: '@controllers', replacement: path.resolve(__dirname, 'back/src/controllers') },
        { find: '@routes', replacement: path.resolve(__dirname, 'back/src/routes') },
        { find: '@db', replacement: path.resolve(__dirname, 'back/src/db') },
        { find: '@middlewares', replacement: path.resolve(__dirname, 'back/src/middlewares') },
        { find: '@services', replacement: path.resolve(__dirname, 'back/src/services') }
      ]
    }),
    nodeResolve({
      preferBuiltins: true,
      exportConditions: ['node'],
      extensions: ['.ts', '.js', '.json']
    }),
    typescript({
      tsconfig: 'back/tsconfig.build.json',
      sourceMap: false,
      inlineSources: false
    }),
    commonjs(),
    json()
  ]
};

