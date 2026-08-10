const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
let m, i = 0, ok = true;
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mtb-check-'));

while ((m = re.exec(html))) {
  i++;
  const tmp = path.join(tmpDir, 'inline_' + i + '.js');
  fs.writeFileSync(tmp, m[1]);
  try {
    cp.execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
    console.log('inline script ' + i + ' OK');
  } catch (e) {
    ok = false;
    console.error('inline script ' + i + ' FAILED');
    console.error(String(e.stderr || e.message));
  }
}

fs.rmSync(tmpDir, { recursive: true, force: true });
if (!ok) process.exit(1);
console.log('checked ' + i + ' inline script(s)');
