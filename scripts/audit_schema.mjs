
import fs from 'fs';
import path from 'path';

const CWD = process.cwd();
const SRC = path.join(CWD, 'src');

function getFiles(dir, exts = ['.tsx', '.jsx']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (!['node_modules', 'dist', '.git'].includes(file)) {
        results = results.concat(getFiles(filePath, exts));
      }
    } else if (exts.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  }
  return results;
}

const allFiles = getFiles(SRC);
let reportLines = ['# 🔍 Schema Markup Audit Report', '', `Generated at: ${new Date().toISOString()}`, ''];

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  if (content.includes('<SEO')) {
    reportLines.push(`### Checking: ${file.replace(CWD, '')}`);
    
    // Simple check: does it pass sportsEvent?
    if (content.includes('sportsEvent={')) {
      reportLines.push(`- ✅ ` + '`' + 'sportsEvent' + '`' + ' prop found.');
    } else {
      reportLines.push(`- ⚠️ ` + '`' + 'sportsEvent' + '`' + ' prop NOT found.');
    }
  }
});

fs.writeFileSync('SCHEMA_AUDIT_REPORT.md', reportLines.join('\n'));
console.log("Audit schema script completed. Report saved to SCHEMA_AUDIT_REPORT.md.");
