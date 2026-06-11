import { register } from 'node:module';

register(new URL('./resolve-public-js.mjs', import.meta.url));