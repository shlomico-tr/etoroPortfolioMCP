import { z } from "zod";
import { handleResponse } from "../utils/response.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BASE_URL, DEFAULT_ACCESS_TOKEN } from "../config/constants.js";

export function registerDeploymentTools(server: McpServer) {
  // Create new deployment
  server.tool(
    "create_deployment",
    "Create a new deployment with all required data",
    {
      name: z.string().describe("Project name used in the deployment URL"),
      project: z.string().optional().describe("Target project identifier (overrides name)"),
      files: z.array(z.object({
        data: z.string(),
        encoding: z.string().optional(),
        file: z.string()
      })).optional().describe("Files to be deployed"),
      gitMetadata: z.object({
        remoteUrl: z.string().optional(),
        commitAuthorName: z.string().optional(),
        commitMessage: z.string().optional(),
        commitRef: z.string().optional(),
        commitSha: z.string().optional(),
        dirty: z.boolean().optional()
      }).optional().describe("Git metadata for the deployment"),
      gitSource: z.object({
        type: z.string(),
        repoId: z.union([z.string(), z.number()]),
        ref: z.string().optional(),
        sha: z.string().optional()
      }).optional().describe("Git repository source"),
      target: z.string().optional().describe("Deployment target (production, preview, staging)"),
      deploymentId: z.string().optional().describe("Existing deployment ID to redeploy"),
      meta: z.record(z.any()).optional().describe("Deployment metadata"),
      projectSettings: z.object({
        buildCommand: z.string().nullable().optional(),
        devCommand: z.string().nullable().optional(),
        framework: z.string().nullable().optional(),
        installCommand: z.string().nullable().optional(),
        nodeVersion: z.string().optional(),
        outputDirectory: z.string().nullable().optional(),
        rootDirectory: z.string().nullable().optional(),
        serverlessFunctionRegion: z.string().nullable().optional(),
        skipGitConnectDuringLink: z.boolean().optional(),
        sourceFilesOutsideRootDirectory: z.boolean().optional()
      }).optional().describe("Project settings for the deployment"),
      forceNew: z.boolean().optional().describe("Force new deployment even if similar exists"),
      skipAutoDetectionConfirmation: z.boolean().optional().describe("Skip framework detection confirmation"),
      customEnvironmentSlugOrId: z.string().optional().describe("Custom environment to deploy to"),
      monorepoManager: z.string().nullable().optional().describe("Monorepo manager being used"),
      withLatestCommit: z.boolean().optional().describe("Force latest commit when redeploying"),
      teamId: z.string().optional().describe("Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("Team slug to perform the request on behalf of")
    },
    async ({ name, project, files, gitMetadata, gitSource, target, deploymentId, meta, projectSettings,
            forceNew, skipAutoDetectionConfirmation, customEnvironmentSlugOrId, monorepoManager,
            withLatestCommit, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v13/deployments`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);
      if (forceNew) url.searchParams.append("forceNew", "1");
      if (skipAutoDetectionConfirmation) url.searchParams.append("skipAutoDetectionConfirmation", "1");

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          name,
          project,
          files,
          gitMetadata,
          gitSource,
          target,
          deploymentId,
          meta,
          projectSettings,
          customEnvironmentSlugOrId,
          monorepoManager,
          withLatestCommit
        }),
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Deployment created:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Cancel deployment
  server.tool(
    "cancel_deployment",
    "Cancel a deployment which is currently building",
    {
      id: z.string().describe("The unique identifier of the deployment"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ id, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v12/deployments/${id}/cancel`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Deployment canceled:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Get deployment by ID or URL
  server.tool(
    "get_deployment",
    "Get deployment by ID or URL",
    {
      idOrUrl: z.string().describe("The unique identifier or hostname of the deployment"),
      withGitRepoInfo: z.string().optional().describe("Whether to add gitRepo information"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ idOrUrl, withGitRepoInfo, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v13/deployments/${idOrUrl}`);
      if (withGitRepoInfo) url.searchParams.append("withGitRepoInfo", withGitRepoInfo);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Deployment details:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Delete deployment
  server.tool(
    "delete_deployment",
    "Delete a deployment by ID or URL",
    {
      id: z.string().describe("The unique identifier of the deployment"),
      url: z.string().optional().describe("A Deployment or Alias URL (overrides ID if provided)"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ id, url, teamId, slug }) => {
      const baseUrl = new URL(`${BASE_URL}/v13/deployments/${id}`);
      if (url) baseUrl.searchParams.append("url", url);
      if (teamId) baseUrl.searchParams.append("teamId", teamId);
      if (slug) baseUrl.searchParams.append("slug", slug);

      const response = await fetch(baseUrl.toString(), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Deployment deleted:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Get deployment events
  server.tool(
    "get_deployment_events",
    "Get build logs and events for a deployment",
    {
      idOrUrl: z.string().describe("The unique identifier or hostname of the deployment"),
      direction: z.enum(["forward", "backward"]).optional().describe("Order of the returned events based on timestamp"),
      follow: z.number().optional().describe("Return live events as they happen (1 to enable)"),
      limit: z.number().optional().describe("Maximum number of events to return (-1 for all)"),
      name: z.string().optional().describe("Deployment build ID"),
      since: z.number().optional().describe("Timestamp to start pulling logs from"),
      until: z.number().optional().describe("Timestamp to pull logs until"),
      statusCode: z.string().optional().describe("HTTP status code range to filter events by (e.g. '5xx')"),
      delimiter: z.number().optional().describe("Delimiter option"),
      builds: z.number().optional().describe("Builds option"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ idOrUrl, direction, follow, limit, name, since, until, statusCode, delimiter, builds, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v3/deployments/${idOrUrl}/events`);
      
      // Add all optional query parameters
      if (direction) url.searchParams.append("direction", direction);
      if (follow !== undefined) url.searchParams.append("follow", follow.toString());
      if (limit !== undefined) url.searchParams.append("limit", limit.toString());
      if (name) url.searchParams.append("name", name);
      if (since !== undefined) url.searchParams.append("since", since.toString());
      if (until !== undefined) url.searchParams.append("until", until.toString());
      if (statusCode) url.searchParams.append("statusCode", statusCode);
      if (delimiter !== undefined) url.searchParams.append("delimiter", delimiter.toString());
      if (builds !== undefined) url.searchParams.append("builds", builds.toString());
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Deployment events:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Update deployment integration action
  server.tool(
    "update_deployment_integration",
    "Update deployment integration action status",
    {
      deploymentId: z.string().describe("The deployment ID"),
      integrationConfigurationId: z.string().describe("The integration configuration ID"),
      resourceId: z.string().describe("The resource ID"),
      action: z.string().describe("The action to update"),
      status: z.enum(["running", "succeeded", "failed"]).describe("The status of the action"),
      statusText: z.string().optional().describe("Additional status text"),
      outcomes: z.array(z.object({
        kind: z.string(),
        secrets: z.array(z.object({
          name: z.string(),
          value: z.string()
        })).optional()
      })).optional().describe("Action outcomes"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ deploymentId, integrationConfigurationId, resourceId, action, status, statusText, outcomes, teamId, slug }) => {
      const url = new URL(
        `${BASE_URL}/v1/deployments/${deploymentId}/integrations/${integrationConfigurationId}/resources/${resourceId}/actions/${action}`
      );
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          status,
          statusText,
          outcomes
        }),
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Integration action updated:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // List deployment files
  server.tool(
    "list_deployment_files",
    "Get file structure of a deployment's source code",
    {
      id: z.string().describe("The unique deployment identifier"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ id, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v6/deployments/${id}/files`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Deployment files:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Upload deployment files
  server.tool(
    "upload_deployment_files",
    "Upload files required for deployment",
    {
      content: z.string().describe("The file content to upload"),
      size: z.number().describe("The file size in bytes"),
      digest: z.string().max(40).describe("The file SHA1 for integrity check"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ content, size, digest, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v2/files`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Length": size.toString(),
          "x-vercel-digest": digest,
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: content,
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `File upload result:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Get deployment file contents
  server.tool(
    "get_deployment_file",
    "Get contents of a specific deployment file",
    {
      id: z.string().describe("The unique deployment identifier"),
      fileId: z.string().describe("The unique file identifier"),
      path: z.string().optional().describe("Path to the file (only for Git deployments)"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ id, fileId, path, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v7/deployments/${id}/files/${fileId}`);
      if (path) url.searchParams.append("path", path);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `File contents:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // List deployments
  server.tool(
    "list_deployment",
    "List deployments under the authenticated user or team",
    {
      app: z.string().optional().describe("Name of the deployment"),
      from: z.number().optional().describe("Get deployments created after this timestamp (deprecated)"),
      limit: z.number().optional().describe("Maximum number of deployments to list"),
      projectId: z.string().optional().describe("Filter deployments from the given ID or name"),
      target: z.string().optional().describe("Filter deployments based on the environment"),
      to: z.number().optional().describe("Get deployments created before this timestamp (deprecated)"),
      users: z.string().optional().describe("Filter deployments based on users who created them"),
      since: z.number().optional().describe("Get deployments created after this timestamp"),
      until: z.number().optional().describe("Get deployments created before this timestamp"),
      state: z.string().optional().describe("Filter by state (BUILDING, ERROR, INITIALIZING, QUEUED, READY, CANCELED)"),
      rollbackCandidate: z.boolean().optional().describe("Filter deployments based on rollback candidacy"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ app, from, limit, projectId, target, to, users, since, until, state, rollbackCandidate, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v6/deployments`);
      
      // Add all optional query parameters
      if (app) url.searchParams.append("app", app);
      if (from !== undefined) url.searchParams.append("from", from.toString());
      if (limit !== undefined) url.searchParams.append("limit", limit.toString());
      if (projectId) url.searchParams.append("projectId", projectId);
      if (target) url.searchParams.append("target", target);
      if (to !== undefined) url.searchParams.append("to", to.toString());
      if (users) url.searchParams.append("users", users);
      if (since !== undefined) url.searchParams.append("since", since.toString());
      if (until !== undefined) url.searchParams.append("until", until.toString());
      if (state) url.searchParams.append("state", state);
      if (rollbackCandidate !== undefined) url.searchParams.append("rollbackCandidate", rollbackCandidate.toString());
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Deployments list:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );
}