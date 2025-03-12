import { z } from "zod";
import { handleResponse } from "../utils/response.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BASE_URL, DEFAULT_ACCESS_TOKEN } from "../config/constants.js";

export function registerTeamTools(server: McpServer) {
  // Create a Team
  server.tool(
    "create_team",
    "Create a new Team under your account",
    {
      slug: z.string().max(48).describe("The desired slug for the Team"),
      name: z.string().max(256).optional().describe("The desired name for the Team"),
      attribution: z.object({
        sessionReferrer: z.string().optional(),
        landingPage: z.string().optional(),
        pageBeforeConversionPage: z.string().optional(),
        utm: z.object({
          utmSource: z.string().optional(),
          utmMedium: z.string().optional(),
          utmCampaign: z.string().optional(),
          utmTerm: z.string().optional()
        }).optional()
      }).optional().describe("Attribution information")
    },
    async ({ slug, name, attribution }) => {
      const response = await fetch(`${BASE_URL}/v1/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ slug, name, attribution }),
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Team created:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // Delete a Team
  server.tool(
    "delete_team",
    "Delete a team under your account",
    {
      teamId: z.string().describe("The Team identifier"),
      newDefaultTeamId: z.string().optional().describe("Id of the team to be set as the new default team"),
      reasons: z.array(z.object({
        slug: z.string().describe("Reason identifier"),
        description: z.string().describe("Detailed description")
      })).optional().describe("Reasons for team deletion")
    },
    async ({ teamId, newDefaultTeamId, reasons }) => {
      const url = new URL(`${BASE_URL}/v1/teams/${teamId}`);
      if (newDefaultTeamId) url.searchParams.append("newDefaultTeamId", newDefaultTeamId);

      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        ...(reasons && { body: JSON.stringify({ reasons }) })
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Team deleted:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // Get Team Information
  server.tool(
    "get_team",
    "Get information for a specific team",
    {
      teamId: z.string().describe("The Team identifier")
    },
    async ({ teamId }) => {
      const response = await fetch(`${BASE_URL}/v2/teams/${teamId}`, {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Team information:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // List Teams
  server.tool(
    "list_teams",
    "Get a list of all teams the authenticated user is a member of",
    {
      limit: z.number().optional().describe("Maximum number of teams to return"),
      since: z.number().optional().describe("Include teams created since timestamp"),
      until: z.number().optional().describe("Include teams created until timestamp")
    },
    async ({ limit, since, until }) => {
      const url = new URL(`${BASE_URL}/v2/teams`);
      if (limit) url.searchParams.append("limit", limit.toString());
      if (since) url.searchParams.append("since", since.toString());
      if (until) url.searchParams.append("until", until.toString());

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Teams:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // List Team Members
  server.tool(
    "list_team_members",
    "Get a list of team members",
    {
      teamId: z.string().describe("The Team identifier"),
      limit: z.number().min(1).optional().describe("Maximum number of members to return"),
      since: z.number().optional().describe("Include members added since timestamp"),
      until: z.number().optional().describe("Include members added until timestamp"),
      search: z.string().optional().describe("Search by name, username, or email"),
      role: z.enum(["OWNER", "MEMBER", "DEVELOPER", "VIEWER", "BILLING", "CONTRIBUTOR"]).optional().describe("Filter by role"),
      excludeProject: z.string().optional().describe("Exclude members from specific project"),
      eligibleMembersForProjectId: z.string().optional().describe("Include members eligible for project")
    },
    async ({ teamId, limit, since, until, search, role, excludeProject, eligibleMembersForProjectId }) => {
      const url = new URL(`${BASE_URL}/v2/teams/${teamId}/members`);
      if (limit) url.searchParams.append("limit", limit.toString());
      if (since) url.searchParams.append("since", since.toString());
      if (until) url.searchParams.append("until", until.toString());
      if (search) url.searchParams.append("search", search);
      if (role) url.searchParams.append("role", role);
      if (excludeProject) url.searchParams.append("excludeProject", excludeProject);
      if (eligibleMembersForProjectId) url.searchParams.append("eligibleMembersForProjectId", eligibleMembersForProjectId);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Team members:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // Invite Team Member
  server.tool(
    "invite_team_member",
    "Invite a user to join a team",
    {
      teamId: z.string().describe("The Team identifier"),
      role: z.enum(["OWNER", "MEMBER", "DEVELOPER", "SECURITY", "BILLING", "VIEWER", "CONTRIBUTOR"]).describe("The role to assign"),
      email: z.string().email().optional().describe("The email address to invite"),
      uid: z.string().optional().describe("The user ID to invite"),
      projects: z.array(z.object({
        projectId: z.string(),
        role: z.enum(["ADMIN", "MEMBER", "VIEWER"])
      })).optional().describe("Project-specific roles")
    },
    async ({ teamId, role, email, uid, projects }) => {
      const response = await fetch(`${BASE_URL}/v1/teams/${teamId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ role, email, uid, projects }),
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Team member invited:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // Remove Team Member
  server.tool(
    "remove_team_member",
    "Remove a member from a team",
    {
      teamId: z.string().describe("The Team identifier"),
      uid: z.string().describe("The user ID to remove"),
      newDefaultTeamId: z.string().optional().describe("New default team ID for Northstar user")
    },
    async ({ teamId, uid, newDefaultTeamId }) => {
      const url = new URL(`${BASE_URL}/v1/teams/${teamId}/members/${uid}`);
      if (newDefaultTeamId) url.searchParams.append("newDefaultTeamId", newDefaultTeamId);

      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Team member removed:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // Update Team Member
  server.tool(
    "update_team_member",
    "Update a team member's role or status",
    {
      teamId: z.string().describe("The Team identifier"),
      uid: z.string().describe("The user ID to update"),
      confirmed: z.literal(true).optional().describe("Accept user's request to join"),
      role: z.enum(["MEMBER", "VIEWER"]).optional().describe("New role for the member"),
      projects: z.array(z.object({
        projectId: z.string(),
        role: z.enum(["ADMIN", "MEMBER", "VIEWER"])
      })).optional().describe("Project-specific roles"),
      joinedFrom: z.object({
        ssoUserId: z.string().nullable()
      }).optional().describe("SSO connection information")
    },
    async ({ teamId, uid, confirmed, role, projects, joinedFrom }) => {
      const response = await fetch(`${BASE_URL}/v1/teams/${teamId}/members/${uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ confirmed, role, projects, joinedFrom }),
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Team member updated:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // Update Team
  server.tool(
    "update_team",
    "Update team information",
    {
      teamId: z.string().describe("The Team identifier"),
      name: z.string().max(256).optional().describe("Team name"),
      slug: z.string().optional().describe("New team slug"),
      description: z.string().max(140).optional().describe("Team description"),
      avatar: z.string().regex(/^[a-f0-9]+$/).optional().describe("Hash of uploaded image"),
      previewDeploymentSuffix: z.string().nullable().optional().describe("Preview deployment suffix"),
      emailDomain: z.union([z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/), z.null()]).optional().describe("Team email domain"),
      regenerateInviteCode: z.boolean().optional().describe("Create new invite code"),
      saml: z.object({
        enforced: z.boolean(),
        roles: z.record(z.enum(["OWNER"]))
      }).optional().describe("SAML configuration"),
      enablePreviewFeedback: z.enum(["on", "off", "default"]).optional().describe("Preview toolbar setting"),
      enableProductionFeedback: z.enum(["on", "off", "default"]).optional().describe("Production toolbar setting"),
      sensitiveEnvironmentVariablePolicy: z.enum(["on", "off", "default"]).optional().describe("Sensitive env var policy"),
      remoteCaching: z.object({
        enabled: z.boolean()
      }).optional().describe("Remote caching settings"),
      hideIpAddresses: z.boolean().optional().describe("Hide IP addresses in monitoring"),
      hideIpAddressesInLogDrains: z.boolean().optional().describe("Hide IP addresses in log drains")
    },
    async ({ teamId, ...updateFields }) => {
      const response = await fetch(`${BASE_URL}/v2/teams/${teamId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(updateFields),
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Team updated:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );
} 