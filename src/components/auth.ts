import { z } from "zod";
import { handleResponse } from "../utils/response.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BASE_URL, DEFAULT_ACCESS_TOKEN } from "../config/constants.js";

export function registerAuthTools(server: McpServer) {
  // Create Auth Token
  server.tool(
    "create_auth_token",
    "Creates and returns a new authentication token for the currently authenticated User",
    {
      name: z.string().describe("Name of the token"),
      expiresAt: z.number().optional().describe("Token expiration timestamp"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ name, expiresAt, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v3/user/tokens`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ name, expiresAt }),
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Auth token created:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Delete Auth Token
  server.tool(
    "delete_auth_token",
    "Invalidate an authentication token",
    {
      tokenId: z.string().describe("The identifier of the token to invalidate. Use 'current' for the current token"),
    },
    async ({ tokenId }) => {
      const response = await fetch(`${BASE_URL}/v3/user/tokens/${tokenId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Auth token deleted:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Get Auth Token Metadata
  server.tool(
    "get_auth_token",
    "Retrieve metadata about an authentication token",
    {
      tokenId: z.string().describe("The identifier of the token to retrieve. Use 'current' for the current token"),
    },
    async ({ tokenId }) => {
      const response = await fetch(`${BASE_URL}/v5/user/tokens/${tokenId}`, {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Auth token metadata:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // List Auth Tokens
  server.tool(
    "list_auth_tokens",
    "Retrieve a list of the current User's authentication tokens",
    {},
    async () => {
      const response = await fetch(`${BASE_URL}/v5/user/tokens`, {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Auth tokens list:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // SSO Token Exchange
  server.tool(
    "sso_token_exchange",
    "Exchange OAuth code for OIDC token during SSO authorization",
    {
      code: z.string().describe("The sensitive code received from Vercel"),
      state: z.string().optional().describe("The state received from the initialization request"),
      clientId: z.string().describe("The integration client id"),
      clientSecret: z.string().describe("The integration client secret"),
      redirectUri: z.string().optional().describe("The integration redirect URI")
    },
    async ({ code, state, clientId, clientSecret, redirectUri }) => {
      const response = await fetch(`${BASE_URL}/v1/integrations/sso/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          code,
          state,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri
        }),
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `SSO token exchange completed:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );
} 