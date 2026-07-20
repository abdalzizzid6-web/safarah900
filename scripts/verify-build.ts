import fs from 'fs';
import path from 'path';

const API_DIR = path.join(process.cwd(), 'api');
const SERVER_FILE = path.join(process.cwd(), 'server.ts');
const ENV_EXAMPLE_FILE = path.join(process.cwd(), '.env.example');

function report(title: string, messages: string[]) {
  console.log(`\n--- ${title} ---`);
  if (messages.length === 0) {
    console.log('✅ No issues found.');
  } else {
    messages.forEach(msg => console.log(`❌ ${msg}`));
  }
}

async function verifyBuild() {
  console.log('Starting build verification diagnostic...');

  // 1. Check API Routes
  const apiFiles = fs.readdirSync(API_DIR).filter(file => file.endsWith('.ts'));
  const serverContent = fs.readFileSync(SERVER_FILE, 'utf-8');
  const orphanedRoutes: string[] = [];

  apiFiles.forEach(file => {
    const routeName = file.replace('.ts', '');
    // Check if imported in server.ts or server/index.ts (if used)
    if (!serverContent.includes(routeName)) {
      orphanedRoutes.push(file);
    }
  });
  report('Orphaned API Routes', orphanedRoutes);

  // 2. Missing Environment Variables
  const envExample = fs.readFileSync(ENV_EXAMPLE_FILE, 'utf-8');
  const missingVars: string[] = [];
  envExample.split('\n').forEach(line => {
    const varName = line.split('=')[0].trim();
    if (varName && !varName.startsWith('#') && !process.env[varName]) {
      missingVars.push(varName);
    }
  });
  report('Missing Required Environment Variables', missingVars);

  // 3. Circular Dependencies in API/
  const circularDeps: string[] = [];
  apiFiles.forEach(file => {
    const filePath = path.join(API_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    apiFiles.forEach(otherFile => {
        if (file !== otherFile && content.includes(otherFile.replace('.ts', ''))) {
            // Very basic check, could be improved
            const otherFilePath = path.join(API_DIR, otherFile);
            const otherContent = fs.readFileSync(otherFilePath, 'utf-8');
            if (otherContent.includes(file.replace('.ts', ''))) {
                circularDeps.push(`${file} <-> ${otherFile}`);
            }
        }
    });
  });
  report('Potential Circular Dependencies in API/', circularDeps);
}

verifyBuild().catch(console.error);
