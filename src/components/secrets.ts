import { z } from "zod";
import { handleResponse } from "../utils/response.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BASE_URL, DEFAULT_ACCESS_TOKEN } from "../config/constants.js";

// Common parameter schemas
const teamParams = {
  teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
  slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
};

export function registerSecretTools(server: McpServer) {
  // Create a new secret
  server.tool(
    "create_secret",
    "Create a new secret",
    {
      name: z.string().max(100).describe("The name of the secret (max 100 characters)"),
      value: z.string().describe("The value of the new secret"),
      decryptable: z.boolean().optional().describe("Whether the secret value can be decrypted after creation"),
      projectId: z.string().optional().describe("Associate a secret to a project"),
      ...teamParams
    },
    async ({ name, value, decryptable, projectId, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v2/secrets/${name}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ name, value, decryptable, projectId }),
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Secret created:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // Change secret name
  server.tool(
    "update_secret_name",
    "Change the name of a secret",
    {
      currentName: z.string().describe("The current name of the secret"),
      newName: z.string().max(100).describe("The new name for the secret"),
      ...teamParams
    },
    async ({ currentName, newName, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v2/secrets/${currentName}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ name: newName }),
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Secret name updated:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // Delete a secret
  server.tool(
    "delete_secret",
    "Delete a secret",
    {
      idOrName: z.string().describe("The name or unique identifier of the secret"),
      ...teamParams
    },
    async ({ idOrName, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v2/secrets/${idOrName}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Secret deleted:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // Get a single secret
  server.tool(
    "get_secret",
    "Get information for a specific secret",
    {
      idOrName: z.string().describe("The name or unique identifier of the secret"),
      decrypt: z.enum(["true", "false"]).optional().describe("Whether to try to decrypt the value of the secret"),
      ...teamParams
    },
    async ({ idOrName, decrypt, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v3/secrets/${idOrName}`);
      if (decrypt) url.searchParams.append("decrypt", decrypt);
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
          { type: "text", text: `Secret information:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // List secrets
  server.tool(
    "list_secrets",
    "List all secrets",
    {
      id: z.string().optional().describe("Filter by comma separated secret ids"),
      projectId: z.string().optional().describe("Filter by project ID"),
      ...teamParams
    },
    async ({ id, projectId, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v3/secrets`);
      if (id) url.searchParams.append("id", id);
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
          { type: "text", text: `Secrets:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );
} 