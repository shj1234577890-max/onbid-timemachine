// Design Ref: §8 비밀 키 검사 — .env가 git에 없는지, .env의 키 값이 빌드 결과나 커밋된 파일에 들어갔는지 "있음/없음"으로만 알려 준다.
// 키 값은 어디에도 출력하지 않는다. 실행: npm run check:secrets (먼저 npm run build로 .next를 만들어 둔다)
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const yesNo = (found: boolean) => (found ? "있음 ✗" : "없음 ✓");

/** 폴더 안의 모든 파일 경로 */
function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

function containsValue(files: string[], value: string): boolean {
  return files.some((f) => {
    try {
      return statSync(f).size < 20_000_000 && readFileSync(f).includes(value);
    } catch {
      return false;
    }
  });
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
const trackedEnv = tracked.filter((f) => /^\.env/i.test(f.split("/").pop() ?? ""));
const history = execFileSync("git", ["log", "--all", "--name-only", "--pretty=format:"], { encoding: "utf8" }).split("\n");
const historyEnv = history.filter((f) => /^\.env/i.test(f.split("/").pop() ?? ""));

let failed = false;
console.log(`.env 파일이 git에 추적됨: ${yesNo(trackedEnv.length > 0)}`);
console.log(`.env 파일이 git 과거 기록에 있음: ${yesNo(historyEnv.length > 0)}`);
failed ||= trackedEnv.length > 0 || historyEnv.length > 0;

if (!existsSync(".env")) {
  console.log(".env 파일이 없어 키 값 검사는 건너뜁니다.");
} else if (!existsSync(".next")) {
  console.log("`.next`가 없습니다. 먼저 npm run build를 실행하세요.");
  failed = true;
} else {
  const staticFiles = existsSync(join(".next", "static")) ? walk(join(".next", "static")) : [];
  const buildFiles = walk(".next");
  const secrets = readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/))
    .flatMap((m) => (m ? [{ name: m[1], value: m[2].replace(/^["']|["']$/g, "") }] : []))
    .filter((s) => s.value.length >= 8); // 너무 짧은 값은 우연히 겹치므로 제외

  for (const { name, value } of secrets) {
    const inStatic = containsValue(staticFiles, value);
    const inBuild = containsValue(buildFiles, value);
    const inTracked = containsValue(tracked, value);
    console.log(`${name}: 브라우저용 빌드 ${yesNo(inStatic)} / 빌드 전체 ${yesNo(inBuild)} / 커밋된 파일 ${yesNo(inTracked)}`);
    failed ||= inStatic || inBuild || inTracked;
  }
}

console.log(failed ? "\n결과: 문제가 있습니다." : "\n결과: 모두 통과했습니다.");
process.exit(failed ? 1 : 0);
