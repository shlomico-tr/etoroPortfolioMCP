import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDomainTools } from "../../components/domains.js";
import { registerDnsTools } from "../../components/dns.js";
import { registerCertTools } from "../../components/certs.js";
import { registerAliasTools } from "../../components/aliases.js";

export async function register(server: McpServer): Promise<string[]> {
  registerDomainTools(server);
  registerDnsTools(server);
  registerCertTools(server);
  registerAliasTools(server);

  return [
    // Domain Operations
    "add_domain",
    "remove_domain",
    "get_domain",
    "list_domains",
    "mcp_domains",
    
    // Domain Registry
    "domain_check",
    "domain_price",
    "domain_config",
    "domain_registry",
    "domain_get",
    "domain_list",
    "domain_buy",
    "domain_register",
    "domain_remove",
    "domain_update",
    "mcp_registry",
    
    // DNS Management
    "create_dns_record",
    "delete_dns_record",
    "list_dns_records",
    "update_dns_record",
    "mcp_dns",
    
    // Certificates (SSL/TLS)
    "get_cert",
    "issue_cert",
    "remove_cert",
    "upload_cert",
    "mcp_certificate",
    
    // Aliases
    "assign_alias",
    "delete_alias",
    "get_alias",
    "list_aliases",
    "list_deployment_aliases",
    "mcp_alias"
  ];
} 