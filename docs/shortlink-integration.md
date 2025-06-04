# ShortLink Integration for Share Chat

## 概述

这个功能允许通过 `linkId` 参数间接传递大量的初始化数据给工作流，避免了直接通过 query 参数传递大数据时可能发生的截断问题。

## 工作原理

1. **URL 参数**: 在分享链接中添加 `linkId` 参数
2. **API 调用**: 前端自动调用 `/api/common/shortLink/{linkId}` 接口
3. **数据获取**: 接口返回对应的 `initData`
4. **数据合并**: `initData` 被合并到工作流的全局变量中

## 使用方法

### 1. 分享链接格式

```
https://your-domain.com/chat/share?shareId=xxx&linkId=your-link-id
```

### 2. API 接口

**接口路径**: `/api/common/shortLink/{linkId}`

**请求方法**: GET

**响应格式**:
```json
{
  "initData": {
    "userId": "user-123",
    "sessionId": "session-456",
    "customParam1": "value1",
    "customParam2": "value2"
  }
}
```

**错误响应**:
```json
{
  "error": "linkId is required"
}
```

### 3. 实现细节

#### 前端 (share.tsx)

- 从 URL 中提取 `linkId` 参数
- 在组件挂载时调用 shortLink API
- 将获取的 `initData` 合并到工作流变量中

#### 后端 (API)

- 接收 `linkId` 参数
- 从数据存储中查询对应的数据
- 返回 `initData` 或错误信息

## 配置说明

### API 接口自定义

您需要根据实际的数据存储方式修改 `/api/common/shortLink/[linkId].ts` 文件：

```typescript
// 示例：从 Redis 获取数据
const shortLinkData = await redis.get(`shortlink:${linkId}`);

// 示例：从数据库获取数据
const shortLinkData = await db.collection('shortlinks').findOne({ linkId });

// 示例：从文件系统获取数据
const shortLinkData = await fs.readFile(`./data/${linkId}.json`);
```

### 数据结构

`initData` 可以包含任何键值对，这些数据将作为全局变量传递给工作流：

```json
{
  "initData": {
    "userId": "string",
    "sessionId": "string", 
    "userRole": "admin|user|guest",
    "permissions": ["read", "write"],
    "customSettings": {
      "theme": "dark",
      "language": "zh-CN"
    },
    "workflowParams": {
      "maxTokens": 1000,
      "temperature": 0.7
    }
  }
}
```

## 安全考虑

1. **验证 linkId**: 确保 linkId 格式正确且存在
2. **权限检查**: 验证访问者是否有权限获取该数据
3. **过期时间**: 设置 shortLink 的过期时间
4. **访问日志**: 记录 shortLink 的访问情况
5. **数据脱敏**: 避免在 initData 中包含敏感信息

## 示例用法

### 创建 shortLink

```typescript
// 创建 shortLink 的示例代码
const createShortLink = async (initData: Record<string, any>) => {
  const linkId = generateUniqueId();
  await redis.setex(`shortlink:${linkId}`, 3600, JSON.stringify(initData)); // 1小时过期
  return linkId;
};
```

### 使用 shortLink

```
https://your-domain.com/chat/share?shareId=abc123&linkId=demo
```

当用户访问这个链接时：
1. 前端提取 `linkId=demo`
2. 调用 `/api/common/shortLink/demo`
3. 获取对应的 initData
4. 将 initData 传递给工作流

## 故障排除

### 常见问题

1. **linkId 不存在**: 检查 linkId 是否正确，是否已过期
2. **API 调用失败**: 检查网络连接和 API 接口是否正常
3. **数据格式错误**: 确保 initData 格式正确
4. **权限问题**: 检查是否有访问权限

### 调试方法

1. 查看浏览器控制台的网络请求
2. 检查 API 接口的响应
3. 验证 initData 是否正确合并到变量中

## 扩展功能

### 批量处理

可以扩展 API 支持批量获取多个 linkId 的数据：

```typescript
// GET /api/common/shortLink/batch?linkIds=id1,id2,id3
```

### 缓存优化

添加缓存机制提高性能：

```typescript
// 使用内存缓存或 Redis 缓存
const cachedData = await cache.get(linkId);
if (cachedData) {
  return cachedData;
}
```

### 统计分析

记录 shortLink 的使用统计：

```typescript
// 记录访问次数、访问时间等
await analytics.track('shortlink_accessed', { linkId, timestamp: Date.now() });
```