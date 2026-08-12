import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("routes production SPA deep links to the Vite entry point", async () => {
  const configUrl = new URL("../frontend/vercel.json", import.meta.url);
  const config = JSON.parse(await readFile(configUrl, "utf8"));

  assert.deepEqual(config.rewrites, [
    {
      source: "/(.*)",
      destination: "/index.html"
    }
  ]);
});
