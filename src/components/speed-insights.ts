import { z } from "zod";
import { handleResponse } from "../utils/response.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BASE_URL, DEFAULT_ACCESS_TOKEN } from "../config/constants.js";

// Common schemas
const VitalsSchema = z.object({
  dsn: z.string().describe("Project's unique identifier (VERCEL_ANALYTICS_ID)"),
  event_name: z.string().describe("Name of the vital to track"),
  href: z.string().describe("Full URL for the deployed application"),
  id: z.string().describe("Unique identifier for the vital"),
  page: z.string().describe("Framework's file name path"),
  speed: z.string().describe("Connection information from visitor device"),
  value: z.string().describe("Value of the vital to track")
});

export function registerSpeedInsightsTools(server: McpServer) {
  // Send Web Vitals
  server.tool(
    "send_web_vitals",
    "Send web vitals data to Speed Insights API (Deprecated: Use @vercel/speed-insights package instead)",
    {
      vitals: VitalsSchema.describe("Web vitals data")
    },
    async ({ vitals }) => {
      const response = await fetch(`${BASE_URL}/v1/vitals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(vitals),
      });

      await handleResponse(response);
      return {
        content: [
          { type: "text", text: "Web vitals data sent successfully" },
          { type: "text", text: "⚠️ Warning: This API is deprecated. Please use @vercel/speed-insights package instead." }
        ],
      };
    }
  );
} 