// Configuration for the MCP server
export const config = {
  server: {
    name: "etoro-mcp-server",
    version: "1.0.0",
    port: process.env.PORT ? parseInt(process.env.PORT) : 3001,
    host: process.env.HOST || "localhost"
  },
  sse: {
    enabled: true,
    path: "/sse",
    executePath: "/sse/execute",
    toolsPath: "/sse/tools"
  },
  // Add other configuration options as needed
}; 