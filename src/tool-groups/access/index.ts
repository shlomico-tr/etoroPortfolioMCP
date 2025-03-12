import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTeamTools } from "../../components/teams.js";
import { registerUserTools } from "../../components/users.js";
import { registerAuthTools } from "../../components/auth.js";
import { registerAccessGroupTools } from "../../components/accessgroups.js";
import { registerSecurityTools } from "../../components/security.js";

export async function register(server: McpServer): Promise<string[]> {
  registerTeamTools(server);
  registerUserTools(server);
  registerAuthTools(server);
  registerAccessGroupTools(server);
  registerSecurityTools(server);

  return [
    // Access Groups
    "create_access_group_project",
    "create_access_group",
    "delete_access_group_project",
    "delete_access_group",
    "list_access_groups",
    "list_access_group_members",
    "list_access_group_projects",
    "get_access_group",
    "get_access_group_project",
    "update_access_group",
    "update_access_group_project",
    "mcp_access_group",
    
    // Authentication & Authorization
    "create_auth_token",
    "delete_auth_token",
    "get_auth_token",
    "list_auth_tokens",
    "sso_token_exchange",
    "mcp_auth",
    
    // User Management
    "delete_user",
    "get_user",
    "list_user_events",
    "mcp_user",
    
    // Team Management
    "create_team",
    "delete_team",
    "get_team",
    "list_teams",
    "list_team_members",
    "invite_team_member",
    "remove_team_member",
    "update_team_member",
    "update_team",
    "mcp_team",
    
    // Firewall & Security
    "create_firewall_bypass",
    "delete_firewall_bypass",
    "get_firewall_bypass",
    "get_attack_status",
    "update_attack_mode",
    "get_firewall_config",
    "update_firewall_config",
    "put_firewall_config",
    "mcp_security"
  ];
} 