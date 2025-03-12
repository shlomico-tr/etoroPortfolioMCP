import { z } from "zod";
import { handleResponse } from "../utils/response.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BASE_URL, DEFAULT_ACCESS_TOKEN } from "../config/constants.js";

// Types for environment management
const BranchMatcherSchema = z.object({
  type: z.enum(['equals']),
  pattern: z.string()
}).optional();

const CreateEnvironmentSchema = z.object({
  slug: z.string().max(32),
  description: z.string().max(256).optional(),
  branchMatcher: BranchMatcherSchema,
  copyEnvVarsFrom: z.string().optional()
});

const UpdateEnvironmentSchema = z.object({
  slug: z.string().max(32).optional(),
  description: z.string().max(256).optional(),
  branchMatcher: BranchMatcherSchema.nullable()
});

const DeleteEnvironmentSchema = z.object({
  deleteUnassignedEnvironmentVariables: z.boolean().optional()
});

export function registerEnvironmentTools(server: McpServer) {
  // Create Environment
  server.tool(
    "create_environment",
    "Create a custom environment for a project",
    {
      idOrName: z.string().describe("Project ID or name"),
      slug: z.string().max(32).describe("Environment slug"),
      description: z.string().max(256).optional().describe("Environment description"),
      branchMatcher: z.object({
        type: z.enum(["equals"]),
        pattern: z.string()
      }).optional().describe("Branch matching configuration"),
      copyEnvVarsFrom: z.string().optional().describe("Copy environment variables from this environment"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      teamSlug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ idOrName, slug, description, branchMatcher, copyEnvVarsFrom, teamId, teamSlug }) => {
      const url = new URL(`${BASE_URL}/v9/projects/${idOrName}/custom-environments`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (teamSlug) url.searchParams.append("slug", teamSlug);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ slug, description, branchMatcher, copyEnvVarsFrom }),
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Environment created:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Delete Environment
  server.tool(
    "delete_environment",
    "Remove a custom environment from a project",
    {
      idOrName: z.string().describe("Project ID or name"),
      environmentSlugOrId: z.string().describe("Environment slug or ID"),
      deleteUnassignedEnvVars: z.boolean().optional().describe("Delete unassigned environment variables"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      teamSlug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ idOrName, environmentSlugOrId, deleteUnassignedEnvVars, teamId, teamSlug }) => {
      const url = new URL(`${BASE_URL}/v9/projects/${idOrName}/custom-environments/${environmentSlugOrId}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (teamSlug) url.searchParams.append("slug", teamSlug);

      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ deleteUnassignedEnvironmentVariables: deleteUnassignedEnvVars }),
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Environment deleted:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Get Environment
  server.tool(
    "get_environment",
    "Retrieve a custom environment",
    {
      idOrName: z.string().describe("Project ID or name"),
      environmentSlugOrId: z.string().describe("Environment slug or ID"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      teamSlug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ idOrName, environmentSlugOrId, teamId, teamSlug }) => {
      const url = new URL(`${BASE_URL}/v9/projects/${idOrName}/custom-environments/${environmentSlugOrId}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (teamSlug) url.searchParams.append("slug", teamSlug);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Environment details:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // List Environments
  server.tool(
    "list_environments",
    "List custom environments for a project",
    {
      idOrName: z.string().describe("Project ID or name"),
      gitBranch: z.string().optional().describe("Filter by git branch"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      teamSlug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ idOrName, gitBranch, teamId, teamSlug }) => {
      const url = new URL(`${BASE_URL}/v9/projects/${idOrName}/custom-environments`);
      if (gitBranch) url.searchParams.append("gitBranch", gitBranch);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (teamSlug) url.searchParams.append("slug", teamSlug);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Environments list:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Update Environment
  server.tool(
    "update_environment",
    "Update a custom environment",
    {
      idOrName: z.string().describe("Project ID or name"),
      environmentSlugOrId: z.string().describe("Environment slug or ID"),
      slug: z.string().max(32).optional().describe("New environment slug"),
      description: z.string().max(256).optional().describe("New environment description"),
      branchMatcher: z.object({
        type: z.enum(["equals"]),
        pattern: z.string()
      }).nullable().optional().describe("New branch matching configuration"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      teamSlug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ idOrName, environmentSlugOrId, slug, description, branchMatcher, teamId, teamSlug }) => {
      const url = new URL(`${BASE_URL}/v9/projects/${idOrName}/custom-environments/${environmentSlugOrId}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (teamSlug) url.searchParams.append("slug", teamSlug);

      const response = await fetch(url.toString(), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ slug, description, branchMatcher }),
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Environment updated:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );
}
