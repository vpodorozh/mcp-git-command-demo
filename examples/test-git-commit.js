#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Example of how to test the MCP git command server
async function testGitCommit() {
  const serverPath = join(__dirname, '..', 'dist', 'index.js');
  
  // Example MCP request for git-commit tool
  const mcpRequest = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'git-commit',
      arguments: {
        files: ['README.md', 'package.json'],
        message: 'Test commit from MCP server',
        directory: process.cwd()
      }
    }
  });

  console.log('Testing MCP Git Command Server...');
  console.log('Request:', mcpRequest);

  try {
    // This would typically be handled by an MCP client
    // This is just a demonstration of the expected input format
    console.log('\nTo use this server with an MCP client, send requests like:');
    console.log(mcpRequest);
    
    console.log('\nServer executable location:', serverPath);
    console.log('Make sure to build the project first with: npm run build');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testGitCommit();