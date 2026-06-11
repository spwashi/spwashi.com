import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const publicJsRoot = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..'), 'public/js');

export async function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith('/public/js/')) {
    return nextResolve(specifier, context);
  }

  const relativePath = specifier.slice('/public/js/'.length);
  const absolutePath = path.join(publicJsRoot, relativePath);

  return {
    shortCircuit: true,
    url: pathToFileURL(absolutePath).href,
  };
}