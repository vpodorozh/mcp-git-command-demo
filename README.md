# MCP Git Command Server

A Model Context Protocol (MCP) server that provides git command functionality, specifically for committing files to a git repository.

## Features

- **git-commit**: Stage and commit specified files with a custom commit message

## Installation

1. Clone or download this repository
2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### Running the Server

```bash
npm start
```

Or for development:
```bash
npm run dev
```

### Available Tools

#### git-commit

Stages specified files and commits them to the git repository.

**Parameters:**
- `files` (array of strings, required): List of file paths to stage and commit
- `message` (string, required): Commit message
- `directory` (string, required): Directory path where git commands should be executed

**Example:**
```json
{
  "name": "git-commit",
  "arguments": {
    "files": ["src/index.ts", "package.json"],
    "message": "Update server implementation and dependencies",
    "directory": "/path/to/your/project"
  }
}
```

## Configuration

To use this MCP server with an MCP client (for ZED IDE), add it to your client's configuration:

```json
{
  "context_servers": {
    "git-commit": {
      "command": {
        "path": "npx",
        "args": ["tsx", "FULL_PATH_TO_PROJECT_DIR/src/index.ts"],
        "env": null
      },
      "settings": {}
    }
  }
}
```

## Requirements

- Node.js 18 or higher
- Git installed and available in PATH
- The target directory must be a valid git repository

## Error Handling

The server includes error handling for:
- Invalid git repositories
- Non-existent directories
- Git command failures
- Missing or invalid parameters

## License

MIT
