#!/usr/bin/env node

import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
const args = process.argv.slice(2);
const configPath = args[0] || 'sample-config-with-client-settings.json';

// Read the config file
let config;
try {
  const configContent = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configContent);
} catch (error) {
  console.error(`Error reading config file: ${error.message}`);
  process.exit(1);
}

// Extract client settings
const clientSettings = config.clientSettings || {};

// Build URL parameters from client settings
const urlParams = new URLSearchParams();
for (const [key, value] of Object.entries(clientSettings)) {
  urlParams.set(key, String(value));
}

// Start the inspector with the URL parameters
const startCommand = 'node';
const startArgs = ['client/bin/start.js'];

console.log('Starting MCP Inspector with client settings...');
console.log('Client settings:', clientSettings);

// Set the URL with parameters as an environment variable
const clientUrl = `http://localhost:6274/?${urlParams.toString()}`;
console.log(`\nThe inspector will open with these settings applied:`);
console.log(`URL: ${clientUrl}`);

// Start the inspector
const inspector = spawn(startCommand, startArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    // This will make the browser open with the correct URL
    INSPECTOR_URL: clientUrl
  }
});

inspector.on('error', (err) => {
  console.error('Failed to start inspector:', err);
  process.exit(1);
});

inspector.on('exit', (code) => {
  process.exit(code || 0);
});
