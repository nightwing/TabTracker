import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import {
  Branch,
  Commit,
  File,
  Status,
  Tag
} from '@shared/schema';

// Convert exec to use promises
const execAsync = promisify(exec);

// Execute a git command in a specific repository path
export async function runGitCommand(repoPath: string, command: string): Promise<string> {
  try {
    // Ensure the path exists and is a git repository
    if (!fs.existsSync(path.join(repoPath, '.git'))) {
      throw new Error(`Not a git repository: ${repoPath}`);
    }
    
    const { stdout } = await execAsync(`git -C "${repoPath}" ${command}`);
    return stdout.trim();
  } catch (error: any) {
    if (error.stderr) {
      throw new Error(`Git command failed: ${error.stderr.trim()}`);
    }
    throw error;
  }
}

// Get list of branches for a repository
export async function getBranches(repoPath: string): Promise<Branch[]> {
  const output = await runGitCommand(repoPath, 'branch -v');
  const branches: Branch[] = [];
  
  // Process the output into branch objects
  const lines = output.split('\n').filter(Boolean);
  
  for (const line of lines) {
    const match = line.match(/^(\*?)\s+(\S+)\s+(\S+)/);
    if (match) {
      const [_, indicator, name, commitHash] = match;
      branches.push({
        name,
        current: indicator === '*',
        commitHash,
      });
    }
  }
  
  return branches;
}

// Get current branch
export async function getCurrentBranch(repoPath: string): Promise<string> {
  return runGitCommand(repoPath, 'rev-parse --abbrev-ref HEAD');
}

// Get commit history
export async function getCommits(repoPath: string, branch = 'HEAD', limit = 10): Promise<Commit[]> {
  const output = await runGitCommand(
    repoPath, 
    `log ${branch} --pretty=format:"%H|%h|%an|%ae|%ad|%s" -n ${limit}`
  );
  
  if (!output) return [];
  
  const commits: Commit[] = output.split('\n').map(line => {
    const [hash, shortHash, author, email, date, message] = line.split('|');
    return { hash, shortHash, author, email, date, message };
  });
  
  return commits;
}

// Get repository status
export async function getStatus(repoPath: string): Promise<Status> {
  const branch = await getCurrentBranch(repoPath);
  const statusOutput = await runGitCommand(repoPath, 'status --porcelain=v1');
  
  const isClean = statusOutput.length === 0;
  const stagedChanges: File[] = [];
  const unstagedChanges: File[] = [];
  const untrackedFiles: File[] = [];
  
  if (!isClean) {
    const lines = statusOutput.split('\n').filter(Boolean);
    
    for (const line of lines) {
      const statusCode = line.substring(0, 2);
      const filePath = line.substring(3);
      
      const isDirectory = fs.existsSync(path.join(repoPath, filePath)) && 
                          fs.statSync(path.join(repoPath, filePath)).isDirectory();
      
      const fileType = isDirectory ? 'directory' : 'file';
      const fileObj: File = { path: filePath, type: fileType };
      
      // Untracked files
      if (statusCode === '??') {
        fileObj.status = 'untracked';
        untrackedFiles.push(fileObj);
        continue;
      }
      
      // Staged changes
      if (statusCode[0] !== ' ' && statusCode[0] !== '?') {
        const statusMap: Record<string, File['status']> = {
          'M': 'modified',
          'A': 'added',
          'D': 'deleted',
          'R': 'renamed'
        };
        
        fileObj.status = statusMap[statusCode[0]] || 'modified';
        stagedChanges.push(fileObj);
      }
      
      // Unstaged changes
      if (statusCode[1] !== ' ') {
        const statusMap: Record<string, File['status']> = {
          'M': 'modified',
          'D': 'deleted'
        };
        
        fileObj.status = statusMap[statusCode[1]] || 'modified';
        unstagedChanges.push(fileObj);
      }
    }
  }
  
  return {
    branch,
    isClean,
    stagedChanges,
    unstagedChanges,
    untrackedFiles
  };
}

// Get file tree for a specific commit or branch
export async function getFileTree(repoPath: string, ref = 'HEAD'): Promise<File[]> {
  const output = await runGitCommand(repoPath, `ls-tree -r --name-only ${ref}`);
  
  if (!output) return [];
  
  const files: File[] = output.split('\n').filter(Boolean).map(filePath => {
    // Since we don't have direct info if it's a directory from ls-tree with name-only,
    // we'll have to guess based on the path structure
    const isDirectory = !path.extname(filePath) && 
                       filePath.includes('/') && 
                       !output.includes(filePath + '/');
    
    return {
      path: filePath,
      type: isDirectory ? 'directory' : 'file'
    };
  });
  
  return files;
}

// Get file content for a specific commit
export async function getFileContent(repoPath: string, filePath: string, ref = 'HEAD'): Promise<string> {
  return runGitCommand(repoPath, `show ${ref}:${filePath}`);
}

// Get tags
export async function getTags(repoPath: string): Promise<Tag[]> {
  const output = await runGitCommand(repoPath, 'show-ref --tags');
  
  if (!output) return [];
  
  const tags: Tag[] = output.split('\n').filter(Boolean).map(line => {
    const [commitHash, tagRef] = line.split(' ');
    const name = tagRef.replace('refs/tags/', '');
    return { name, commitHash };
  });
  
  return tags;
}

// Get repository remote URL
export async function getRemoteUrl(repoPath: string, remote = 'origin'): Promise<string | null> {
  try {
    const output = await runGitCommand(repoPath, `remote get-url ${remote}`);
    return output || null;
  } catch (error) {
    return null; // Repository might not have a remote
  }
}
