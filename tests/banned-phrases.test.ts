// Design Ref: §8 확인 계획(금지어) — 화면에 보이는 문구가 들어 있는 모든 소스 파일에서 금지어를 찾는다. 주석은 화면에 나오지 않으므로 뺀다.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { findBannedPhrase } from "../lib/rules.ts";

/** 화면 문구가 있는 폴더. lib/rules.ts는 금지어 목록 자체라서 뺀다. */
const ROOTS = ["app", "components", "lib", "data"];
const SKIP = new Set([join("lib", "rules.ts")]);

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return listFiles(p);
    return /\.(tsx?|json)$/.test(e.name) && !SKIP.has(p) ? [p] : [];
  });
}

/** /* … *​/ 와 // … 주석을 지운다. (문구 안의 "//"는 주소뿐이라 이 용도로는 충분하다) */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'])\/\/.*$/gm, "$1");
}

test("화면 문구가 있는 소스 파일에 금지어가 한 군데도 없다", () => {
  const files = ROOTS.flatMap(listFiles);
  assert.ok(files.length > 10, "검사할 파일을 찾지 못했다");
  for (const file of files) {
    const found = findBannedPhrase(stripComments(readFileSync(file, "utf8")));
    assert.equal(found, null, `${file}에 금지어 '${found}'가 있다`);
  }
});
