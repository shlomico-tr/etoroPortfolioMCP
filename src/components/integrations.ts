import { z } from "zod";
import { handleResponse } from "../utils/response.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BASE_URL, DEFAULT_ACCESS_TOKEN } from "../config/constants.js";

export function registerIntegrationTools(server: McpServer) {
  // Delete integration configuration
  server.tool(
    "int_delete",
    "Delete an integration configuration",
    {
      id: z.string().describe("ID of the configuration to delete"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ id, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v1/integrations/configuration/${id}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}` }
      });

      await handleResponse(response);
      return {
        content: [{ type: "text", text: "Integration configuration deleted successfully" }]
      };
    }
  );

  // List configurations
  server.tool(
    "int_list",
    "Get configurations for the authenticated user or team",
    {
      view: z.enum(["account", "project"]).describe("View type for configurations"),
      installationType: z.enum(["marketplace", "external"]).optional().describe("Type of installation"),
      integrationIdOrSlug: z.string().optional().describe("ID of the integration"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ view, installationType, integrationIdOrSlug, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v1/integrations/configurations`);
      url.searchParams.append("view", view);
      if (installationType) url.searchParams.append("installationType", installationType);
      if (integrationIdOrSlug) url.searchParams.append("integrationIdOrSlug", integrationIdOrSlug);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}` }
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Integration configurations:\n${JSON.stringify(data, null, 2)}` }]
      };
    }
  );

  // List git namespaces
  server.tool(
    "int_gitns",
    "List git namespaces by provider",
    {
      host: z.string().optional().describe("The custom Git host if using a custom Git provider"),
      provider: z.enum(["github", "github-custom-host", "gitlab", "bitbucket"]).optional().describe("Git provider")
    },
    async ({ host, provider }) => {
      const url = new URL(`${BASE_URL}/v1/integrations/git-namespaces`);
      if (host) url.searchParams.append("host", host);
      if (provider) url.searchParams.append("provider", provider);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}` }
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Git namespaces:\n${JSON.stringify(data, null, 2)}` }]
      };
    }
  );

  // Search repositories
  server.tool(
    "int_search_repo",
    "List git repositories linked to namespace",
    {
      query: z.string().optional().describe("Search query"),
      namespaceId: z.string().optional().describe("Namespace ID"),
      provider: z.enum(["github", "github-custom-host", "gitlab", "bitbucket"]).optional().describe("Git provider"),
      installationId: z.string().optional().describe("Installation ID"),
      host: z.string().optional().describe("Custom Git host"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ query, namespaceId, provider, installationId, host, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v1/integrations/search-repo`);
      if (query) url.searchParams.append("query", query);
      if (namespaceId) url.searchParams.append("namespaceId", namespaceId);
      if (provider) url.searchParams.append("provider", provider);
      if (installationId) url.searchParams.append("installationId", installationId);
      if (host) url.searchParams.append("host", host);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}` }
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Git repositories:\n${JSON.stringify(data, null, 2)}` }]
      };
    }
  );

  // Get integration configuration
  server.tool(
    "int_get",
    "Retrieve an integration configuration",
    {
      id: z.string().describe("ID of the configuration to check"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ id, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v1/integrations/configuration/${id}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}` }
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Integration configuration:\n${JSON.stringify(data, null, 2)}` }]
      };
    }
  );

  // Update deployment integration action
  server.tool(
    "int_update_action",
    "Update deployment integration action",
    {
      deploymentId: z.string().describe("Deployment ID"),
      integrationConfigurationId: z.string().describe("Integration configuration ID"),
      resourceId: z.string().describe("Resource ID"),
      action: z.string().describe("Action to update"),
      status: z.enum(["running", "succeeded", "failed"]).describe("Status of the action"),
      statusText: z.string().optional().describe("Status text"),
      outcomes: z.array(z.object({
        kind: z.string(),
        secrets: z.array(z.object({
          name: z.string(),
          value: z.string()
        })).optional()
      })).optional().describe("Action outcomes")
    },
    async ({ deploymentId, integrationConfigurationId, resourceId, action, status, statusText, outcomes }) => {
      const url = new URL(`${BASE_URL}/v1/deployments/${deploymentId}/integrations/${integrationConfigurationId}/resources/${resourceId}/actions/${action}`);

      const response = await fetch(url.toString(), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          status,
          statusText,
          outcomes
        })
      });

      await handleResponse(response);
      return {
        content: [{ type: "text", text: "Integration action updated successfully" }]
      };
    }
  );
} 