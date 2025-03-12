import { z } from "zod";
import { handleResponse } from "../utils/response.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BASE_URL, DEFAULT_ACCESS_TOKEN } from "../config/constants.js";

export function registerWebhookTools(server: McpServer) {
  // Create a webhook
  server.tool(
    "create_webhook",
    "Creates a webhook",
    {
      url: z.string().url().regex(/^https?:\/\//).describe("The webhook URL"),
      events: z.array(z.enum([
        "budget.reached",
        "budget.reset",
        "domain.created",
        "deployment.created",
        "deployment.error"
      ])).min(1).describe("Events to subscribe to"),
      projectIds: z.array(z.string()).min(1).max(50).describe("Project IDs to watch"),
      teamId: z.string().optional().describe("Team ID to perform the request on behalf of"),
      slug: z.string().optional().describe("Team slug to perform the request on behalf of")
    },
    async ({ url, events, projectIds, teamId, slug }) => {
      const urlObj = new URL(`${BASE_URL}/v1/webhooks`);
      if (teamId) urlObj.searchParams.append("teamId", teamId);
      if (slug) urlObj.searchParams.append("slug", slug);

      const response = await fetch(urlObj.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          url,
          events,
          projectIds
        }),
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Webhook created:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // Delete a webhook
  server.tool(
    "delete_webhook",
    "Deletes a webhook",
    {
      id: z.string().describe("Webhook ID to delete"),
      teamId: z.string().optional().describe("Team ID to perform the request on behalf of"),
      slug: z.string().optional().describe("Team slug to perform the request on behalf of")
    },
    async ({ id, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v1/webhooks/${id}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      if (response.status === 204) {
        return {
          content: [
            { type: "text", text: `Webhook ${id} was successfully deleted` },
          ],
        };
      }

      const errorData = await response.text();
      throw new Error(`Failed to delete webhook: ${response.status} - ${errorData}`);
    }
  );

  // List webhooks
  server.tool(
    "list_webhooks",
    "Get a list of webhooks",
    {
      projectId: z.string().regex(/^[a-zA-z0-9_]+$/).optional().describe("Filter by project ID"),
      teamId: z.string().optional().describe("Team ID to perform the request on behalf of"),
      slug: z.string().optional().describe("Team slug to perform the request on behalf of")
    },
    async ({ projectId, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v1/webhooks`);
      if (projectId) url.searchParams.append("projectId", projectId);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Webhooks:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // Get a webhook
  server.tool(
    "get_webhook",
    "Get a webhook",
    {
      id: z.string().describe("Webhook ID"),
      teamId: z.string().optional().describe("Team ID to perform the request on behalf of"),
      slug: z.string().optional().describe("Team slug to perform the request on behalf of")
    },
    async ({ id, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v1/webhooks/${id}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Webhook details:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );
} 