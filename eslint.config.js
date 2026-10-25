import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['dist', 'dev-dist', '.superpowers'] },
  js.configs.recommended,
  tseslint.configs.recommended,
);
