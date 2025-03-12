import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerEdgeConfigTools } from "../../components/edge-config.js";
import { registerSecretTools } from "../../components/secrets.js";
import { registerEnvironmentTools } from "../../components/environments.js";
import { registerWebhookTools } from "../../components/webhooks.js";
import { registerLogDrainTools } from "../../components/logDrains.js";
import { registerSpeedInsightsTools } from "../../components/speed-insights.js";

export async function register(server: McpServer): Promise<string[]> {
  registerEdgeConfigTools(server);
  registerSecretTools(server);
  registerEnvironmentTools(server);
  registerWebhookTools(server);
  registerLogDrainTools(server);
  registerSpeedInsightsTools(server);

  return [
    // Edge Configurations
    "create_edge_config",
    "create_edge_config_token",
    "list_edge_configs",
    "get_edge_config",
    "update_edge_config",
    "delete_edge_config",
    "list_edge_config_items",
    "get_edge_config_item",
    "update_edge_config_items",
    "get_edge_config_schema",
    "update_edge_config_schema",
    "delete_edge_config_schema",
    "list_edge_config_tokens",
    "get_edge_config_token",
    "delete_edge_config_tokens",
    "list_edge_config_backups",
    "get_edge_config_backup",
    "mcp_edge_config",
    
    // Secrets Management
    "create_secret",
    "update_secret_name",
    "delete_secret",
    "get_secret",
    "list_secrets",
    "mcp_secret",
    
    // Environment Variables
    "add_env",
    "update_env",
    "delete_env",
    "get_env",
    "list_env",
    "mcp_env",
    
    // Environments (Projects/Deployments)
    "create_environment",
    "delete_environment",
    "get_environment",
    "list_environments",
    "update_environment",
    "mcp_environment",
    
    // Webhooks
    "create_webhook",
    "delete_webhook",
    "list_webhooks",
    "get_webhook",
    "mcp_webhook",
    
    // Logging
    "logdrain_create",
    "logdrain_createIntegration",
    "logdrain_delete",
    "logdrain_deleteIntegration",
    "logdrain_get",
    "logdrain_list",
    "logdrain_listIntegration",
    "mcp_logdrain",
    
    // Performance Monitoring
    "send_web_vitals",
    "mcp_speed_insights"
  ];
} 