// tealstripesvibes.com: its pages are files (assets/, carried by carry.mjs) and
// this worker answers only what needs a server: signed masks (/m/), the stamp
// check (/stamp/), and the machine readings (/tuple, /og/, .json). The assets
// layer sends nothing else here (wrangler.jsonc run_worker_first).
import { handleTealstripes } from "./server.js";

/** The set's shared files are files here too, though their names end in .json. */
const FILES = new Set(["/ecosystem.json", "/registry.json"]);

export default {
  async fetch(request, env = {}) {
    const url = new URL(request.url);
    if (FILES.has(url.pathname) && env.ASSETS) return env.ASSETS.fetch(request);
    return handleTealstripes(request, env);
  },
};
