import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceExtensions = new Set([".ts", ".tsx", ".mjs", ".css"]);
const mojibake = /(?:Ã[\u0080-\u00ff]|Â[\u0080-\u00ff]|â[\u0080-\u00ff]|[ØÙ][\u0080-\u00ff]|[طظ][\u0080-\u00ff])/u;

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(filename);
    if (entry.name.endsWith(".test.mjs")) return [];
    return sourceExtensions.has(path.extname(entry.name)) ? [filename] : [];
  }));
  return nested.flat();
}

test("application source is valid UTF-8 and contains no common mojibake sequences", async () => {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  for (const filename of await sourceFiles(root)) {
    const contents = decoder.decode(await readFile(filename));
    assert.equal(mojibake.test(contents), false, `Mojibake marker found in ${path.relative(root, filename)}`);
  }
});
