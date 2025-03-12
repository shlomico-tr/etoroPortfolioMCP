import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { handleResponse } from "../utils/response.js";
import { BASE_URL as DEFAULT_BASE_URL, DEFAULT_ACCESS_TOKEN } from "../config/constants.js";

// Common parameter schemas
const teamParams = {
  teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
  slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
};

export function registerProjectMemberTools(server: McpServer) {
  // Add Project Member
  server.tool(
    "add_project_member",
    "Adds a new member to a project",
    {
      idOrName: z.string().describe("The ID or name of the Project"),
      uid: z.string().max(256).optional().describe("The ID of the team member that should be added to this project"),
      username: z.string().max(256).optional().describe("The username of the team member that should be added to this project"),
      email: z.string().email().optional().describe("The email of the team member that should be added to this project"),
      role: z.enum(["ADMIN", "PROJECT_DEVELOPER", "PROJECT_VIEWER"]).describe("The project role of the member that will be added"),
      ...teamParams
    },
    async ({ idOrName, uid, username, email, role, teamId, slug }) => {
      const url = new URL(`${DEFAULT_BASE_URL}/v1/projects/${idOrName}/members`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          ...(uid && { uid }),
          ...(username && { username }),
          ...(email && { email }),
          role,
        }),
      });
      
      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Project member added:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // List Project Members
  server.tool(
    "list_project_members",
    "Lists all members of a project",
    {
      idOrName: z.string().describe("The ID or name of the Project"),
      limit: z.number().min(1).max(100).optional().describe("Limit how many project members should be returned"),
      since: z.number().optional().describe("Timestamp in milliseconds to only include members added since then"),
      until: z.number().optional().describe("Timestamp in milliseconds to only include members added until then"),
      search: z.string().optional().describe("Search project members by their name, username, and email"),
      ...teamParams
    },
    async ({ idOrName, limit, since, until, search, teamId, slug }) => {
      const url = new URL(`${DEFAULT_BASE_URL}/v1/projects/${idOrName}/members`);
      const queryParams = new URLSearchParams();
      
      if (limit) queryParams.append("limit", limit.toString());
      if (since) queryParams.append("since", since.toString());
      if (until) queryParams.append("until", until.toString());
      if (search) queryParams.append("search", search);
      if (teamId) queryParams.append("teamId", teamId);
      if (slug) queryParams.append("slug", slug);

      const response = await fetch(`${url.toString()}?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });
      
      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Project members:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Remove Project Member
  server.tool(
    "remove_project_member",
    "Remove a member from a specific project",
    {
      idOrName: z.string().describe("The ID or name of the Project"),
      uid: z.string().describe("The user ID of the member"),
      ...teamParams
    },
    async ({ idOrName, uid, teamId, slug }) => {
      const url = new URL(`${DEFAULT_BASE_URL}/v1/projects/${idOrName}/members/${uid}`);
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
        content: [{ type: "text", text: `Project member removed:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );
} 