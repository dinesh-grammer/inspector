#!/usr/bin/env node

import open from "open";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import handler from "serve-handler";
import http from "http";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = join(__dirname, "../dist");

const server = http.createServer((request, response) => {
  const handlerOptions = {
    public: distPath,
    rewrites: [{ source: "/**", destination: "/index.html" }],
    headers: [
      {
        // Ensure index.html is never cached
        source: "index.html",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, max-age=0",
          },
        ],
      },
      {
        // Allow long-term caching for hashed assets
        source: "assets/**",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ],
  };

  return handler(request, response, handlerOptions);
});

const port = parseInt(process.env.CLIENT_PORT || "6274", 10);
const host = process.env.HOST || "localhost";
server.on("listening", () => {
  let url = process.env.INSPECTOR_URL || `http://${host}:${port}`;
  
  // If INSPECTOR_URL is not set and MCP_PROXY_FULL_ADDRESS is, add it as a query param
  if (!process.env.INSPECTOR_URL && process.env.MCP_PROXY_FULL_ADDRESS) {
    const params = new URLSearchParams();
    params.set("MCP_PROXY_FULL_ADDRESS", process.env.MCP_PROXY_FULL_ADDRESS);
    url = `${url}/?${params.toString()}`;
  }
  
  console.log(`\n🚀 MCP Inspector is up and running at:\n   ${url}\n`);
  if (process.env.MCP_AUTO_OPEN_ENABLED !== "false") {
    console.log(`🌐 Opening browser...`);
    open(url);
  }
});
server.on("error", (err) => {
  if (err.message.includes(`EADDRINUSE`)) {
    console.error(
      `❌  MCP Inspector PORT IS IN USE at http://${host}:${port} ❌ `,
    );
  } else {
    throw err;
  }
});
server.listen(port, host);
