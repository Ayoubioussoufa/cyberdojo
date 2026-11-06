/**
 * Differential test: the simulator against the real tools. The same fixture
 * is built on disk and in the simulator, each command runs in both, and
 * stdout, stderr and the exit code must match.
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { machine } from "../src/lib/shell/world";

const AUTH = Array.from({ length: 40 }, (_, i) => {
  const ip = ["203.0.113.7", "198.51.100.23", "192.0.2.44", "203.0.113.7", "203.0.113.7"][i % 5];
  const user = ["root", "admin", "test"][i % 3];
  return i % 7 === 3
    ? `Oct 27 09:${String(i).padStart(2, "0")}:11 lab sshd[811]: Accepted publickey for analyst from 10.0.0.5 port 5${i}22 ssh2`
    : `Oct 27 09:${String(i).padStart(2, "0")}:11 lab sshd[811]: Failed password for ${user} from ${ip} port 4${i}10 ssh2`;
}).join("\n") + "\n";

const FILES: Record<string, string> = {
  "notes.txt": "alpha\nBravo\ncharlie\nalpha\n\ndelta 42\n",
  "nums.txt": "10\n9\n100\n1\n9\n",
  "auth.log": AUTH,
  "users.csv": "name,dept,uid\nali,sec,1001\nsara,ops,1002\nomar,sec,1003\n",
  "docs/readme.md": "# Title\nsome text here\n",
  "docs/a/b/deep.txt": "needle in a stack\n",
  "docs/.hidden": "secret\n",
  "docs/old.bak": "",
  "script.sh": "echo running\n",
  "locked.txt": "nope\n",
  "policy.json": JSON.stringify({ Version: "2012-10-17", Statement: [{ Effect: "Allow", Action: "s3:GetObject", Resource: "*" }, { Effect: "Deny", Action: "iam:*", Resource: "*" }] }, null, 2) + "\n",
  "trail.json": [
    { eventTime: "2026-10-27T09:01:00Z", eventName: "ConsoleLogin", sourceIPAddress: "10.0.0.5", userIdentity: { userName: "ana" }, errorCode: null },
    { eventTime: "2026-10-27T09:02:00Z", eventName: "AssumeRole", sourceIPAddress: "203.0.113.7", userIdentity: { userName: "ci-bot" }, errorCode: null },
    { eventTime: "2026-10-27T09:03:00Z", eventName: "CreateAccessKey", sourceIPAddress: "203.0.113.7", userIdentity: { userName: "ci-bot" }, errorCode: "AccessDenied" },
    { eventTime: "2026-10-27T09:04:00Z", eventName: "StopLogging", sourceIPAddress: "203.0.113.7", userIdentity: { userName: "ana" }, errorCode: null },
  ].map((e) => JSON.stringify(e)).join("\n") + "\n",
};
const MODES: Record<string, number> = { "script.sh": 0o755, "locked.txt": 0o000, "docs/old.bak": 0o600 };

const CASES = `
ls
ls -a
ls -A
ls -1 docs
ls docs/a
ls -R docs
ls nothere
ls -d docs
ls -F
ls -r
ls -l | awk '{print $1, $5, $9}'
ls -la docs | awk '{print $1, $5, $9}'
ls -lh auth.log | awk '{print $5}'
ls -S
cat notes.txt
cat -n notes.txt
cat nothere
cat docs
cat locked.txt
cat notes.txt nums.txt
head -n 2 notes.txt
head -3 notes.txt
head -n 1 notes.txt nums.txt
head -c 4 notes.txt
tail -n 2 notes.txt
tail -n +3 notes.txt
tail -2 nums.txt
tail nothere
head nothere
wc -l notes.txt
wc -w notes.txt
wc -c notes.txt
wc notes.txt
wc notes.txt nums.txt
wc -l < notes.txt
cat notes.txt | wc -l
cat notes.txt | wc
grep alpha notes.txt
grep -i BRAVO notes.txt
grep -v alpha notes.txt
grep -c alpha notes.txt
grep -n alpha notes.txt
grep nope notes.txt
grep alpha nothere
grep alpha docs
grep -r needle docs
grep -rl needle docs
grep -rn text docs | sort
grep -E 'al|ch' notes.txt
grep 'al\\|ch' notes.txt
grep -E '^[a-z]+$' notes.txt
grep -o '[0-9]\\+' notes.txt
grep -oE '[0-9]+' notes.txt
grep -w del notes.txt
grep -w delta notes.txt
grep -c '' notes.txt
grep -E '^$' notes.txt -n
grep alpha notes.txt nums.txt
grep -h alpha notes.txt nums.txt
grep -l alpha notes.txt nums.txt
grep -A1 Bravo notes.txt
grep -B1 charlie notes.txt
grep -q alpha notes.txt
grep -E '[[:digit:]]{2}' notes.txt
sort notes.txt
sort -r notes.txt
sort -u notes.txt
sort nums.txt
sort -n nums.txt
sort -rn nums.txt
sort -t, -k3 -n users.csv
sort -t, -k2,2 users.csv
sort -f notes.txt
sort nothere
uniq notes.txt
sort notes.txt | uniq
sort notes.txt | uniq -c
sort notes.txt | uniq -d
sort notes.txt | uniq -u
sort nums.txt | uniq -c | sort -rn
cut -d, -f1 users.csv
cut -d, -f1,3 users.csv
cut -d, -f2- users.csv
cut -c1-3 notes.txt
cut -d' ' -f2 notes.txt
tr a-z A-Z < notes.txt
tr -d 'a' < notes.txt
echo 'aa  bb' | tr -s ' '
tr '[:lower:]' '[:upper:]' < notes.txt
sed 's/alpha/ALPHA/' notes.txt
sed 's/a/X/g' notes.txt
sed -n '2p' notes.txt
sed '/alpha/d' notes.txt
sed -n '/delta/p' notes.txt
sed 1d notes.txt
sed 's/\\(a\\)l/\\1L/' notes.txt
sed -E 's/(a)l/\\1L/' notes.txt
awk '{print $1}' notes.txt
awk -F, '{print $2}' users.csv
awk -F, '$3 == 1002 {print $1}' users.csv
awk -F, '$2 == "sec" {print $1, $3}' users.csv
awk '/delta/ {print $2}' notes.txt
awk 'NR==2' notes.txt
awk '{print $NF}' users.csv
awk '{print NF}' notes.txt
grep 'Failed password' auth.log | wc -l
grep 'Failed password' auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -3
grep 'Failed password' auth.log | awk '{print $11}' | sort | uniq -c | sort -rn | head -3
grep 'Failed' auth.log | grep -oE '[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+' | sort | uniq -c | sort -rn | head -1
grep Failed auth.log | cut -d' ' -f9 | sort | uniq -c | sort -rn
find . -name '*.txt' | sort
find docs -type f | sort
find docs -type d | sort
find docs -maxdepth 1 | sort
find docs -name 'deep*'
find docs -iname 'README*'
find . -type f -size -1k | sort
find . -type f -size +100c | sort
find . -type f -empty
find docs -not -name '*.md' -type f | sort
find . -perm 755 -type f
find . -perm -111 -type f
find . -perm /111 -type f
find . -name '*.txt' -o -name '*.md' | sort
find docs -name deep.txt -exec cat {} \\;
find nothere
echo hello world
echo -n hi
echo -e 'a\\nb'
echo "quoted   spaces"
echo unquoted   spaces
echo 'single $HOME'
X=5; echo $X
X=5; echo "$X$X"
Y="a b"; echo $Y
echo $NOTSET
echo *.txt
echo docs/*
echo no*match
echo '*.txt'
echo "*.txt"
echo \\*.txt
echo notes.tx?
echo [a-m]*
false; echo $?
true; echo $?
ls nothere; echo $?
grep nope notes.txt; echo $?
cat nothere; echo $?
nosuchcmd; echo $?
./notes.txt; echo $?
./script.sh
true && echo yes
false && echo yes
false || echo no
true || echo no
echo a; echo b
echo $(echo inner)
echo "$(wc -l < notes.txt)"
cat notes.txt > copy.txt; cat copy.txt
echo one > out.txt; echo two >> out.txt; cat out.txt
ls nothere 2> err.txt; cat err.txt
ls nothere 2>/dev/null
ls nothere notes.txt > both.txt 2>&1; cat both.txt
cat < notes.txt
cat notes.txt | tee t.txt | wc -l; cat t.txt
touch a.txt; ls a.txt
mkdir d1; ls -d d1
mkdir d1/d2/d3
mkdir -p d1/d2/d3; find d1 | sort
rmdir d1
rm d1
rm -r d1; ls d1
cp notes.txt n2.txt; cat n2.txt
cp docs d9
cp -r docs d9; find d9 | sort
mv notes.txt n3.txt; ls n3.txt notes.txt
rm nothere
rm -f nothere; echo $?
chmod 640 notes.txt; stat -c %a notes.txt
chmod u+x notes.txt; stat -c %A notes.txt
chmod go-r notes.txt; stat -c %a notes.txt
chmod a+x notes.txt; stat -c %A notes.txt
chmod 4755 script.sh; stat -c %A script.sh
chmod 2755 script.sh; stat -c %A script.sh
chmod 1777 docs; stat -c %A docs
chmod 4644 notes.txt; stat -c %A notes.txt
chmod o=r notes.txt; stat -c %a notes.txt
chmod g=rw notes.txt; stat -c %a notes.txt
chmod u=rwx,g=rx,o= notes.txt; stat -c %a notes.txt
chmod +x notes.txt; stat -c %a notes.txt
chmod 000 notes.txt; cat notes.txt
chmod nonsense notes.txt
chmod 644 nothere
touch f; stat -c %a f
mkdir nd; stat -c %a nd
umask 077; touch g; stat -c %a g
umask 027; mkdir h; stat -c %a h
ln -s notes.txt lnk; cat lnk; ls -l lnk | awk '{print $1, $9, $10, $11}'
cd docs; pwd | sed 's/.*\\///'; cd ..
cd nothere
cd notes.txt
cd docs/a/b; cat deep.txt
cd docs && ls && cd ..
cd docs/a; cd ../..; ls
rev < nums.txt
seq 3
seq 2 4
base64 < nums.txt
echo aGVsbG8K | base64 -d
strings notes.txt
basename /a/b/c.txt
dirname /a/b/c.txt
file notes.txt | cut -d: -f1
printf 'x %s\\n' y
| ls
ls |
awk -F, '$3 > 1001 && $2 == "sec" {print $1}' users.csv
awk -F, 'NR > 1 {print $1, $3}' users.csv
awk -F, 'NR > 1 && $2 == "ops"' users.csv
awk -F, 'NR != 1 {print $3}' users.csv
awk -F, 'NR > 1 {print $3 + $3}' users.csv
awk -F, 'NR > 1 {print $3 * 2}' users.csv
awk -F, 'NR > 1 {print $3 / $3}' users.csv
awk -F, '$2 == "sec" {s+=$3} END {print s}' users.csv
awk '{s+=$1} END {print s}' nums.txt
awk '{ total += $1 } END { print total }' nums.txt
awk -F, 'NR > 1 {print $3 / 7}' users.csv
sed -i 's/alpha/ALPHA/' notes.txt; cat notes.txt
sed -i 's/alpha/ALPHA/g' notes.txt nums.txt; cat notes.txt nums.txt
sed -i '/charlie/d' notes.txt; cat notes.txt
sed -i 's/x/y/' nothere
sed -i 's/x/y/' locked.txt
touch -d '2020-01-01' old.txt; touch fresh.txt; find . -name '*.txt' -newer old.txt | sort | grep -c old.txt
touch -d '2020-01-01' old.txt; touch fresh.txt; find . -newer old.txt -name fresh.txt
find . -newer nothere
sha256sum notes.txt
sha256sum notes.txt nums.txt
echo -n hello | sha256sum
cat auth.log | sha256sum
sha256sum notes.txt > s.txt; sha256sum -c s.txt
sha256sum notes.txt > s.txt; echo changed >> notes.txt; sha256sum -c s.txt
sha256sum notes.txt nums.txt | sort | cut -c1-8
jq . policy.json
jq -r .Version policy.json
jq -r '.Statement[0].Effect' policy.json
jq -r '.Statement[-1].Effect' policy.json
jq -r '.Statement[].Action' policy.json
jq -c '.Statement[]' policy.json
jq '.Statement | length' policy.json
jq -c keys policy.json
jq -r .nope policy.json
jq -r .eventName trail.json
jq . trail.json | head -3
jq -r 'select(.eventName == "StopLogging") | .userIdentity.userName' trail.json
jq -r 'select(.errorCode != null) | .eventName' trail.json
jq -r 'select(.userIdentity.userName == "ci-bot" and .eventName == "AssumeRole") | .sourceIPAddress' trail.json
jq -r 'select(.eventName == "StopLogging" or .eventName == "ConsoleLogin") | .eventTime' trail.json
jq -c '[.eventName, .sourceIPAddress]' trail.json
jq -r '[.eventName, .sourceIPAddress] | @tsv' trail.json
jq -r 'select(.eventName | test("Key")) | .eventName' trail.json
jq -r 'select(.eventName == "Nope")' trail.json
jq -r 'select(.eventTime >= "2026-10-27T09:03:00Z") | .eventName' trail.json
cat trail.json | jq -r .sourceIPAddress | sort | uniq -c | sort -rn
jq -r .eventName trail.json | wc -l
jq -r 'select(.sourceIPAddress | test("^10") | not) | .eventName' trail.json
jq .x nothere.json
`.trim().split("\n");

function setup(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const [f, c] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
    fs.writeFileSync(path.join(dir, f), c);
  }
  for (const [f, m] of Object.entries(MODES)) fs.chmodSync(path.join(dir, f), m);
}

function sim() {
  const sh = machine("analyst", [{ uid: 1000, name: "analyst" }]);
  sh.fs.dir("/work", { owner: "analyst", mode: 0o755 });
  for (const [f, c] of Object.entries(FILES)) sh.fs.put(`/work/${f}`, c, { owner: "analyst", mode: MODES[f] ?? 0o644 });
  sh.fs.dir("/work/docs", { owner: "analyst", mode: 0o755 });
  sh.fs.dir("/work/docs/a", { owner: "analyst", mode: 0o755 });
  sh.fs.dir("/work/docs/a/b", { owner: "analyst", mode: 0o755 });
  sh.cwd = "/work";
  sh.tty = false; // spawnSync's stdout is a pipe, so the real ls sees one too.
  return sh;
}

// Curly quotes are what a UTF-8 locale prints; the test runs in C for sort order.
const quotes = (s: string) => s.replace(/[‘’]/g, "'");
const norm = (s: string) =>
  s
    .replace(/^bash: -c: line \d+: `.*\n?/gm, "")
    .replace(/^bash: line \d+: `.*\n?/gm, "")
    .replace(/^bash: `.*\n?/gm, "")
    .replace(/^bash: line \d+: /gm, "bash: ")
    .replace(/^bash: -c: line \d+: /gm, "bash: ")
    .replace(/^bash: line \d+: `.*\n?/gm, "")
    .replace(/^`.*\n?/gm, "");

// On a real disk, not tmpfs: directory sizes must be 4096 as on a normal machine.
const tmp = fs.mkdtempSync(path.join(process.cwd(), ".shell-test-"));
const dir = path.join(tmp, "work");
let bad = 0;
for (const c of CASES) {
  setup(dir);
  const real = spawnSync("bash", ["-c", c], { cwd: dir, encoding: "utf8", env: { PATH: process.env.PATH ?? "", HOME: "/nonexistent", LC_ALL: "C" } as unknown as NodeJS.ProcessEnv });
  const sh = sim();
  const { stdout, terminal, code } = sh.exec(c, "", sh.creds);
  const stderr = terminal.slice(0, terminal.length - stdout.length);
  const rOut = real.stdout;
  const rErr = norm(real.stderr);
  const sErr = stderr.replace(/^nosuchcmd: command not found/m, "bash: nosuchcmd: command not found");
  // Ubuntu's Rust coreutils word these two errors differently from GNU; the simulator follows GNU.
  const worded = c === "chmod nonsense notes.txt" || c === "mkdir d1/d2/d3";
  if (rOut !== stdout || (!worded && quotes(rErr) !== quotes(sErr)) || (real.status ?? -1) !== code) {
    bad++;
    console.log(`\n✗ ${c}`);
    if (rOut !== stdout) console.log(`  real out: ${JSON.stringify(rOut)}\n  sim  out: ${JSON.stringify(stdout)}`);
    if (rErr !== sErr) console.log(`  real err: ${JSON.stringify(rErr)}\n  sim  err: ${JSON.stringify(sErr)}`);
    if (real.status !== code) console.log(`  real code ${real.status}, sim code ${code}`);
  }
}
try { execFileSync("chmod", ["-R", "u+rwx", tmp]); } catch {}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${CASES.length - bad}/${CASES.length} commands match the real tools`);
process.exit(bad ? 1 : 0);
