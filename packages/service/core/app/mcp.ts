import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { type ToolType } from '@fastgpt/global/core/app/type';
import { addLog } from '../../common/system/log';
import { retryFn } from '@fastgpt/global/common/system/utils';

export class MCPClient {
  private client: Client;
  private url: string;
  private accessToken?: string;

  constructor(config: { url: string; accessToken?: string }) {
    this.url = config.url;
    this.accessToken = config.accessToken;
    this.client = new Client({
      name: 'FastGPT-MCP-client',
      version: '1.0.0'
    });
  }

  private async getConnection(): Promise<Client> {
    // Prepare request options with Authorization header if accessToken is provided
    const requestInit: RequestInit = {};
    if (this.accessToken) {
      requestInit.headers = {
        Authorization: `Bearer ${this.accessToken}`
      };
      addLog.debug('[MCP Client] Using accessToken for authentication');
    }

    try {
      const transport = new StreamableHTTPClientTransport(new URL(this.url), {
        requestInit
      });
      await this.client.connect(transport);
      addLog.debug('[MCP Client] Connected using StreamableHTTPClientTransport');
      return this.client;
    } catch (error) {
      addLog.debug('[MCP Client] StreamableHTTPClientTransport failed, trying SSEClientTransport');

      // For SSE transport, we need to set headers in both eventSourceInit and requestInit
      const sseOptions: any = {
        requestInit
      };

      // Set Authorization header for the initial SSE connection
      if (this.accessToken) {
        sseOptions.eventSourceInit = {
          headers: {
            Authorization: `Bearer ${this.accessToken}`
          }
        };
      }

      await this.client.connect(new SSEClientTransport(new URL(this.url), sseOptions));
      addLog.debug('[MCP Client] Connected using SSEClientTransport');
      return this.client;
    }
  }

  // 内部方法：关闭连接
  private async closeConnection() {
    try {
      await retryFn(() => this.client.close(), 3);
    } catch (error) {
      addLog.error('[MCP Client] Failed to close connection:', error);
    }
  }

  /**
   * Get available tools list
   * @returns List of tools
   */
  public async getTools(): Promise<ToolType[]> {
    try {
      const client = await this.getConnection();
      const response = await client.listTools();

      if (!Array.isArray(response.tools)) {
        return Promise.reject('[MCP Client] Get tools response is not an array');
      }

      const tools = response.tools.map((tool) => ({
        name: tool.name,
        description: tool.description || '',
        inputSchema: tool.inputSchema || {
          type: 'object',
          properties: {}
        }
      }));

      // @ts-ignore
      return tools;
    } catch (error) {
      addLog.error('[MCP Client] Failed to get tools:', error);
      return Promise.reject(error);
    } finally {
      await this.closeConnection();
    }
  }

  /**
   * Call tool
   * @param toolName Tool name
   * @param params Parameters
   * @returns Tool execution result
   */
  public async toolCall(toolName: string, params: Record<string, any>): Promise<any> {
    try {
      const client = await this.getConnection();
      addLog.debug(`[MCP Client] Call tool: ${toolName}`, params);

      return await client.callTool({
        name: toolName,
        arguments: params
      });
    } catch (error) {
      addLog.error(`[MCP Client] Failed to call tool ${toolName}:`, error);
      return Promise.reject(error);
    } finally {
      await this.closeConnection();
    }
  }
}
