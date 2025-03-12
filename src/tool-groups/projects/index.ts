import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerProjectTools } from "../../components/projects.js";
import { registerDeploymentTools } from "../../components/deployments.js";

export async function register(server: McpServer): Promise<string[]> {
  registerProjectTools(server);
  registerDeploymentTools(server);

  return [
    // Project Management
    "list_projects",
    "create_project",
    "delete_project",
    "get_project_domain",
    "update_project",
    "mcp_project",
    
    // Project Members
    "add_project_member",
    "list_project_members",
    "remove_project_member",
    "mcp_project_member",
    
    // Project Transfers
    "request_project_transfer",
    "accept_project_transfer",
    "mcp_project_transfer",
    
    // Deployments
    "list_deployments",
    "promote_deployment",
    "get_promotion_aliases",
    "pause_project",
    "mcp_deployment",
    
    // Deployment Management
    "create_deployment",
    "cancel_deployment",
    "get_deployment",
    "delete_deployment",
    "get_deployment_events",
    "update_deployment_integration",
    "mcp_deployment_management",
    
    // Deployment Files
    "list_deployment_files",
    "upload_deployment_files",
    "get_deployment_file",
    "list_deployment",
    "mcp_deployment_files"
  ];
} 