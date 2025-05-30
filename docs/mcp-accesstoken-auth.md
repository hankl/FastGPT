# MCP工具认证和租户标识功能

## 功能概述

FastGPT现在支持在调用MCP工具时自动传递认证和租户信息：

1. **AccessToken认证**: 如果全局变量中包含`accessToken`，系统会自动将其作为`Authorization: Bearer <token>`请求头传递
2. **租户标识**: 如果全局变量中包含`tenantId`，系统会自动将其作为`X-Coral-Tenant: <tenantId>`请求头传递

## 使用方法

### 1. 设置全局变量

1. 登录FastGPT管理界面
2. 进入 **账户设置** > **第三方配置**
3. 找到 **工作流变量** 配置项
4. 添加需要的变量：

   **AccessToken变量**:
   - **键名**: `accessToken`
   - **值**: 你的访问令牌

   **租户ID变量**:
   - **键名**: `tenantId`
   - **值**: 你的租户标识符

### 2. 在工作流中使用MCP工具

当工作流执行到MCP工具节点时：

1. 系统会自动检查全局变量中是否存在`accessToken`和`tenantId`
2. 如果存在`accessToken`，会将其添加到HTTP请求头：`Authorization: Bearer <accessToken的值>`
3. 如果存在`tenantId`，会将其添加到HTTP请求头：`X-Coral-Tenant: <tenantId的值>`
4. MCP服务器可以通过拦截这些请求头来验证用户权限和识别租户

## 技术实现

### 全局变量传递流程

```
用户设置全局变量 → 团队配置存储 → 工作流调度 → MCP工具调用 → HTTP请求头
```

### 代码实现位置

- **全局变量管理**: `packages/service/support/user/team/controller.ts`
- **工作流变量合并**: `packages/service/core/workflow/dispatch/index.ts` (第209行)
- **MCP工具调用**: `packages/service/core/workflow/dispatch/plugin/runTool.ts`
- **MCP客户端**: `packages/service/core/app/mcp.ts`

### 支持的传输协议

- **StreamableHTTPClientTransport**: 通过`requestInit.headers`传递认证和租户头
- **SSEClientTransport**: 通过`eventSourceInit.headers`和`requestInit.headers`传递认证和租户头

## 安全考虑

1. **令牌保护**: AccessToken和TenantId存储在团队配置中，只有团队成员可以访问
2. **传输安全**: 建议MCP服务器使用HTTPS协议
3. **权限验证**: MCP服务器应该验证AccessToken的有效性和权限范围
4. **租户隔离**: MCP服务器应该根据TenantId进行数据隔离和权限控制

## 示例

### MCP服务器端验证示例

```javascript
// Express.js示例
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  const tenantId = req.headers['x-coral-tenant'];
  
  // 验证AccessToken
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (isValidToken(token)) {
      req.user = getUserFromToken(token);
      
      // 验证租户ID
      if (tenantId) {
        if (isValidTenant(tenantId, req.user)) {
          req.tenantId = tenantId;
          next();
        } else {
          res.status(403).json({ error: 'Invalid tenant access' });
        }
      } else {
        // 如果没有租户ID，使用默认租户或拒绝访问
        next();
      }
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  } else {
    res.status(401).json({ error: 'Missing authorization header' });
  }
});
```

## 调试信息

系统会在日志中记录以下调试信息：

- `[MCP Tool] Using accessToken for tool <toolName>`: 找到AccessToken并使用
- `[MCP Tool] No accessToken found in global variables for tool <toolName>`: 未找到AccessToken
- `[MCP Tool] Using tenantId for tool <toolName>`: 找到TenantId并使用
- `[MCP Tool] No tenantId found in global variables for tool <toolName>`: 未找到TenantId
- `[MCP Client] Using accessToken for authentication`: MCP客户端使用AccessToken
- `[MCP Client] Using tenantId for tenant identification`: MCP客户端使用TenantId
- `[MCP Client] Connected using <TransportType>`: 连接成功的传输类型

## 故障排除

1. **AccessToken未传递**:
   - 检查全局变量中是否正确设置了`accessToken`
   - 确认变量名称为`accessToken`（区分大小写）

2. **TenantId未传递**:
   - 检查全局变量中是否正确设置了`tenantId`
   - 确认变量名称为`tenantId`（区分大小写）

3. **MCP服务器收不到请求头**:
   - 检查MCP服务器是否正确处理HTTP请求头
   - 确认使用的是支持的传输协议
   - 验证`Authorization`和`X-Coral-Tenant`头是否正确接收

4. **权限验证失败**:
   - 检查AccessToken是否有效
   - 确认MCP服务器的权限验证逻辑

5. **租户验证失败**:
   - 检查TenantId是否有效
   - 确认用户有权限访问指定租户
   - 验证MCP服务器的租户隔离逻辑