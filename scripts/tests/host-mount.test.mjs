import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createHostContext,
  mountPortableModule,
  SPW_HOST_CONTRACT,
} from '../../public/js/runtime/orchestration/host.js';

test('a portable export mounts with (ctx, root) and its cleanup tears down the host context', async () => {
  const calls = [];
  const namespace = {
    SPW_MODULE_EXPORT: {
      mount(ctx, root) {
        calls.push(['mount', ctx.host, root]);
        ctx.addCleanup(() => calls.push(['ctx-cleanup']));
        return { cleanup: () => calls.push(['cleanup']), refresh: (next, at) => calls.push(['refresh', next.host, at]) };
      },
    },
  };
  const root = { id: 'host-root' };
  const handle = await mountPortableModule(namespace, root);
  handle.refresh();
  await handle.cleanup();
  assert.deepEqual(calls, [
    ['mount', true, root],
    ['refresh', true, root],
    ['cleanup'],
    ['ctx-cleanup'],
  ]);
});

test('a supplied context stays owned by the host page', async () => {
  let ctxCleaned = false;
  const ctx = createHostContext({ route: 'texture' });
  ctx.addCleanup(() => { ctxCleaned = true; });
  const handle = await mountPortableModule({ spwModule: { mount: () => () => {} } }, null, { ctx });
  await handle.cleanup();
  assert.equal(ctxCleaned, false);
  assert.equal(handle.ctx.route, 'texture');
});

test('a namespace without a mount fails loudly instead of appearing mounted', async () => {
  await assert.rejects(() => mountPortableModule({ value: 1 }, null, { id: 'empty' }), /no resolvable mount export/);
  assert.match(SPW_HOST_CONTRACT.mount, /mountPortableModule/);
});
