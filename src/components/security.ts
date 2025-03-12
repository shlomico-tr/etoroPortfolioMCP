import { z } from "zod";
import { handleResponse } from "../utils/response.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BASE_URL, DEFAULT_ACCESS_TOKEN } from "../config/constants.js";

// Common parameter schemas
const teamParams = {
  teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
  slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
};

export function registerSecurityTools(server: McpServer) {
  // Create System Bypass Rule
  server.tool(
    "create_firewall_bypass",
    "Create new system bypass rules",
    {
      projectId: z.string().describe("Project ID"),
      ...teamParams,
      domain: z.string().max(2544).regex(/([a-z]+[a-z.]+)$/).optional().describe("Domain"),
      projectScope: z.boolean().optional().describe("If the specified bypass will apply to all domains for a project"),
      sourceIp: z.string().optional().describe("Source IP"),
      allSources: z.boolean().optional().describe("All sources"),
      ttl: z.number().optional().describe("Time to live in milliseconds"),
      note: z.string().max(500).optional().describe("Note")
    },
    async ({ projectId, teamId, slug, ...bypassData }) => {
      const url = new URL(`${BASE_URL}/v1/security/firewall/bypass`);
      url.searchParams.append("projectId", projectId);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(bypassData),
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Bypass rule created:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // Delete System Bypass Rule
  server.tool(
    "delete_firewall_bypass",
    "Remove system bypass rules",
    {
      projectId: z.string().describe("Project ID"),
      ...teamParams,
      domain: z.string().max(2544).regex(/([a-z]+[a-z.]+)$/).optional().describe("Domain"),
      projectScope: z.boolean().optional().describe("Project scope"),
      sourceIp: z.string().optional().describe("Source IP"),
      allSources: z.boolean().optional().describe("All sources"),
      note: z.string().max(500).optional().describe("Note")
    },
    async ({ projectId, teamId, slug, ...bypassData }) => {
      const url = new URL(`${BASE_URL}/v1/security/firewall/bypass`);
      url.searchParams.append("projectId", projectId);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(bypassData),
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Bypass rule deleted:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // Get System Bypass Rules
  server.tool(
    "get_firewall_bypass",
    "Retrieve the system bypass rules",
    {
      projectId: z.string().describe("Project ID"),
      limit: z.number().max(128).optional().describe("Maximum number of rules to return"),
      sourceIp: z.string().max(49).optional().describe("Filter by source IP"),
      domain: z.string().max(2544).regex(/([a-z]+[a-z.]+)$/).optional().describe("Filter by domain"),
      projectScope: z.boolean().optional().describe("Filter by project scoped rules"),
      offset: z.string().max(2560).optional().describe("Used for pagination"),
      ...teamParams
    },
    async ({ projectId, teamId, slug, ...queryParams }) => {
      const url = new URL(`${BASE_URL}/v1/security/firewall/bypass`);
      url.searchParams.append("projectId", projectId);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined) url.searchParams.append(key, value.toString());
      });

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Bypass rules:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // Get Attack Status
  server.tool(
    "get_attack_status",
    "Retrieve active attack data within the last 24h window",
    {
      projectId: z.string().describe("Project ID"),
      ...teamParams
    },
    async ({ projectId, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v1/security/firewall/attack-status`);
      url.searchParams.append("projectId", projectId);
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
          { type: "text", text: `Attack status:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // Update Attack Challenge Mode
  server.tool(
    "update_attack_mode",
    "Update the Attack Challenge mode settings",
    {
      projectId: z.string().describe("Project ID"),
      attackModeEnabled: z.boolean().describe("Enable/disable attack mode"),
      attackModeActiveUntil: z.number().nullable().optional().describe("Timestamp until attack mode is active"),
      ...teamParams
    },
    async ({ projectId, attackModeEnabled, attackModeActiveUntil, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v1/security/attack-mode`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          projectId,
          attackModeEnabled,
          attackModeActiveUntil
        }),
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Attack mode updated:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // Get Firewall Config
  server.tool(
    "get_firewall_config",
    "Retrieve the firewall configuration",
    {
      projectId: z.string().describe("Project ID"),
      configVersion: z.string().optional().describe("Configuration version"),
      ...teamParams
    },
    async ({ projectId, configVersion, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v1/security/firewall/config${configVersion ? `/${configVersion}` : ''}`);
      url.searchParams.append("projectId", projectId);
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
          { type: "text", text: `Firewall configuration:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // Update Firewall Config
  server.tool(
    "update_firewall_config",
    "Update the firewall configuration",
    {
      projectId: z.string().describe("Project ID"),
      ...teamParams,
      action: z.string().describe("Action to perform"),
      id: z.string().nullable().optional().describe("Rule ID"),
      value: z.any().describe("Value for the action")
    },
    async ({ projectId, teamId, slug, ...updateData }) => {
      const url = new URL(`${BASE_URL}/v1/security/firewall/config`);
      url.searchParams.append("projectId", projectId);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(updateData),
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Firewall configuration updated:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );

  // Put Firewall Config
  server.tool(
    "put_firewall_config",
    "Set the complete firewall configuration",
    {
      projectId: z.string().describe("Project ID"),
      ...teamParams,
      firewallEnabled: z.boolean().describe("Enable/disable firewall"),
      managedRules: z.object({
        owasp: z.object({
          active: z.boolean()
        }).optional()
      }).optional().describe("Managed rules configuration"),
      crs: z.object({
        sd: z.object({ active: z.boolean(), action: z.enum(["deny"]) }).optional(),
        ma: z.object({ active: z.boolean(), action: z.enum(["deny"]) }).optional(),
        lfi: z.object({ active: z.boolean(), action: z.enum(["deny"]) }).optional(),
        rfi: z.object({ active: z.boolean(), action: z.enum(["deny"]) }).optional(),
        rce: z.object({ active: z.boolean(), action: z.enum(["deny"]) }).optional(),
        php: z.object({ active: z.boolean(), action: z.enum(["deny"]) }).optional(),
        gen: z.object({ active: z.boolean(), action: z.enum(["deny"]) }).optional(),
        xss: z.object({ active: z.boolean(), action: z.enum(["deny"]) }).optional(),
        sqli: z.object({ active: z.boolean(), action: z.enum(["deny"]) }).optional(),
        sf: z.object({ active: z.boolean(), action: z.enum(["deny"]) }).optional(),
        java: z.object({ active: z.boolean(), action: z.enum(["deny"]) }).optional()
      }).optional().describe("Custom rule set configuration"),
      rules: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        active: z.boolean(),
        conditionGroup: z.array(z.object({
          conditions: z.array(z.object({
            type: z.string(),
            op: z.string(),
            neg: z.boolean(),
            key: z.string(),
            value: z.string()
          }))
        })),
        action: z.object({
          mitigate: z.object({
            action: z.enum(["log", "deny"]),
            rateLimit: z.object({
              algo: z.enum(["fixed_window"]),
              window: z.number(),
              limit: z.number(),
              keys: z.array(z.string()),
              action: z.enum(["log", "deny"])
            }).optional(),
            redirect: z.object({
              location: z.string(),
              permanent: z.boolean()
            }).optional(),
            actionDuration: z.any().nullable(),
            bypassSystem: z.any().nullable()
          })
        })
      })).optional().describe("Custom rules"),
      ips: z.array(z.object({
        id: z.string(),
        hostname: z.string(),
        ip: z.string(),
        notes: z.string(),
        action: z.enum(["deny"])
      })).optional().describe("IP rules")
    },
    async ({ projectId, teamId, slug, ...config }) => {
      const url = new URL(`${BASE_URL}/v1/security/firewall/config`);
      url.searchParams.append("projectId", projectId);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(config),
      });
      
      const data = await handleResponse(response);
      return {
        content: [
          { type: "text", text: `Firewall configuration set:\n${JSON.stringify(data, null, 2)}` },
        ],
      };
    }
  );
} 