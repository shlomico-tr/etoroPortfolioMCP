import { z } from "zod";
import { handleResponse } from "../utils/response.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BASE_URL, DEFAULT_ACCESS_TOKEN } from "../config/constants.js";

// Common schemas
const SecretSchema = z.object({
  name: z.string(),
  value: z.string(),
  prefix: z.string().optional()
});

const PeriodSchema = z.object({
  start: z.string(),
  end: z.string()
});

const BillingItemSchema = z.object({
  billingPlanId: z.string(),
  resourceId: z.string(),
  start: z.string(),
  end: z.string(),
  name: z.string(),
  details: z.string().optional(),
  price: z.string(),
  quantity: z.number(),
  units: z.string().optional(),
  total: z.string()
});

const DiscountSchema = z.object({
  billingPlanId: z.string(),
  resourceId: z.string(),
  start: z.string(),
  end: z.string(),
  name: z.string(),
  details: z.string().optional(),
  amount: z.string()
});

const UsageSchema = z.object({
  resourceId: z.string(),
  name: z.string(),
  type: z.enum(["total"]),
  units: z.string(),
  dayValue: z.number(),
  periodValue: z.number(),
  planValue: z.number()
});

const NotificationSchema = z.object({
  level: z.enum(["info", "warning", "error"]),
  title: z.string(),
  message: z.string(),
  href: z.string().optional()
});

const BalanceSchema = z.object({
  resourceId: z.string(),
  credit: z.string(),
  nameLabel: z.string(),
  currencyValueInCents: z.number()
});

export function registerMarketplaceTools(server: McpServer) {
  // Create Event
  server.tool(
    "create_marketplace_event",
    "Create a marketplace event",
    {
      integrationConfigurationId: z.string().describe("Integration configuration ID"),
      event: z.object({
        type: z.enum(["resource.updated", "installation.updated"]),
        billingPlanId: z.string().optional()
      }).describe("Event details")
    },
    async ({ integrationConfigurationId, event }) => {
      const response = await fetch(`${BASE_URL}/v1/installations/${integrationConfigurationId}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ event }),
      });

      await handleResponse(response);
      return {
        content: [{ type: "text", text: "Event created successfully" }],
      };
    }
  );

  // Get Account Information
  server.tool(
    "get_marketplace_account",
    "Get marketplace account information",
    {
      integrationConfigurationId: z.string().describe("Integration configuration ID")
    },
    async ({ integrationConfigurationId }) => {
      const response = await fetch(`${BASE_URL}/v1/installations/${integrationConfigurationId}/account`, {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Account information:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Get Invoice
  server.tool(
    "get_marketplace_invoice",
    "Get marketplace invoice details",
    {
      integrationConfigurationId: z.string().describe("Integration configuration ID"),
      invoiceId: z.string().describe("Invoice ID")
    },
    async ({ integrationConfigurationId, invoiceId }) => {
      const response = await fetch(`${BASE_URL}/v1/installations/${integrationConfigurationId}/billing/invoices/${invoiceId}`, {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Invoice details:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Get Member Information
  server.tool(
    "get_marketplace_member",
    "Get marketplace member information",
    {
      integrationConfigurationId: z.string().describe("Integration configuration ID"),
      memberId: z.string().describe("Member ID")
    },
    async ({ integrationConfigurationId, memberId }) => {
      const response = await fetch(`${BASE_URL}/v1/installations/${integrationConfigurationId}/member/${memberId}`, {
        headers: {
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Member information:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Import Resource
  server.tool(
    "import_marketplace_resource",
    "Import a marketplace resource",
    {
      integrationConfigurationId: z.string().describe("Integration configuration ID"),
      resourceId: z.string().describe("Resource ID"),
      productId: z.string().describe("Product ID"),
      name: z.string().describe("Resource name"),
      status: z.enum(["ready", "pending", "suspended", "resumed", "uninstalled", "error"]).describe("Resource status"),
      metadata: z.record(z.any()).optional().describe("Additional metadata"),
      billingPlan: z.object({
        id: z.string(),
        type: z.enum(["prepayment"]),
        name: z.string(),
        paymentMethodRequired: z.boolean()
      }).optional(),
      notification: NotificationSchema.optional(),
      secrets: z.array(SecretSchema).optional()
    },
    async ({ integrationConfigurationId, resourceId, ...body }) => {
      const response = await fetch(`${BASE_URL}/v1/installations/${integrationConfigurationId}/resources/${resourceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(body),
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Resource imported:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Submit Billing Data
  server.tool(
    "submit_marketplace_billing",
    "Submit marketplace billing data",
    {
      integrationConfigurationId: z.string().describe("Integration configuration ID"),
      timestamp: z.string().describe("Server timestamp"),
      eod: z.string().describe("End of day timestamp"),
      period: PeriodSchema.describe("Billing period"),
      billing: z.array(BillingItemSchema).describe("Billing items"),
      usage: z.array(UsageSchema).describe("Usage data")
    },
    async ({ integrationConfigurationId, ...body }) => {
      const response = await fetch(`${BASE_URL}/v1/installations/${integrationConfigurationId}/billing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(body),
      });

      await handleResponse(response);
      return {
        content: [{ type: "text", text: "Billing data submitted successfully" }],
      };
    }
  );

  // Submit Invoice
  server.tool(
    "submit_marketplace_invoice",
    "Submit a marketplace invoice",
    {
      integrationConfigurationId: z.string().describe("Integration configuration ID"),
      externalId: z.string().optional().describe("External invoice ID"),
      invoiceDate: z.string().describe("Invoice date"),
      memo: z.string().optional().describe("Invoice memo"),
      period: PeriodSchema.describe("Invoice period"),
      items: z.array(BillingItemSchema).describe("Invoice items"),
      discounts: z.array(DiscountSchema).optional().describe("Discount items"),
      test: z.object({
        validate: z.boolean().optional(),
        result: z.enum(["paid"]).optional()
      }).optional()
    },
    async ({ integrationConfigurationId, ...body }) => {
      const response = await fetch(`${BASE_URL}/v1/installations/${integrationConfigurationId}/billing/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(body),
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Invoice submitted:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Update Resource Secrets
  server.tool(
    "update_marketplace_secrets",
    "Update marketplace resource secrets",
    {
      integrationConfigurationId: z.string().describe("Integration configuration ID"),
      resourceId: z.string().describe("Resource ID"),
      secrets: z.array(SecretSchema).describe("Resource secrets")
    },
    async ({ integrationConfigurationId, resourceId, secrets }) => {
      const response = await fetch(`${BASE_URL}/v1/installations/${integrationConfigurationId}/resources/${resourceId}/secrets`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ secrets }),
      });

      await handleResponse(response);
      return {
        content: [{ type: "text", text: "Resource secrets updated successfully" }],
      };
    }
  );

  // SSO Token Exchange
  server.tool(
    "marketplace_sso_token_exchange",
    "Exchange OAuth code for OIDC token",
    {
      code: z.string().describe("OAuth code"),
      clientId: z.string().describe("Client ID"),
      clientSecret: z.string().describe("Client secret"),
      state: z.string().optional().describe("OAuth state"),
      redirectUri: z.string().optional().describe("Redirect URI")
    },
    async (body) => {
      const response = await fetch(`${BASE_URL}/v1/integrations/sso/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(body),
      });

      const data = await handleResponse(response);
      return {
        content: [{ type: "text", text: `Token exchange completed:\n${JSON.stringify(data, null, 2)}` }],
      };
    }
  );

  // Submit Prepayment Balances
  server.tool(
    "submit_marketplace_balance",
    "Submit prepayment balances",
    {
      integrationConfigurationId: z.string().describe("Integration configuration ID"),
      timestamp: z.string().describe("Server timestamp"),
      balances: z.array(BalanceSchema).describe("Balance data")
    },
    async ({ integrationConfigurationId, ...body }) => {
      const response = await fetch(`${BASE_URL}/v1/installations/${integrationConfigurationId}/billing/balance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(body),
      });

      await handleResponse(response);
      return {
        content: [{ type: "text", text: "Balance data submitted successfully" }],
      };
    }
  );

  // Invoice Actions (Refund)
  server.tool(
    "marketplace_invoice_action",
    "Perform invoice actions like refund",
    {
      integrationConfigurationId: z.string().describe("Integration configuration ID"),
      invoiceId: z.string().describe("Invoice ID"),
      action: z.literal("refund").describe("Action type"),
      reason: z.string().describe("Refund reason"),
      total: z.string().regex(/^[0-9]+(\.[0-9]+)?$/).describe("Refund amount")
    },
    async ({ integrationConfigurationId, invoiceId, ...body }) => {
      const response = await fetch(`${BASE_URL}/v1/installations/${integrationConfigurationId}/billing/invoices/${invoiceId}/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEFAULT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(body),
      });

      await handleResponse(response);
      return {
        content: [{ type: "text", text: "Invoice action completed successfully" }],
      };
    }
  );
} 