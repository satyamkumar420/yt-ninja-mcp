// YT-NINJA MCP Server Entry Point

import { startServer } from './server.js';

/**
 * Main entry point for YT-NINJA MCP Server
 * Starts the server and handles any startup errors
 */
async function main() {
  try {
    // Validate required environment variables
    if (!process.env.GEMINI_API_KEY) {
      console.error('Error: GEMINI_API_KEY environment variable is required');
      console.error('Please set your Google GenAI API key in the environment');
      console.error('Example: export GEMINI_API_KEY=your-api-key-here');
      process.exit(1);
    }

    // Start the MCP server
    await startServer();
  } catch (error) {
    console.error('Failed to start YT-NINJA MCP Server:', error);
    process.exit(1);
  }
}

// Run the server
main();
