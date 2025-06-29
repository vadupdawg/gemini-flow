#!/usr/bin/env node

// Wrapper to run the TypeScript MCP server
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

require('./server.ts');