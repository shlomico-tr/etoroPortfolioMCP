import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { handleResponse } from "../utils/response.js";
import { BASE_URL as DEFAULT_BASE_URL, DEFAULT_ACCESS_TOKEN } from "../config/constants.js";

// Common parameter schemas
const teamParams = {
  teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
  slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
};

export function registerProjectTools(server: McpServer) {
  // List all projects
  server.tool(
    "list_projects",
    "List all projects from Vercel. Commands: 'list projects', 'show projects', 'get projects', 'list all projects', 'show all projects', 'get all projects', 'list vercel projects', 'show my projects', 'list my projects', 'get my projects', 'retrieve projects', 'fetch projects', 'display projects', 'view projects'",
    {
      ...teamParams
    },
    async ({ teamId, slug }) => {
      try {
        const url = new URL(`${DEFAULT_BASE_URL}/v10/projects`);
        if (teamId) url.searchParams.append("teamId", teamId);
        if (slug) url.searchParams.append("slug", slug);

        const response = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}` },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.projects) {
          console.error('Unexpected response format:', data);
          throw new Error('Invalid response format from Vercel API');
        }

        const simplifiedProjects = data.projects.map((project: any) => ({
          id: project.id,
          name: project.name,
          framework: project.framework || 'unknown',
          latestDeployment: project.latestDeployments?.[0]?.url || 'none'
        }));

        return {
          content: [
            { 
              type: "text", 
              text: `Found ${simplifiedProjects.length} projects:\n${JSON.stringify(simplifiedProjects, null, 2)}` 
            },
          ],
        };
      } catch (error: any) {
        console.error('Error in list_projects:', error);
        return {
          content: [
            { 
              type: "text", 
              text: `Error listing projects: ${error.message}` 
            },
          ],
        };
      }
    }
  );

  // Create a new project
  server.tool(
    "create_project",
    "Create a new project with the provided configuration",
    {
      name: z.string().max(100).regex(/^(?!.*---)[a-z0-9-_.]+$/).describe("The desired name for the project"),
      framework: z.enum(["blitzjs", "nextjs", "gatsby", "remix"]).nullable().optional().describe("The framework being used for this project"),
      buildCommand: z.string().max(256).nullable().optional().describe("The build command for this project"),
      devCommand: z.string().max(256).nullable().optional().describe("The dev command for this project"),
      installCommand: z.string().max(256).nullable().optional().describe("The install command for this project"),
      outputDirectory: z.string().max(256).nullable().optional().describe("The output directory of the project"),
      publicSource: z.boolean().nullable().optional().describe("Whether source code and logs should be public"),
      rootDirectory: z.string().max(256).nullable().optional().describe("The directory or relative path to the source code"),
      serverlessFunctionRegion: z.string().max(4).nullable().optional().describe("The region to deploy Serverless Functions"),
      gitRepository: z.object({
        type: z.enum(["github", "gitlab", "bitbucket"]),
        repo: z.string(),
      }).optional().describe("The Git Repository to connect"),
      environmentVariables: z.array(z.object({
        key: z.string(),
        value: z.string(),
        target: z.array(z.string()).optional(),
        type: z.enum(["system", "secret", "encrypted", "plain"]).optional(),
        gitBranch: z.string().optional(),
      })).optional().describe("Collection of ENV Variables"),
      serverlessFunctionZeroConfigFailover: z.boolean().optional().describe("Enable Zero Config Failover"),
      enableAffectedProjectsDeployments: z.boolean().optional().describe("Skip deployments when no changes to root directory"),
      ...teamParams
    },
    async ({ name, framework, buildCommand, devCommand, installCommand, outputDirectory, publicSource, rootDirectory, 
            serverlessFunctionRegion, gitRepository, environmentVariables, serverlessFunctionZeroConfigFailover, enableAffectedProjectsDeployments, teamId, slug }) => {
      const url = new URL(`${DEFAULT_BASE_URL}/v10/projects`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const payload: any = {
        name,
        ...(framework && { framework }),
        ...(buildCommand !== undefined && { buildCommand }),
        ...(devCommand !== undefined && { devCommand }),
        ...(installCommand !== undefined && { installCommand }),
        ...(outputDirectory !== undefined && { outputDirectory }),
        ...(publicSource !== undefined && { publicSource }),
        ...(rootDirectory !== undefined && { rootDirectory }),
        ...(serverlessFunctionRegion !== undefined && { serverlessFunctionRegion }),
        ...(gitRepository && { gitRepository }),
        ...(environmentVariables && { environmentVariables }),
        ...(serverlessFunctionZeroConfigFailover !== undefined && { serverlessFunctionZeroConfigFailover }),
        ...(enableAffectedProjectsDeployments !== undefined && { enableAffectedProjectsDeployments }),
      };

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Project created:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // Delete a project
  server.tool(
    "delete_project",
    "Delete a specific project",
    {
      idOrName: z.string().describe("The unique project identifier or project name"),
      ...teamParams
    },
    async ({ idOrName, teamId, slug }) => {
      const url = new URL(`${DEFAULT_BASE_URL}/v9/projects/${idOrName}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      if (response.status === 204) {
        return {
          content: [
            { type: "text", text: `Project ${idOrName} was successfully deleted` },
          ],
        };
      }

      const errorData = await response.text();
      throw new Error(`Failed to delete project: ${response.status} - ${errorData}`);
    }
  );

  // Get project domain
  server.tool(
    "get_project_domain",
    "Get project domain by project id/name and domain name",
    {
      idOrName: z.string().describe("The unique project identifier or project name"),
      domain: z.string().describe("The project domain name"),
      ...teamParams
    },
    async ({ idOrName, domain, teamId, slug }) => {
      const url = new URL(`${DEFAULT_BASE_URL}/v9/projects/${idOrName}/domains/${domain}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Domain information:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // Update a project
  server.tool(
    "update_project",
    "Update an existing project",
    {
      idOrName: z.string().describe("The unique project identifier or project name"),
      name: z.string().max(100).regex(/^(?!.*---)[a-z0-9-_.]+$/).optional().describe("The desired name for the project"),
      framework: z.enum(["blitzjs", "nextjs", "gatsby", "remix"]).nullable().optional().describe("The framework being used for this project"),
      buildCommand: z.string().max(256).nullable().optional().describe("The build command for this project"),
      devCommand: z.string().max(256).nullable().optional().describe("The dev command for this project"),
      installCommand: z.string().max(256).nullable().optional().describe("The install command for this project"),
      outputDirectory: z.string().max(256).nullable().optional().describe("The output directory of the project"),
      rootDirectory: z.string().max(256).nullable().optional().describe("The directory or relative path to the source code"),
      nodeVersion: z.enum(["22.x", "20.x", "18.x", "16.x", "14.x", "12.x", "10.x"]).optional().describe("Node.js version"),
      serverlessFunctionRegion: z.string().max(4).nullable().optional().describe("The region to deploy Serverless Functions"),
      publicSource: z.boolean().nullable().optional().describe("Whether source code and logs should be public"),
      serverlessFunctionZeroConfigFailover: z.boolean().optional().describe("Enable Zero Config Failover"),
      enableAffectedProjectsDeployments: z.boolean().optional().describe("Skip deployments when no changes to root directory"),
      autoExposeSystemEnvs: z.boolean().optional().describe("Auto expose system environment variables"),
      autoAssignCustomDomains: z.boolean().optional().describe("Auto assign custom domains"),
      customerSupportCodeVisibility: z.boolean().optional().describe("Allow customer support to see git source"),
      directoryListing: z.boolean().optional().describe("Enable directory listing"),
      gitForkProtection: z.boolean().optional().describe("Require authorization for Git fork PRs"),
      gitLFS: z.boolean().optional().describe("Enable Git LFS"),
      previewDeploymentsDisabled: z.boolean().nullable().optional().describe("Disable preview deployments"),
      sourceFilesOutsideRootDirectory: z.boolean().optional().describe("Allow source files outside root directory"),
      enablePreviewFeedback: z.boolean().nullable().optional().describe("Enable preview toolbar"),
      enableProductionFeedback: z.boolean().nullable().optional().describe("Enable production toolbar"),
      skewProtectionBoundaryAt: z.number().min(0).optional().describe("Skew Protection boundary timestamp"),
      skewProtectionMaxAge: z.number().min(0).optional().describe("Skew Protection max age in seconds"),
      oidcTokenConfig: z.object({
        enabled: z.boolean(),
        issuerMode: z.enum(["global"])
      }).optional().describe("OpenID Connect token configuration"),
      passwordProtection: z.object({
        deploymentType: z.enum(["all"]),
        password: z.string().nullable()
      }).nullable().optional().describe("Password protection settings"),
      ssoProtection: z.object({
        deploymentType: z.enum(["preview"])
      }).nullable().optional().describe("SSO protection settings"),
      trustedIps: z.object({
        deploymentType: z.enum(["all"]),
        addresses: z.array(z.object({
          value: z.string(),
          note: z.string()
        })),
        protectionMode: z.enum(["exclusive"])
      }).nullable().optional().describe("Trusted IPs configuration"),
      optionsAllowlist: z.object({
        paths: z.array(z.object({
          value: z.string()
        }))
      }).nullable().optional().describe("Options allowlist configuration"),
      ...teamParams
    },
    async ({ idOrName, name, framework, buildCommand, devCommand, installCommand, outputDirectory, rootDirectory, nodeVersion, 
            serverlessFunctionRegion, publicSource, serverlessFunctionZeroConfigFailover, enableAffectedProjectsDeployments, autoExposeSystemEnvs, 
            autoAssignCustomDomains, customerSupportCodeVisibility, directoryListing, gitForkProtection, gitLFS, previewDeploymentsDisabled, 
            sourceFilesOutsideRootDirectory, enablePreviewFeedback, enableProductionFeedback, skewProtectionBoundaryAt, skewProtectionMaxAge, 
            oidcTokenConfig, passwordProtection, ssoProtection, trustedIps, optionsAllowlist, slug }) => {
      const url = new URL(`${DEFAULT_BASE_URL}/v9/projects/${idOrName}`);
      if (slug) url.searchParams.append("slug", slug);

      const payload: any = {
        name,
        ...(framework && { framework }),
        ...(buildCommand !== undefined && { buildCommand }),
        ...(devCommand !== undefined && { devCommand }),
        ...(installCommand !== undefined && { installCommand }),
        ...(outputDirectory !== undefined && { outputDirectory }),
        ...(rootDirectory !== undefined && { rootDirectory }),
        ...(nodeVersion && { nodeVersion }),
        ...(serverlessFunctionRegion !== undefined && { serverlessFunctionRegion }),
        ...(publicSource !== undefined && { publicSource }),
        ...(serverlessFunctionZeroConfigFailover !== undefined && { serverlessFunctionZeroConfigFailover }),
        ...(enableAffectedProjectsDeployments !== undefined && { enableAffectedProjectsDeployments }),
        ...(autoExposeSystemEnvs !== undefined && { autoExposeSystemEnvs }),
        ...(autoAssignCustomDomains !== undefined && { autoAssignCustomDomains }),
        ...(customerSupportCodeVisibility !== undefined && { customerSupportCodeVisibility }),
        ...(directoryListing !== undefined && { directoryListing }),
        ...(gitForkProtection !== undefined && { gitForkProtection }),
        ...(gitLFS !== undefined && { gitLFS }),
        ...(previewDeploymentsDisabled !== undefined && { previewDeploymentsDisabled }),
        ...(sourceFilesOutsideRootDirectory !== undefined && { sourceFilesOutsideRootDirectory }),
        ...(enablePreviewFeedback !== undefined && { enablePreviewFeedback }),
        ...(enableProductionFeedback !== undefined && { enableProductionFeedback }),
        ...(skewProtectionBoundaryAt !== undefined && { skewProtectionBoundaryAt }),
        ...(skewProtectionMaxAge !== undefined && { skewProtectionMaxAge }),
        ...(oidcTokenConfig && { oidcTokenConfig }),
        ...(passwordProtection && { passwordProtection }),
        ...(ssoProtection && { ssoProtection }),
        ...(trustedIps && { trustedIps }),
        ...(optionsAllowlist && { optionsAllowlist }),
      };

      const response = await fetch(url.toString(), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Project updated:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // List deployments for a project
  server.tool(
    "list_deployments",
    "List deployments for a project",
    {
      projectId: z.string().optional().describe("Filter deployments from the given project ID"),
      app: z.string().optional().describe("Name of the deployment"),
      limit: z.number().optional().describe("Maximum number of deployments to list"),
      since: z.number().optional().describe("Get deployments created after this timestamp"),
      until: z.number().optional().describe("Get deployments created before this timestamp"),
      state: z.string().optional().describe("Filter by deployment state (BUILDING, ERROR, INITIALIZING, QUEUED, READY, CANCELED)"),
      target: z.string().optional().describe("Filter deployments based on environment"),
      users: z.string().optional().describe("Filter deployments by user IDs (comma-separated)"),
      rollbackCandidate: z.boolean().optional().describe("Filter deployments based on rollback candidacy"),
      ...teamParams
    },
    async ({ projectId, app, limit, since, until, state, target, users, rollbackCandidate, slug }) => {
      const url = new URL(`${DEFAULT_BASE_URL}/v6/deployments`);
      const queryParams = new URLSearchParams();
      
      if (projectId) queryParams.append("projectId", projectId);
      if (app) queryParams.append("app", app);
      if (limit) queryParams.append("limit", limit.toString());
      if (since) queryParams.append("since", since.toString());
      if (until) queryParams.append("until", until.toString());
      if (state) queryParams.append("state", state);
      if (target) queryParams.append("target", target);
      if (users) queryParams.append("users", users);
      if (rollbackCandidate !== undefined) queryParams.append("rollbackCandidate", rollbackCandidate.toString());
      if (slug) queryParams.append("slug", slug);

      const response = await fetch(`${url.toString()}?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}` },
      });
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Deployments:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // Add Domain (POST /v10/projects/{idOrName}/domains)
  server.tool(
    "add_domain",
    "Add a domain to a project",
    {
      idOrName: z.string().describe("Project ID or name"),
      domain: z.string().describe("Domain name to add"),
      ...teamParams
    },
    async ({ idOrName, domain, teamId, slug }) => {
      const url = new URL(`${DEFAULT_BASE_URL}/v10/projects/${idOrName}/domains`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ name: domain }),
      });
      
      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Domain added:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Remove Domain (DELETE /v9/projects/{idOrName}/domains/{domain})
  server.tool(
    "remove_domain",
    "Remove a domain from a project",
    {
      idOrName: z.string().describe("Project ID or name"),
      domain: z.string().describe("Domain name to remove"),
      ...teamParams
    },
    async ({ idOrName, domain, teamId, slug }) => {
      const url = new URL(`${DEFAULT_BASE_URL}/v9/projects/${idOrName}/domains/${domain}`);
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
        content: [{ type: "text", text: `Domain removed:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Get Domain (GET /v9/projects/{idOrName}/domains/{domain})
  server.tool(
    "get_domain",
    "Get domain information",
    {
      idOrName: z.string().describe("Project ID or name"),
      domain: z.string().describe("Domain name"),
      ...teamParams
    },
    async ({ idOrName, domain, teamId, slug }) => {
      const url = new URL(`${DEFAULT_BASE_URL}/v9/projects/${idOrName}/domains/${domain}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });
      
      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Domain information:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // List Domains (GET /v9/projects/{idOrName}/domains)
  server.tool(
    "list_domains",
    "List all domains for a project",
    {
      idOrName: z.string().describe("Project ID or name"),
      ...teamParams
    },
    async ({ idOrName, teamId, slug }) => {
      const url = new URL(`${DEFAULT_BASE_URL}/v9/projects/${idOrName}/domains`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });
      
      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Project domains:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Add Environment Variable (POST /v10/projects/{idOrName}/env)
  server.tool(
    "add_env",
    "Add environment variables to a project",
    {
      idOrName: z.string().describe("Project ID or name"),
      env: z.array(z.object({
        key: z.string(),
        value: z.string(),
        type: z.string().optional(),
        target: z.array(z.string()).optional()
      })).describe("Environment variables to add"),
      ...teamParams
    },
    async ({ idOrName, env, teamId, slug }) => {
      const url = new URL(`${DEFAULT_BASE_URL}/v10/projects/${idOrName}/env`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ env }),
      });
      
      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Environment variables added:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Update Environment Variable (PATCH /v9/projects/{idOrName}/env/{id})
  server.tool(
    "update_env",
    "Update an environment variable",
    {
      idOrName: z.string().describe("Project ID or name"),
      envId: z.string().describe("Environment variable ID"),
      value: z.string().describe("New value"),
      type: z.string().optional().describe("Environment type"),
      target: z.array(z.string()).optional().describe("Deployment targets"),
      ...teamParams
    },
    async ({ idOrName, envId, value, type, target, teamId, slug }) => {
      const url = new URL(`${DEFAULT_BASE_URL}/v9/projects/${idOrName}/env/${envId}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ value, type, target }),
      });
      
      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Environment variable updated:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Delete Environment Variable (DELETE /v9/projects/{idOrName}/env/{id})
  server.tool(
    "delete_env",
    "Delete an environment variable",
    {
      idOrName: z.string().describe("Project ID or name"),
      envId: z.string().describe("Environment variable ID"),
      ...teamParams
    },
    async ({ idOrName, envId, teamId, slug }) => {
      const url = new URL(`${DEFAULT_BASE_URL}/v9/projects/${idOrName}/env/${envId}`);
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
        content: [{ type: "text", text: `Environment variable deleted:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Get Environment Variable (GET /v1/projects/{idOrName}/env/{id})
  server.tool(
    "get_env",
    "Get an environment variable",
    {
      idOrName: z.string().describe("Project ID or name"),
      envId: z.string().describe("Environment variable ID"),
      ...teamParams
    },
    async ({ idOrName, envId, teamId, slug }) => {
      const url = new URL(`${DEFAULT_BASE_URL}/v1/projects/${idOrName}/env/${envId}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });
      
      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Environment variable details:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // List Environment Variables (GET /v9/projects/{idOrName}/env)
  server.tool(
    "list_env",
    "List all environment variables",
    {
      idOrName: z.string().describe("Project ID or name"),
      ...teamParams
    },
    async ({ idOrName, teamId, slug }) => {
      const url = new URL(`${DEFAULT_BASE_URL}/v9/projects/${idOrName}/env`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });
      
      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Environment variables:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Promote Deployment (POST /v10/projects/{projectId}/promote/{deploymentId})
  server.tool(
    "promote_deployment",
    "Promote a deployment",
    {
      projectId: z.string().describe("Project ID"),
      deploymentId: z.string().describe("Deployment ID to promote"),
      ...teamParams
    },
    async ({ projectId, deploymentId, teamId, slug }) => {
      const url = new URL(`${DEFAULT_BASE_URL}/v10/projects/${projectId}/promote/${deploymentId}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });
      
      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Deployment promoted:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Get Promotion Aliases (GET /v1/projects/{projectId}/promote/aliases)
  server.tool(
    "get_promotion_aliases",
    "Get promotion aliases",
    {
      projectId: z.string().describe("Project ID"),
      ...teamParams
    },
    async ({ projectId, teamId, slug }) => {
      const url = new URL(`${DEFAULT_BASE_URL}/v1/projects/${projectId}/promote/aliases`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });
      
      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Promotion aliases:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Pause Project (POST /v1/projects/{projectId}/pause)
  server.tool(
    "pause_project",
    "Pause a project",
    {
      projectId: z.string().describe("Project ID"),
      ...teamParams
    },
    async ({ projectId, teamId, slug }) => {
      const url = new URL(`${DEFAULT_BASE_URL}/v1/projects/${projectId}/pause`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });
      
      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Project paused:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Transfer Project Request (POST /projects/{idOrName}/transfer-request)
  server.tool(
    "request_project_transfer",
    "Request project transfer",
    {
      idOrName: z.string().describe("Project ID or name"),
      teamId: z.string().describe("Team ID to transfer to"),
    },
    async ({ idOrName, teamId }) => {
      const response = await fetch(`${DEFAULT_BASE_URL}/projects/${idOrName}/transfer-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ teamId }),
      });
      
      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Transfer requested:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Accept Project Transfer (PUT /projects/transfer-request/{code})
  server.tool(
    "accept_project_transfer",
    "Accept project transfer request",
    {
      code: z.string().describe("Transfer request code"),
    },
    async ({ code }) => {
      const response = await fetch(`${DEFAULT_BASE_URL}/projects/transfer-request/${code}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });
      
      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Transfer accepted:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );
} 