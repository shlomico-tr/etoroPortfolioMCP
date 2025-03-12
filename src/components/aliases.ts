import { z } from "zod";
import { handleResponse } from "../utils/response.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BASE_URL, DEFAULT_ACCESS_TOKEN } from "../config/constants.js";

export function registerAliasTools(server: McpServer) {
  // Assign an Alias
  server.tool(
    "assign_alias",
    "Creates a new alias for the deployment with the given deployment ID",
    {
      id: z.string().describe("The ID of the deployment to assign the alias to"),
      alias: z.string().describe("The alias to assign (e.g. my-alias.vercel.app)"),
      redirect: z.string().nullable().optional().describe("Optional hostname to redirect to using 307"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ id, alias, redirect, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v2/deployments/${id}/aliases`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ alias, redirect }),
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Alias assigned:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Delete an Alias
  server.tool(
    "delete_alias",
    "Delete an Alias with the specified ID",
    {
      aliasId: z.string().describe("The ID or alias that will be removed"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ aliasId, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v2/aliases/${aliasId}`);
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
        content: [{ type: "text", text: `Alias deleted:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Get an Alias
  server.tool(
    "get_alias",
    "Retrieves an Alias for the given host name or alias ID",
    {
      idOrAlias: z.string().describe("The alias or alias ID to be retrieved"),
      projectId: z.string().optional().describe("Get the alias only if it is assigned to the provided project ID"),
      since: z.number().optional().describe("Get the alias only if it was created after this JavaScript timestamp"),
      until: z.number().optional().describe("Get the alias only if it was created before this JavaScript timestamp"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ idOrAlias, projectId, since, until, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v4/aliases/${idOrAlias}`);
      if (projectId) url.searchParams.append("projectId", projectId);
      if (since) url.searchParams.append("since", since.toString());
      if (until) url.searchParams.append("until", until.toString());
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Alias information:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // List Aliases
  server.tool(
    "list_aliases",
    "Retrieves a list of aliases for the authenticated User or Team",
    {
      domain: z.string().optional().describe("Get only aliases of the given domain name"),
      limit: z.number().optional().describe("Maximum number of aliases to list from a request"),
      projectId: z.string().optional().describe("Filter aliases from the given projectId"),
      since: z.number().optional().describe("Get aliases created after this JavaScript timestamp"),
      until: z.number().optional().describe("Get aliases created before this JavaScript timestamp"),
      rollbackDeploymentId: z.string().optional().describe("Get aliases that would be rolled back for the given deployment"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ domain, limit, projectId, since, until, rollbackDeploymentId, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v4/aliases`);
      if (domain) url.searchParams.append("domain", domain);
      if (limit) url.searchParams.append("limit", limit.toString());
      if (projectId) url.searchParams.append("projectId", projectId);
      if (since) url.searchParams.append("since", since.toString());
      if (until) url.searchParams.append("until", until.toString());
      if (rollbackDeploymentId) url.searchParams.append("rollbackDeploymentId", rollbackDeploymentId);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Aliases list:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // List Deployment Aliases
  server.tool(
    "list_deployment_aliases",
    "Retrieves all Aliases for the Deployment with the given ID",
    {
      id: z.string().describe("The ID of the deployment the aliases should be listed for"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ id, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v2/deployments/${id}/aliases`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Deployment aliases:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );
} 