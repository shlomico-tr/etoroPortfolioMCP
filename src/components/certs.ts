import { z } from "zod";
import { handleResponse } from "../utils/response.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BASE_URL, DEFAULT_ACCESS_TOKEN } from "../config/constants.js";

export function registerCertTools(server: McpServer) {
  // Get cert by id
  server.tool(
    "get_cert",
    "Get certificate by ID",
    {
      id: z.string().describe("The cert id"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ id, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v7/certs/${id}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Certificate details:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Issue a new cert
  server.tool(
    "issue_cert",
    "Issue a new certificate",
    {
      cns: z.array(z.string()).describe("The common names the cert should be issued for"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ cns, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v7/certs`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ cns }),
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Certificate issued:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Remove cert
  server.tool(
    "remove_cert",
    "Remove a certificate",
    {
      id: z.string().describe("The cert id to remove"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ id, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v7/certs/${id}`);
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
        content: [{ type: "text", text: `Certificate removed:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Upload a cert
  server.tool(
    "upload_cert",
    "Upload a certificate",
    {
      ca: z.string().describe("The certificate authority"),
      key: z.string().describe("The certificate key"),
      cert: z.string().describe("The certificate"),
      skipValidation: z.boolean().optional().describe("Skip validation of the certificate"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ ca, key, cert, skipValidation, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v7/certs`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ ca, key, cert, skipValidation }),
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Certificate uploaded:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );
} 