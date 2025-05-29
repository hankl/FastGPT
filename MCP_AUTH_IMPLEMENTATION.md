# MCP工具调用认证实现

## 概述

本实现为FastGPT的工作流MCP工具调用添加了accessToken认证功能。当工作流调用MCP工具时，如果全局变量中存在`accessToken`，系统会自动将其作为`Authorization: Bearer {accessToken}`头部传递给MCP服务器。

## 实现细节

### 1. MCPClient类修改 (`packages/service/core/app/mcp.ts`)

- 添加了`accessToken`参数到构造函数
- 修改`getConnection()`方法，为两种传输方式添加Authorization头部：
  - **StreamableHTTPClientTransport**: 通过`requestInit.headers`设置
  - **SSEClientTransport**: 通过`requestInit.headers`和`eventSourceInit.headers`设置

```typescript
constructor(config: { url: string; accessToken?: string }) {
  this.url = config.url;
  this.accessToken = config.accessToken;
  // ...
}

private async getConnection(): Promise<Client> {
  const requestInit: RequestInit = {};
  if (this.accessToken) {
    requestInit.headers = {
      'Authorization': `Bearer ${this.accessToken}`
    };
  }
  // ...
}
```

### 2. 工具调用修改 (`packages/service/core/workflow/dispatch/plugin/runTool.ts`)

- 从工作流全局变量中提取`accessToken`
- 将`accessToken`传递给MCPClient构造函数
- 添加调试日志

```typescript
// Extract accessToken from global variables if available
const accessToken = variables?.accessToken;

const mcpClient = new MCPClient({ url, accessToken });
```

## 使用方法

### 1. 在工作流中设置accessToken

在工作流的全局变量中添加`accessToken`：

```json
{
  "variables": {
    "accessToken": "your-access-token-here"
  }
}
```

### 2. MCP服务器端验证

MCP服务器可以通过拦截HTTP请求头来验证accessToken：

```javascript
// Express.js示例
app.use('/mcp', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // 验证token逻辑
    if (isValidToken(token)) {
      next();
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  } else {
    res.status(401).json({ error: 'Missing authorization header' });
  }
});
```

## 传输协议支持

### StreamableHTTPClientTransport
- POST请求头部包含`Authorization: Bearer {token}`
- GET SSE连接头部包含`Authorization: Bearer {token}`

### SSEClientTransport  
- 初始SSE连接头部包含`Authorization: Bearer {token}`
- POST消息请求头部包含`Authorization: Bearer {token}`

## 安全考虑

1. **Token传输安全**: 建议使用HTTPS协议传输accessToken
2. **Token存储**: accessToken应该安全存储在工作流变量中
3. **Token验证**: MCP服务器应该实现适当的token验证逻辑
4. **Token过期**: 考虑实现token刷新机制

## 调试

系统会记录以下调试信息：

- `[MCP Client] Using accessToken for authentication` - 当使用accessToken时
- `[MCP Tool] Using accessToken for tool {toolName}` - 工具调用时使用accessToken
- `[MCP Tool] No accessToken found in global variables for tool {toolName}` - 未找到accessToken

## 兼容性

- 向后兼容：如果没有提供accessToken，系统行为与之前完全相同
- 支持所有现有的MCP工具和传输协议
- 不影响现有工作流的正常运行

## 测试

可以通过以下方式测试实现：

1. 在工作流全局变量中设置accessToken
2. 调用MCP工具
3. 检查MCP服务器日志确认收到Authorization头部
4. 验证服务器端认证逻辑正常工作