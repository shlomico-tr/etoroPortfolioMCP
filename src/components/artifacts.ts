import { z } from "zod";
import { handleResponse } from "../utils/response.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BASE_URL, DEFAULT_ACCESS_TOKEN } from "../config/constants.js";

export function registerArtifactTools(server: McpServer) {
  // Check if artifact exists
  server.tool(
    "check_artifact",
    "Check that a cache artifact with the given hash exists",
    {
      hash: z.string().describe("The artifact hash"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ hash, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v8/artifacts/${hash}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "HEAD",
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      await handleResponse(response);
      return {
        content: [{ type: "text", text: "Artifact exists" }],
      };
    }
  );

  // Download artifact
  server.tool(
    "download_artifact",
    "Downloads a cache artifact identified by its hash",
    {
      hash: z.string().describe("The artifact hash"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of"),
      ci: z.string().optional().describe("The CI environment where this artifact is downloaded"),
      interactive: z.boolean().optional().describe("Whether the client is an interactive shell")
    },
    async ({ hash, teamId, slug, ci, interactive }) => {
      const url = new URL(`${BASE_URL}/v8/artifacts/${hash}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const headers: Record<string, string> = {
        Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
      };

      if (ci) headers["x-artifact-client-ci"] = ci;
      if (interactive !== undefined) headers["x-artifact-client-interactive"] = interactive ? "1" : "0";

      const response = await fetch(url.toString(), { headers });
      const data = await response.blob();
      
      return {
        content: [{ type: "text", text: `Artifact downloaded: ${data.size} bytes` }],
      };
    }
  );

  // Get Remote Caching Status
  server.tool(
    "get_artifact_status",
    "Check the status of Remote Caching for this principal",
    {
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v8/artifacts/status`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Remote Caching status:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Query Artifact Info
  server.tool(
    "query_artifacts",
    "Query information about an array of artifacts",
    {
      hashes: z.array(z.string()).describe("Array of artifact hashes"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ hashes, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v8/artifacts`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ hashes }),
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Artifacts information:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Record Cache Usage Events
  server.tool(
    "record_artifact_events",
    "Records artifacts cache usage events",
    {
      events: z.array(z.object({
        sessionId: z.string(),
        source: z.enum(["LOCAL", "REMOTE"]),
        event: z.enum(["HIT", "MISS"]),
        hash: z.string(),
        duration: z.number().optional()
      })).describe("Array of cache usage events"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of"),
      ci: z.string().optional().describe("The CI environment where events occurred"),
      interactive: z.boolean().optional().describe("Whether the client is an interactive shell")
    },
    async ({ events, teamId, slug, ci, interactive }) => {
      const url = new URL(`${BASE_URL}/v8/artifacts/events`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
      };

      if (ci) headers["x-artifact-client-ci"] = ci;
      if (interactive !== undefined) headers["x-artifact-client-interactive"] = interactive ? "1" : "0";

      const response = await fetch(url.toString(), {
        method: "POST",
        headers,
        body: JSON.stringify(events),
      });

      await handleResponse(response);
      return {
        content: [{ type: "text", text: "Cache events recorded successfully" }],
      };
    }
  );

  // Upload Artifact
  server.tool(
    "upload_artifact",
    "Uploads a cache artifact identified by its hash",
    {
      hash: z.string().describe("The artifact hash"),
      content: z.string().describe("Base64 encoded content of the artifact"),
      contentLength: z.number().describe("The artifact size in bytes"),
      duration: z.number().optional().describe("Time taken to generate the artifact in milliseconds"),
      ci: z.string().optional().describe("The CI environment where this artifact was generated"),
      interactive: z.boolean().optional().describe("Whether the client is an interactive shell"),
      tag: z.string().optional().describe("Base64 encoded tag for this artifact"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ hash, content, contentLength, duration, ci, interactive, tag, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v8/artifacts/${hash}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const headers: Record<string, string> = {
        "Content-Type": "application/octet-stream",
        "Content-Length": contentLength.toString(),
        Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
      };

      if (duration) headers["x-artifact-duration"] = duration.toString();
      if (ci) headers["x-artifact-client-ci"] = ci;
      if (interactive !== undefined) headers["x-artifact-client-interactive"] = interactive ? "1" : "0";
      if (tag) headers["x-artifact-tag"] = tag;

      const response = await fetch(url.toString(), {
        method: "PUT",
        headers,
        body: Buffer.from(content, "base64"),
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Artifact uploaded:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );
} 