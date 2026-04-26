#!/usr/bin/env node
import {
  main,
} from './typed/sitemap/index.mjs';

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
