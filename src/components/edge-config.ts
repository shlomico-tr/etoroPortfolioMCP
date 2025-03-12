import { z } from "zod";
import { handleResponse } from "../utils/response.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BASE_URL, DEFAULT_ACCESS_TOKEN } from "../config/constants.js";

// Common schemas
const EdgeConfigItemSchema = z.object({
  key: z.string(),
  value: z.any(),
  description: z.string().optional()
});

const EdgeConfigTokenSchema = z.object({
  token: z.string(),
  label: z.string(),
  id: z.string(),
  edgeConfigId: z.string(),
  createdAt: z.number()
});

const EdgeConfigSchema = z.object({
  createdAt: z.number(),
  updatedAt: z.number(),
  id: z.string(),
  slug: z.string(),
  ownerId: z.string(),
  digest: z.string(),
  transfer: z.object({
    fromAccountId: z.string(),
    startedAt: z.number(),
    doneAt: z.null()
  }).optional(),
  schema: z.record(z.any()),
  purpose: z.object({
    type: z.literal("flags"),
    projectId: z.string()
  }).optional(),
  sizeInBytes: z.number(),
  itemCount: z.number()
});

export function registerEdgeConfigTools(server: McpServer) {
  // Create Edge Config
  server.tool(
    "create_edge_config",
    "Create a new Edge Config",
    {
      slug: z.string().max(64).regex(/^[\w-]+$/).describe("Edge Config slug"),
      items: z.record(z.any()).optional().describe("Initial items")
    },
    async (body) => {
      const response = await fetch(`${BASE_URL}/v1/edge-config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(body),
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Edge Config created:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Create Edge Config Token
  server.tool(
    "create_edge_config_token",
    "Create a new Edge Config Token",
    {
      edgeConfigId: z.string().describe("Edge Config ID"),
      label: z.string().max(52).describe("Token label")
    },
    async ({ edgeConfigId, label }) => {
      const response = await fetch(`${BASE_URL}/v1/edge-config/${edgeConfigId}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ label }),
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Token created:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Get Edge Configs
  server.tool(
    "list_edge_configs",
    "List all Edge Configs",
    {},
    async () => {
      const response = await fetch(`${BASE_URL}/v1/edge-config`, {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Edge Configs:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Get Edge Config
  server.tool(
    "get_edge_config",
    "Get an Edge Config",
    {
      edgeConfigId: z.string().describe("Edge Config ID")
    },
    async ({ edgeConfigId }) => {
      const response = await fetch(`${BASE_URL}/v1/edge-config/${edgeConfigId}`, {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Edge Config details:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Update Edge Config
  server.tool(
    "update_edge_config",
    "Update an Edge Config",
    {
      edgeConfigId: z.string().describe("Edge Config ID"),
      slug: z.string().max(64).regex(/^[\w-]+$/).describe("New slug")
    },
    async ({ edgeConfigId, slug }) => {
      const response = await fetch(`${BASE_URL}/v1/edge-config/${edgeConfigId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ slug }),
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Edge Config updated:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Delete Edge Config
  server.tool(
    "delete_edge_config",
    "Delete an Edge Config",
    {
      edgeConfigId: z.string().describe("Edge Config ID")
    },
    async ({ edgeConfigId }) => {
      const response = await fetch(`${BASE_URL}/v1/edge-config/${edgeConfigId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      await handleResponse(response);
      return {
        content: [{ type: "text", text: "Edge Config deleted successfully" }],
      };
    }
  );

  // Get Edge Config Items
  server.tool(
    "list_edge_config_items",
    "List Edge Config Items",
    {
      edgeConfigId: z.string().describe("Edge Config ID")
    },
    async ({ edgeConfigId }) => {
      const response = await fetch(`${BASE_URL}/v1/edge-config/${edgeConfigId}/items`, {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Edge Config items:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Get Edge Config Item
  server.tool(
    "get_edge_config_item",
    "Get an Edge Config Item",
    {
      edgeConfigId: z.string().describe("Edge Config ID"),
      itemKey: z.string().describe("Item key")
    },
    async ({ edgeConfigId, itemKey }) => {
      const response = await fetch(`${BASE_URL}/v1/edge-config/${edgeConfigId}/item/${itemKey}`, {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Item details:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Update Edge Config Items
  server.tool(
    "update_edge_config_items",
    "Update Edge Config Items",
    {
      edgeConfigId: z.string().describe("Edge Config ID"),
      items: z.array(z.object({
        operation: z.enum(["upsert", "remove"]),
        key: z.string(),
        value: z.any().optional(),
        description: z.string().optional()
      })).describe("Items to update"),
      definition: z.any().optional().describe("Schema definition")
    },
    async ({ edgeConfigId, ...body }) => {
      const response = await fetch(`${BASE_URL}/v1/edge-config/${edgeConfigId}/items`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(body),
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Items updated:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Get Edge Config Schema
  server.tool(
    "get_edge_config_schema",
    "Get Edge Config Schema",
    {
      edgeConfigId: z.string().describe("Edge Config ID")
    },
    async ({ edgeConfigId }) => {
      const response = await fetch(`${BASE_URL}/v1/edge-config/${edgeConfigId}/schema`, {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Schema:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Update Edge Config Schema
  server.tool(
    "update_edge_config_schema",
    "Update Edge Config Schema",
    {
      edgeConfigId: z.string().describe("Edge Config ID"),
      definition: z.any().describe("Schema definition")
    },
    async ({ edgeConfigId, definition }) => {
      const response = await fetch(`${BASE_URL}/v1/edge-config/${edgeConfigId}/schema`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ definition }),
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Schema updated:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Delete Edge Config Schema
  server.tool(
    "delete_edge_config_schema",
    "Delete Edge Config Schema",
    {
      edgeConfigId: z.string().describe("Edge Config ID")
    },
    async ({ edgeConfigId }) => {
      const response = await fetch(`${BASE_URL}/v1/edge-config/${edgeConfigId}/schema`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      await handleResponse(response);
      return {
        content: [{ type: "text", text: "Schema deleted successfully" }],
      };
    }
  );

  // Get Edge Config Tokens
  server.tool(
    "list_edge_config_tokens",
    "List Edge Config Tokens",
    {
      edgeConfigId: z.string().describe("Edge Config ID")
    },
    async ({ edgeConfigId }) => {
      const response = await fetch(`${BASE_URL}/v1/edge-config/${edgeConfigId}/tokens`, {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Tokens:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Get Edge Config Token
  server.tool(
    "get_edge_config_token",
    "Get Edge Config Token",
    {
      edgeConfigId: z.string().describe("Edge Config ID"),
      token: z.string().describe("Token value")
    },
    async ({ edgeConfigId, token }) => {
      const response = await fetch(`${BASE_URL}/v1/edge-config/${edgeConfigId}/token/${token}`, {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Token details:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Delete Edge Config Tokens
  server.tool(
    "delete_edge_config_tokens",
    "Delete Edge Config Tokens",
    {
      edgeConfigId: z.string().describe("Edge Config ID"),
      tokens: z.array(z.string()).describe("Tokens to delete")
    },
    async ({ edgeConfigId, tokens }) => {
      const response = await fetch(`${BASE_URL}/v1/edge-config/${edgeConfigId}/tokens`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ tokens }),
      });

      await handleResponse(response);
      return {
        content: [{ type: "text", text: "Tokens deleted successfully" }],
      };
    }
  );

  // Get Edge Config Backups
  server.tool(
    "list_edge_config_backups",
    "List Edge Config Backups",
    {
      edgeConfigId: z.string().describe("Edge Config ID"),
      limit: z.number().min(0).max(50).optional().describe("Number of backups to return"),
      next: z.string().optional().describe("Next page token")
    },
    async ({ edgeConfigId, ...params }) => {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.set("limit", params.limit.toString());
      if (params.next) queryParams.set("next", params.next);

      const response = await fetch(`${BASE_URL}/v1/edge-config/${edgeConfigId}/backups?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Backups:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Get Edge Config Backup
  server.tool(
    "get_edge_config_backup",
    "Get Edge Config Backup",
    {
      edgeConfigId: z.string().describe("Edge Config ID"),
      backupId: z.string().describe("Backup version ID")
    },
    async ({ edgeConfigId, backupId }) => {
      const response = await fetch(`${BASE_URL}/v1/edge-config/${edgeConfigId}/backups/${backupId}`, {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Backup details:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );
} 