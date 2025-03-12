import { z } from "zod";
import { handleResponse } from "../utils/response.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BASE_URL, DEFAULT_ACCESS_TOKEN } from "../config/constants.js";

export function registerLogDrainTools(server: McpServer) {
  // Create configurable log drain
  server.tool(
    "logdrain_create",
    "Creates a configurable log drain",
    {
      deliveryFormat: z.enum(["json", "ndjson"]).describe("The delivery log format"),
      url: z.string().url().regex(/^(http|https)?:\/\//).describe("The log drain url"),
      headers: z.record(z.string()).optional().describe("Headers to be sent together with the request"),
      projectIds: z.array(z.string()).min(1).max(50).describe("Project IDs to watch"),
      sources: z.array(z.enum(["static", "lambda", "build", "edge", "external", "firewall"])).min(1).describe("Sources to watch"),
      environments: z.array(z.enum(["preview", "production"])).min(1).describe("Environments to watch"),
      secret: z.string().optional().describe("Custom secret of log drain"),
      samplingRate: z.number().min(0.01).max(1).optional().describe("The sampling rate for this log drain"),
      name: z.string().optional().describe("The custom name of this log drain"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ deliveryFormat, url, headers, projectIds, sources, environments, secret, samplingRate, name, teamId, slug }) => {
      const apiUrl = new URL(`${BASE_URL}/v1/log-drains`);
      if (teamId) apiUrl.searchParams.append("teamId", teamId);
      if (slug) apiUrl.searchParams.append("slug", slug);

      const response = await fetch(apiUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          deliveryFormat,
          url,
          headers,
          projectIds,
          sources,
          environments,
          secret,
          samplingRate,
          name
        })
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Log drain created:\n${JSON.stringify(data, null, 2)}` }]
      };
    }
  );

  // Create integration log drain
  server.tool(
    "logdrain_create_integration",
    "Creates an integration log drain",
    {
      name: z.string().max(100).regex(/^[A-z0-9_ -]+$/).describe("The name of the log drain"),
      projectIds: z.array(z.string()).min(1).max(50).optional().describe("Project IDs to watch"),
      secret: z.string().max(100).regex(/^[A-z0-9_ -]+$/).optional().describe("Secret to sign log drain notifications"),
      deliveryFormat: z.enum(["json", "ndjson", "syslog"]).describe("The delivery log format"),
      url: z.string().url().regex(/^(https?|syslog\+tls|syslog):\/\//).describe("The url where you will receive logs"),
      sources: z.array(z.enum(["static", "lambda", "build", "edge", "external", "firewall"])).optional().describe("Sources to watch"),
      headers: z.record(z.string()).optional().describe("Headers to be sent together with the request"),
      environments: z.array(z.enum(["preview", "production"])).optional().describe("Environments to watch"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ name, projectIds, secret, deliveryFormat, url, sources, headers, environments, teamId, slug }) => {
      const apiUrl = new URL(`${BASE_URL}/v2/integrations/log-drains`);
      if (teamId) apiUrl.searchParams.append("teamId", teamId);
      if (slug) apiUrl.searchParams.append("slug", slug);

      const response = await fetch(apiUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          name,
          projectIds,
          secret,
          deliveryFormat,
          url,
          sources,
          headers,
          environments
        })
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Integration log drain created:\n${JSON.stringify(data, null, 2)}` }]
      };
    }
  );

  // Delete log drain
  server.tool(
    "logdrain_delete",
    "Deletes a configurable log drain",
    {
      id: z.string().describe("The log drain ID to delete"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ id, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v1/log-drains/${id}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}` }
      });

      await handleResponse(response);
      return {
        content: [{ type: "text", text: "Log drain deleted successfully" }]
      };
    }
  );

  // Delete integration log drain
  server.tool(
    "logdrain_delete_integration",
    "Deletes an integration log drain",
    {
      id: z.string().describe("ID of the log drain to be deleted"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ id, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v1/integrations/log-drains/${id}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}` }
      });

      await handleResponse(response);
      return {
        content: [{ type: "text", text: "Integration log drain deleted successfully" }]
      };
    }
  );

  // Get log drain
  server.tool(
    "logdrain_get",
    "Retrieves a configurable log drain",
    {
      id: z.string().describe("The log drain ID"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ id, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v1/log-drains/${id}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}` }
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Log drain details:\n${JSON.stringify(data, null, 2)}` }]
      };
    }
  );

  // List log drains
  server.tool(
    "logdrain_list",
    "Retrieves a list of all log drains",
    {
      projectId: z.string().regex(/^[a-zA-z0-9_]+$/).optional().describe("Filter by project ID"),
      projectIdOrName: z.string().optional().describe("Filter by project ID or name"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ projectId, projectIdOrName, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v1/log-drains`);
      if (projectId) url.searchParams.append("projectId", projectId);
      if (projectIdOrName) url.searchParams.append("projectIdOrName", projectIdOrName);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}` }
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Log drains list:\n${JSON.stringify(data, null, 2)}` }]
      };
    }
  );

  // List integration log drains
  server.tool(
    "logdrain_list_integration",
    "Retrieves a list of integration log drains",
    {
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v2/integrations/log-drains`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}` }
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Integration log drains list:\n${JSON.stringify(data, null, 2)}` }]
      };
    }
  );
} 