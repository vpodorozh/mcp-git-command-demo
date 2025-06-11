import { strict as assert } from 'assert';
import { spawn, exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTests() {
  console.log('Running MCP Git Command Server Tests...\n');
  
  let tempDir;
  let testsPassed = 0;
  let testsTotal = 0;

  try {
    // Setup: Create a temporary directory for testing
    tempDir = await mkdtemp(join(tmpdir(), 'mcp-git-test-'));
    
    // Initialize git repository
    await execAsync('git init', { cwd: tempDir });
    await execAsync('git config user.email "test@example.com"', { cwd: tempDir });
    await execAsync('git config user.name "Test User"', { cwd: tempDir });
    
    // Create a test file
    await writeFile(join(tempDir, 'test.txt'), 'Hello World');

    // Test 1: List tools
    testsTotal++;
    console.log('Test 1: List available tools');
    try {
      const response = await sendMCPRequest({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list'
      });
      
      assert(response.result, 'Should have a result');
      assert(response.result.tools, 'Should have tools array');
      assert(response.result.tools.length === 1, 'Should have one tool');
      assert(response.result.tools[0].name === 'git-commit', 'Should have git-commit tool');
      
      console.log('✓ List tools test passed');
      testsPassed++;
    } catch (error) {
      console.log('✗ List tools test failed:', error.message);
    }

    // Test 2: Successful git commit
    testsTotal++;
    console.log('\nTest 2: Successful git commit');
    try {
      const response = await sendMCPRequest({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'git-commit',
          arguments: {
            files: ['test.txt'],
            message: 'Test commit from MCP server',
            directory: tempDir
          }
        }
      });
      
      assert(response.result, 'Should have a result');
      assert(response.result.content, 'Should have content');
      assert(response.result.content[0].text.includes('GIT COMMIT STATUS: SUCCESS'), 'Should indicate success');
      
      console.log('✓ Git commit test passed');
      testsPassed++;
    } catch (error) {
      console.log('✗ Git commit test failed:', error.message);
    }

    // Test 3: Invalid directory
    testsTotal++;
    console.log('\nTest 3: Invalid directory handling');
    try {
      const response = await sendMCPRequest({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'git-commit',
          arguments: {
            files: ['test.txt'],
            message: 'Test commit',
            directory: '/nonexistent/directory'
          }
        }
      });
      
      assert(response.result, 'Should have a result');
      assert(response.result.isError || response.result.content[0].text.includes('GIT COMMIT STATUS: FAILED'), 'Should indicate error');
      
      console.log('✓ Invalid directory test passed');
      testsPassed++;
    } catch (error) {
      console.log('✗ Invalid directory test failed:', error.message);
    }

  } catch (error) {
    console.error('Test setup failed:', error.message);
  } finally {
    // Cleanup
    if (tempDir) {
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.error('Cleanup failed:', error.message);
      }
    }
  }

  // Results
  console.log(`\nTest Results: ${testsPassed}/${testsTotal} tests passed`);
  
  if (testsPassed === testsTotal) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

async function sendMCPRequest(request) {
  const serverPath = join(__dirname, '..', 'dist', 'index.js');
  
  return new Promise((resolve, reject) => {
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';
    
    server.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.trim() && line.startsWith('{')) {
          output += line.trim();
        }
      }
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    server.on('close', (code) => {
      if (output) {
        try {
          const response = JSON.parse(output);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${output}\nStderr: ${errorOutput}`));
        }
      } else {
        reject(new Error(`No output received. Code: ${code}\nStderr: ${errorOutput}`));
      }
    });

    server.on('error', (error) => {
      reject(new Error(`Server process error: ${error.message}`));
    });

    // Send the request
    server.stdin.write(JSON.stringify(request) + '\n');
    server.stdin.end();
  });
}

// Run the tests
runTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});