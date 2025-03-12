import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerIntegrationTools } from "../../components/integrations.js";
import { registerMarketplaceTools } from "../../components/marketplace.js";
import { registerArtifactTools } from "../../components/artifacts.js";

export async function register(server: McpServer): Promise<string[]> {
  registerIntegrationTools(server);
  registerMarketplaceTools(server);
  registerArtifactTools(server);

  return [
    // Integrations
    "int_delete",
    "int_list",
    "int_gitns",
    "int_searchRepo",
    "int_get",
    "int_updateAction",
    "mcp_integration",
    
    // Marketplace
    "create_marketplace_event",
    "get_marketplace_account",
    "get_marketplace_invoice",
    "get_marketplace_member",
    "import_marketplace_resource",
    "submit_marketplace_billing",
    "submit_marketplace_invoice",
    "update_marketplace_secrets",
    "marketplace_sso_token_exchange",
    "submit_marketplace_balance",
    "marketplace_invoice_action",
    "mcp_marketplace",
    
    // Artifacts (Build Outputs, Caching, Binaries)
    "check_artifact",
    "download_artifact",
    "get_artifact_status",
    "query_artifacts",
    "record_artifact_events",
    "upload_artifact",
    "mcp_artifact"
  ];
} 