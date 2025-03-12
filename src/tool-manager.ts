import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

interface GroupUsage {
  lastUsed: number;
  tools: string[];
}

interface ToolGroupMap {
  [key: string]: string;
}

export class ToolManager {
  private server: McpServer;
  private activeGroups: Map<string, GroupUsage> = new Map();
  private readonly MAX_ACTIVE_GROUPS = 2;
  private readonly toolToGroupMap: ToolGroupMap = {
    // Infrastructure tools
    'edge_config': 'infrastructure',
    'secret': 'infrastructure',
    'env': 'infrastructure',
    'webhook': 'infrastructure',
    'logdrain': 'infrastructure',
    'speed_insights': 'infrastructure',
    'firewall': 'infrastructure',
    
    // Access tools
    'user': 'access',
    'team': 'access',
    'auth': 'access',
    'access_group': 'access',
    'security': 'access',
    
    // Project tools
    'project': 'projects',
    'list_projects': 'projects',
    'projects': 'projects',
    'deployment': 'projects',
    'member': 'projects',
    'transfer': 'projects',
    'show_projects': 'projects',
    'get_projects': 'projects',
    'view_projects': 'projects',
    'display_projects': 'projects',
    'fetch_projects': 'projects',
    'retrieve_projects': 'projects',
    
    // Domain tools
    'domain': 'domains',
    'dns': 'domains',
    'cert': 'domains',
    'alias': 'domains',
    
    // Integration tools
    'integration': 'integrations',
    'marketplace': 'integrations',
    'artifact': 'integrations'
  };

  constructor(server: McpServer) {
    this.server = server;
  }

  async loadGroup(groupName: string) {
    if (this.activeGroups.has(groupName)) {
      // Update last used timestamp
      this.activeGroups.get(groupName)!.lastUsed = Date.now();
      return;
    }

    // Always unload the oldest group if we're at max capacity
    if (this.activeGroups.size >= this.MAX_ACTIVE_GROUPS) {
      const oldestGroup = this.getLeastRecentlyUsedGroup();
      await this.unloadGroup(oldestGroup);
    }

    try {
      const group = await import(`./tool-groups/${groupName}/index.js`);
      const tools = await group.register(this.server);
      
      this.activeGroups.set(groupName, {
        lastUsed: Date.now(),
        tools
      });
      
      console.log(`Loaded tool group: ${groupName}`);
    } catch (error) {
      console.error(`Failed to load tool group ${groupName}:`, error);
    }
  }

  async unloadGroup(groupName: string) {
    const group = this.activeGroups.get(groupName);
    if (!group) return;

    try {
      // Simply remove the group from tracking
      // The tools will be overwritten when new groups are loaded
      this.activeGroups.delete(groupName);
      console.log(`Unloaded tool group: ${groupName}`);
    } catch (error) {
      console.error(`Failed to unload tool group ${groupName}:`, error);
    }
  }

  private getLeastRecentlyUsedGroup(): string {
    let oldestTime = Infinity;
    let oldestGroup = '';

    for (const [group, usage] of this.activeGroups.entries()) {
      if (usage.lastUsed < oldestTime) {
        oldestTime = usage.lastUsed;
        oldestGroup = group;
      }
    }

    return oldestGroup;
  }

  getActiveGroups(): string[] {
    return Array.from(this.activeGroups.keys());
  }

  private findGroupForTool(toolName: string): string {
    // First check direct tool name matches
    for (const [tool, group] of Object.entries(this.toolToGroupMap)) {
      if (toolName.includes(tool)) {
        return group;
      }
    }
    return '';
  }

  async suggestAndLoadGroups(query: string) {
    const normalizedQuery = query.toLowerCase();
    let groupToLoad = '';
    
    // First try to find group by exact tool name
    const words = normalizedQuery.split(/[\s_-]+/);
    for (const word of words) {
      groupToLoad = this.findGroupForTool(word);
      if (groupToLoad) break;
    }

    // If no group found by tool name, try keyword matching
    if (!groupToLoad) {
      if (normalizedQuery.includes('edge') || 
          normalizedQuery.includes('secret') || 
          normalizedQuery.includes('env') ||
          normalizedQuery.includes('environment') ||
          normalizedQuery.includes('webhook') ||
          normalizedQuery.includes('log') ||
          normalizedQuery.includes('speed') ||
          normalizedQuery.includes('vitals')) {
        groupToLoad = 'infrastructure';
      } else if (normalizedQuery.includes('user') || 
          normalizedQuery.includes('team') || 
          normalizedQuery.includes('auth') ||
          normalizedQuery.includes('access') ||
          normalizedQuery.includes('firewall') ||
          normalizedQuery.includes('security')) {
        groupToLoad = 'access';
      } else if (normalizedQuery.includes('project') || 
          normalizedQuery.includes('projects') ||
          normalizedQuery.includes('list project') ||
          normalizedQuery.includes('list projects') ||
          normalizedQuery.includes('show project') ||
          normalizedQuery.includes('show projects') ||
          normalizedQuery.includes('get project') ||
          normalizedQuery.includes('get projects') ||
          normalizedQuery.includes('view project') ||
          normalizedQuery.includes('view projects') ||
          normalizedQuery.includes('display project') ||
          normalizedQuery.includes('display projects') ||
          normalizedQuery.includes('fetch project') ||
          normalizedQuery.includes('fetch projects') ||
          normalizedQuery.includes('retrieve project') ||
          normalizedQuery.includes('retrieve projects') ||
          normalizedQuery.includes('deploy') || 
          normalizedQuery.includes('member') ||
          normalizedQuery.includes('transfer') ||
          normalizedQuery.includes('file')) {
        groupToLoad = 'projects';
      } else if (normalizedQuery.includes('domain') || 
          normalizedQuery.includes('dns') || 
          normalizedQuery.includes('cert') ||
          normalizedQuery.includes('ssl') ||
          normalizedQuery.includes('tls') ||
          normalizedQuery.includes('alias')) {
        groupToLoad = 'domains';
      } else if (normalizedQuery.includes('integration') || 
          normalizedQuery.includes('marketplace') ||
          normalizedQuery.includes('artifact') ||
          normalizedQuery.includes('int_')) {
        groupToLoad = 'integrations';
      }
    }

    // Load the group if one was found
    if (groupToLoad) {
      await this.loadGroup(groupToLoad);
    }
  }

  // New method to get available tools in a group
  async getGroupTools(groupName: string): Promise<string[]> {
    try {
      const group = await import(`./tool-groups/${groupName}/index.js`);
      return group.register(this.server);
    } catch (error) {
      console.error(`Failed to get tools for group ${groupName}:`, error);
      return [];
    }
  }
} 