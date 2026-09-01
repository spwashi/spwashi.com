import { register } from 'node:module';

register(new URL('../lib/public-import-hooks.mjs', import.meta.url));