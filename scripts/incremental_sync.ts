import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string): string | null => {
  const index = args.findIndex(arg => arg.startsWith(`--${name}=`));
  if (index !== -1) return args[index].split('=')[1];
  const flagIndex = args.indexOf(`--${name}`);
  if (flagIndex !== -1 && args[flagIndex + 1]) return args[flagIndex + 1];
  return null;
};

// Configuration
const BATCH_SIZE = parseInt(getArg('batch-size') || '50', 10);
const TARGET_BRANCH = getArg('branch') || 'main';
const REPO_URL_ARG = getArg('repo');
const TOKEN_ARG = getArg('token');
const LOCAL_ONLY = args.includes('--local-only') || args.includes('-l') || getArg('local-only') !== null;

// Load environment variables from .env if present
const loadEnv = () => {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        // Remove surrounding quotes if any
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        if (!process.env[key]) process.env[key] = val;
      }
    });
  }
};

loadEnv();

const GITHUB_TOKEN = TOKEN_ARG || process.env.GITHUB_TOKEN;
const GITHUB_REPO_URL = REPO_URL_ARG || process.env.GITHUB_REPO_URL;

// Helper to run shell commands safely
const runCommand = (cmd: string): string => {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (error: any) {
    throw {
      command: cmd,
      status: error.status,
      message: error.message,
      stderr: error.stderr ? error.stderr.toString().trim() : '',
      stdout: error.stdout ? error.stdout.toString().trim() : ''
    };
  }
};

async function main() {
  console.log('\n======================================================');
  console.log('🚀 INITIALIZING INCREMENTAL GITHUB SYNCHRONIZATION');
  console.log('======================================================\n');

  if (!GITHUB_REPO_URL) {
    console.error('❌ Error: GITHUB_REPO_URL is not set. Please provide it via --repo or set it in your .env file.');
    console.log('\nUsage example:');
    console.log('  npx tsx scripts/incremental_sync.ts --repo=https://github.com/username/repo.git --token=your_github_token\n');
    process.exit(1);
  }

  // Ensure git is installed
  try {
    const gitVer = runCommand('git --version');
    console.log(`✅ Git detected: ${gitVer}`);
  } catch {
    console.error('❌ Error: git CLI is not installed or not in PATH.');
    process.exit(1);
  }

  // Initialize repository if not already a git repository
  if (!fs.existsSync(path.join(process.cwd(), '.git'))) {
    console.log('📦 Initializing local Git repository...');
    runCommand('git init');
  }

  // Ensure user identity is configured locally so commits don't fail
  try {
    runCommand('git config user.name');
  } catch {
    console.log('👤 Configuring temporary git user name...');
    runCommand('git config user.name "AI Studio Sync"');
  }
  try {
    runCommand('git config user.email');
  } catch {
    console.log('📧 Configuring temporary git user email...');
    runCommand('git config user.email "sync@aistudio.google.com"');
  }

  // Build authenticated repo URL
  let authRepoUrl = GITHUB_REPO_URL;
  if (GITHUB_TOKEN) {
    // Standardize URL to insert token
    const cleanUrl = GITHUB_REPO_URL.replace(/^https:\/\/([^@]+)@/, 'https://').replace(/^https:\/\//, '');
    authRepoUrl = `https://${GITHUB_TOKEN}@${cleanUrl}`;
    console.log('🔑 Authenticated URL successfully constructed using provided Token.');
  } else {
    console.log('⚠️  No GitHub token provided. Proceeding with unauthenticated URL (SSH key or existing helper must be configured).');
  }

  // Set remote origin
  try {
    runCommand('git remote remove origin');
  } catch {}
  runCommand(`git remote add origin ${authRepoUrl}`);
  console.log('🔗 Git remote "origin" set successfully.');

  // Fetch remote to align history
  console.log('📥 Fetching history from remote repository...');
  let hasRemoteBranch = false;
  try {
    runCommand('git fetch origin');
    hasRemoteBranch = true;
    console.log('✅ Remote history fetched successfully.');
  } catch (error: any) {
    console.log('ℹ️  Could not fetch from remote (repository might be empty or branch does not exist yet).');
    if (error.stderr && error.stderr.includes('Repository not found')) {
      console.error('\n❌ Repository access error. Please verify:');
      console.error('  1. The repository URL is correct.');
      console.error('  2. Your Token/SSH key has full read/write permissions.');
      process.exit(1);
    }
  }

  // Align branch and history
  if (hasRemoteBranch) {
    try {
      console.log(`🔄 Syncing base with remote branch "origin/${TARGET_BRANCH}"...`);
      // Use checkout -B to align current HEAD with the remote target branch, retaining modified/uncommitted local files intact!
      runCommand(`git checkout -B ${TARGET_BRANCH} origin/${TARGET_BRANCH}`);
      console.log(`✅ Branched from existing origin/${TARGET_BRANCH}.`);
    } catch {
      console.log(`ℹ️  Creating new branch "${TARGET_BRANCH}" locally...`);
      runCommand(`git checkout -B ${TARGET_BRANCH}`);
    }
  } else {
    console.log(`ℹ️  Creating fresh local branch "${TARGET_BRANCH}"...`);
    runCommand(`git checkout -B ${TARGET_BRANCH}`);
  }

  // Identify modified, untracked, or deleted files
  console.log('\n🔎 Scanning workspace files for modified/untracked changes...');
  const statusOutput = runCommand('git status --porcelain -uall');
  if (!statusOutput) {
    console.log('🎉 Local project and GitHub repository are already in perfect synchronization. No changes to commit.');
    process.exit(0);
  }

  const lines = statusOutput.split('\n').filter(line => line.trim().length > 0);
  const filesToSync: { path: string; status: string }[] = [];

  for (const line of lines) {
    const status = line.slice(0, 2);
    let filePath = line.slice(3).trim();
    // Handle quoted file paths (git outputs octal escapes for non-ASCII or spaces)
    if (filePath.startsWith('"') && filePath.endsWith('"')) {
      filePath = filePath.slice(1, -1);
    }
    filesToSync.push({ path: filePath, status });
  }

  const totalFiles = filesToSync.length;
  console.log(`📋 Found ${totalFiles} file(s) that need synchronization.`);

  // Calculate batches
  const totalBatches = Math.ceil(totalFiles / BATCH_SIZE);
  console.log(`📦 Dividing changes into ${totalBatches} batch(es) of max ${BATCH_SIZE} files each.\n`);

  for (let i = 0; i < totalBatches; i++) {
    const startIdx = i * BATCH_SIZE;
    const endIdx = Math.min(startIdx + BATCH_SIZE, totalFiles);
    const batchFiles = filesToSync.slice(startIdx, endIdx);
    const batchNum = i + 1;

    console.log(`------------------------------------------------------`);
    console.log(`⏳ Synchronizing Batch ${batchNum}/${totalBatches} (${batchFiles.length} files)`);
    console.log(`------------------------------------------------------`);

    // Stage files in this batch
    console.log('➕ Staging batch files...');
    for (const file of batchFiles) {
      if (file.status.includes('D')) {
        // Handle deleted files
        runCommand(`git rm --cached "${file.path}"`);
      } else {
        runCommand(`git add "${file.path}"`);
      }
    }

    // Commit changes
    const commitMsg = `sync: batch ${batchNum} of ${totalBatches} (${batchFiles.length} files) [AI Sync]`;
    console.log(`💾 Committing: "${commitMsg}"`);
    runCommand(`git commit -m "${commitMsg}"`);

    // Push changes
    if (LOCAL_ONLY) {
      console.log(`ℹ️  [Local Only Mode] Skipping push for Batch ${batchNum}/${totalBatches}.`);
    } else {
      console.log(`📤 Pushing Batch ${batchNum}/${totalBatches} to GitHub...`);
      let pushSuccess = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!pushSuccess && attempts < maxAttempts) {
        attempts++;
        try {
          runCommand(`git push origin ${TARGET_BRANCH}`);
          pushSuccess = true;
          console.log(`✅ Successfully pushed Batch ${batchNum}/${totalBatches}!`);
        } catch (error: any) {
          console.error(`⚠️  Push attempt ${attempts}/${maxAttempts} failed.`);
          console.error(`Error: ${error.stderr || error.message}`);
          
          if (attempts < maxAttempts) {
            console.log('🔄 Waiting 5 seconds before retrying...');
            await new Promise(resolve => setTimeout(resolve, 5000));
          } else {
            console.error('\n❌ Fatal: Failed to push batch after maximum retries.');
            console.error('The push was rejected by the remote repository. Possible causes:');
            console.error('  1. Branch protection rules on GitHub (e.g., force pushing is disabled or direct commits not allowed).');
            console.error('  2. GitHub file size limits (files exceeding 100MB).');
            console.error('  3. Network congestion or rate limiting.');
            console.log('\n💡 Resolution: To retry only this batch, fix any remote repository issues and run the script again.');
            console.log('The script will automatically resume from this exact point because successfully pushed files are already on the remote.');
            process.exit(1);
          }
        }
      }
    }

    // Generate Batch Sync Report
    console.log(`\n📄 BATCH ${batchNum} SYNCHRONIZATION REPORT:`);
    console.log(`   - Status: COMPLETED`);
    console.log(`   - Files Processed: ${batchFiles.length}`);
    console.log(`   - Cumulative Progress: ${Math.round((endIdx / totalFiles) * 100)}%`);
    console.log('   - Files in this batch:');
    batchFiles.forEach(f => console.log(`     • [${f.status}] ${f.path}`));
    console.log('\n');
  }

  // Verification phase
  console.log('======================================================');
  console.log('🔍 FINAL PARITY VERIFICATION PHASE');
  console.log('======================================================');
  
  try {
    console.log('📥 Fetching latest state to run parity check...');
    runCommand('git fetch origin');
    
    const diff = runCommand(`git diff origin/${TARGET_BRANCH}`);
    const finalStatus = runCommand('git status --porcelain');

    if (!diff && !finalStatus) {
      console.log('\n🎉 PARITY CONFIRMED: 100% SUCCESS!');
      console.log('Local project and GitHub repository contain EXACTLY the same files.');
      console.log('All changes have been successfully committed, pushed, and verified.\n');
    } else {
      console.warn('\n⚠️  Warning: Parity check completed, but some differences exist:');
      if (finalStatus) {
        console.log('Local uncommitted changes found:\n', finalStatus);
      }
      if (diff) {
        console.log('Diff between local and remote exists. Run "git status" and check any untracked or changed files.');
      }
    }
  } catch (err: any) {
    console.error('⚠️  Failed to complete final remote parity check automatically:', err.message || err);
    console.log('Please verify manually by running: git status && git diff origin/' + TARGET_BRANCH);
  }

  console.log('======================================================');
  console.log('🎉 SYNCHRONIZATION WORKFLOW FINISHED');
  console.log('======================================================\n');
}

main().catch(error => {
  console.error('\n❌ Fatal Exception during synchronization:', error);
  process.exit(1);
});
