#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const server = new Server(
  {
    name: 'mcp-git-command',
    version: '1.0.0',
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'git-commit',
        description: 'Stage and commit files to git repository',
        inputSchema: {
          type: 'object',
          properties: {
            files: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'List of files to stage and commit'
            },
            message: {
              type: 'string',
              description: 'Commit message'
            },
            directory: {
              type: 'string',
              description: 'Directory to execute git commands in'
            }
          },
          required: ['files', 'message', 'directory']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'git-commit') {
    const { files, message, directory } = args as {
      files: string[];
      message: string;
      directory: string;
    };

    let gitValidation = '';
    let gitAddOutput = '';
    let gitCommitOutput = '';
    let isSuccess = false;

    try {
      // Validate that directory exists and is a git repository
      const validationResult = await execAsync('git rev-parse --git-dir', { cwd: directory });
      gitValidation = `Git repository validation: SUCCESS\n${validationResult.stdout}${validationResult.stderr}`;

      // Stage the specified files
      const addResults = [];
      for (const file of files) {
        try {
          const addResult = await execAsync(`git add "${file}"`, { cwd: directory });
          addResults.push(`✓ Added: ${file}\n  stdout: ${addResult.stdout || '(no output)'}\n  stderr: ${addResult.stderr || '(no errors)'}`);
        } catch (addError: any) {
          addResults.push(`✗ Failed to add: ${file}\n  Error: ${addError.message}`);
        }
      }
      gitAddOutput = `Git add operations:\n${addResults.join('\n')}`;

      // Commit with the provided message
      const commitResult = await execAsync(`git commit -m "${message}"`, { cwd: directory });
      gitCommitOutput = `Git commit operation: SUCCESS\nstdout:\n${commitResult.stdout}\nstderr:\n${commitResult.stderr || '(no stderr output)'}`;
      
      isSuccess = true;

      return {
        content: [
          {
            type: 'text',
            text: `🎉 GIT COMMIT STATUS: SUCCESS\n\n` +
                  `=== REPOSITORY VALIDATION ===\n${gitValidation}\n\n` +
                  `=== FILE STAGING ===\n${gitAddOutput}\n\n` +
                  `=== COMMIT OPERATION ===\n${gitCommitOutput}\n\n` +
                  `=== SUMMARY ===\n` +
                  `✅ Status: SUCCESSFUL\n` +
                  `📂 Directory: ${directory}\n` +
                  `📝 Message: "${message}"\n` +
                  `📄 Files: ${files.join(', ')}`
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ GIT COMMIT STATUS: FAILED\n\n` +
                  `=== ERROR DETAILS ===\n` +
                  `Error: ${error.message}\n` +
                  `Command: ${error.cmd || 'Unknown command'}\n` +
                  `Exit Code: ${error.code || 'Unknown'}\n\n` +
                  `=== FULL ERROR OUTPUT ===\n` +
                  `stdout: ${error.stdout || '(no stdout)'}\n` +
                  `stderr: ${error.stderr || '(no stderr)'}\n\n` +
                  `=== PARTIAL RESULTS ===\n` +
                  `${gitValidation}\n` +
                  `${gitAddOutput}\n` +
                  `${gitCommitOutput}\n\n` +
                  `=== SUMMARY ===\n` +
                  `❌ Status: FAILED\n` +
                  `📂 Directory: ${directory}\n` +
                  `📝 Message: "${message}"\n` +
                  `📄 Files: ${files.join(', ')}`
          }
        ],
        isError: true
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Git Command Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});