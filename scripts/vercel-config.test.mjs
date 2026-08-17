import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("routes production GenLayer RPC proxy before SPA deep links", async () => {
  const configUrl = new URL("../frontend/vercel.json", import.meta.url);
  const config = JSON.parse(await readFile(configUrl, "utf8"));

  assert.deepEqual(config.rewrites, [
    {
      source: "/genlayer-rpc",
      destination: "https://studio.genlayer.com/api"
    },
    {
      source: "/(.*)",
      destination: "/index.html"
    }
  ]);
});
