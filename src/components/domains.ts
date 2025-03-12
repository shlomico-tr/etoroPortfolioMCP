import { z } from "zod";
import { handleResponse } from "../utils/response.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BASE_URL, DEFAULT_ACCESS_TOKEN } from "../config/constants.js";

export function registerDomainTools(server: McpServer) {
  // Check domain availability
  server.tool(
    "domain_check",
    "Check if a domain name is available for purchase",
    {
      name: z.string().describe("The name of the domain to check"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ name, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v4/domains/status`);
      url.searchParams.append("name", name);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}` }
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Domain availability:\n${JSON.stringify(data, null, 2)}` }]
      };
    }
  );

  // Get domain price
  server.tool(
    "domain_price",
    "Check the price to purchase a domain",
    {
      name: z.string().describe("The name of the domain to check price for"),
      type: z.enum(["new", "renewal", "transfer", "redemption"]).optional().describe("Domain status type to check price for"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ name, type, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v4/domains/price`);
      url.searchParams.append("name", name);
      if (type) url.searchParams.append("type", type);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}` }
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Domain price:\n${JSON.stringify(data, null, 2)}` }]
      };
    }
  );

  // Get domain config
  server.tool(
    "domain_config",
    "Get a Domain's configuration",
    {
      domain: z.string().describe("The name of the domain"),
      strict: z.boolean().optional().describe("When true, only include nameservers assigned directly to the domain"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ domain, strict, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v6/domains/${domain}/config`);
      if (strict !== undefined) url.searchParams.append("strict", String(strict));
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}` }
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Domain configuration:\n${JSON.stringify(data, null, 2)}` }]
      };
    }
  );

  // Get domain registry info
  server.tool(
    "domain_registry",
    "Get domain transfer info",
    {
      domain: z.string().describe("The domain name"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ domain, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v1/domains/${domain}/registry`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}` }
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Domain registry info:\n${JSON.stringify(data, null, 2)}` }]
      };
    }
  );

  // Get single domain info
  server.tool(
    "domain_get",
    "Get information for a single domain",
    {
      domain: z.string().describe("The name of the domain"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ domain, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v5/domains/${domain}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}` }
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Domain information:\n${JSON.stringify(data, null, 2)}` }]
      };
    }
  );

  // List domains
  server.tool(
    "domain_list",
    "List all domains",
    {
      limit: z.number().optional().describe("Maximum number of domains to list"),
      since: z.number().optional().describe("Get domains created after this timestamp"),
      until: z.number().optional().describe("Get domains created before this timestamp"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ limit, since, until, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v5/domains`);
      if (limit) url.searchParams.append("limit", String(limit));
      if (since) url.searchParams.append("since", String(since));
      if (until) url.searchParams.append("until", String(until));
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}` }
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Domains list:\n${JSON.stringify(data, null, 2)}` }]
      };
    }
  );

  // Purchase domain
  server.tool(
    "domain_buy",
    "Purchase a domain",
    {
      name: z.string().describe("The domain name to purchase"),
      expectedPrice: z.number().optional().describe("The expected price for the purchase"),
      renew: z.boolean().optional().describe("Whether to auto-renew the domain"),
      country: z.string().describe("The country of the domain registrant"),
      orgName: z.string().optional().describe("The company name of the domain registrant"),
      firstName: z.string().describe("The first name of the domain registrant"),
      lastName: z.string().describe("The last name of the domain registrant"),
      address1: z.string().describe("The street address of the domain registrant"),
      city: z.string().describe("The city of the domain registrant"),
      state: z.string().describe("The state of the domain registrant"),
      postalCode: z.string().describe("The postal code of the domain registrant"),
      phone: z.string().describe("The phone number of the domain registrant"),
      email: z.string().email().describe("The email of the domain registrant"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ name, expectedPrice, renew, country, orgName, firstName, lastName, address1, city, state, postalCode, phone, email, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v5/domains/buy`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          name,
          expectedPrice,
          renew,
          country,
          orgName,
          firstName,
          lastName,
          address1,
          city,
          state,
          postalCode,
          phone,
          email
        })
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Domain purchase result:\n${JSON.stringify(data, null, 2)}` }]
      };
    }
  );

  // Register/transfer domain
  server.tool(
    "domain_register",
    "Register or transfer-in a domain",
    {
      method: z.enum(["add", "transfer-in"]).describe("The domain operation to perform"),
      name: z.string().describe("The domain name"),
      cdnEnabled: z.boolean().optional().describe("Whether to enable CDN"),
      zone: z.boolean().optional().describe("Whether to create a zone"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ method, name, cdnEnabled, zone, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v5/domains`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          method,
          name,
          cdnEnabled,
          zone
        })
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Domain registration result:\n${JSON.stringify(data, null, 2)}` }]
      };
    }
  );

  // Remove domain
  server.tool(
    "domain_remove",
    "Remove a domain",
    {
      domain: z.string().describe("The name of the domain to remove"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ domain, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v6/domains/${domain}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}` }
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Domain removal result:\n${JSON.stringify(data, null, 2)}` }]
      };
    }
  );

  // Update domain
  server.tool(
    "domain_update",
    "Update or move apex domain",
    {
      domain: z.string().describe("The domain name"),
      op: z.enum(["update", "move-out"]).describe("Operation type"),
      renew: z.boolean().optional().describe("Whether to auto-renew"),
      customNameservers: z.array(z.string()).optional().describe("Custom nameservers"),
      zone: z.boolean().optional().describe("Whether to create a zone"),
      teamId: z.string().optional().describe("The Team identifier to perform the request on behalf of"),
      slug: z.string().optional().describe("The Team slug to perform the request on behalf of")
    },
    async ({ domain, op, renew, customNameservers, zone, teamId, slug }) => {
      const url = new URL(`${BASE_URL}/v3/domains/${domain}`);
      if (teamId) url.searchParams.append("teamId", teamId);
      if (slug) url.searchParams.append("slug", slug);

      const response = await fetch(url.toString(), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          op,
          renew,
          customNameservers,
          zone
        })
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Domain update result:\n${JSON.stringify(data, null, 2)}` }]
      };
    }
  );
} 