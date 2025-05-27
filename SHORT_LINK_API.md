# 短链接API文档

## 概述

短链接API允许您创建和检索短链接，将JSON对象数据存储在Redis中，并通过短ID进行访问。

## API端点

### 1. 创建短链接

**端点**: `POST /api/common/shortLink`

**描述**: 创建一个新的短链接，将JSON对象存储在Redis中。

**请求体**:
```json
{
  "data": {
    // 任意JSON对象数据
  },
  "expireSeconds": 604800  // 可选，过期时间（秒），默认7天
}
```

**响应**:
```json
{
  "code": 200,
  "message": "Short link created successfully",
  "data": {
    "id": "abc123xy"  // 生成的短链接ID
  }
}
```

**示例请求**:
```bash
curl -X POST http://localhost:3000/api/common/shortLink \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "title": "示例文档",
      "content": "这是一个示例内容",
      "author": "张三",
      "metadata": {
        "version": "1.0",
        "tags": ["示例", "测试"]
      }
    },
    "expireSeconds": 3600
  }'
```

### 2. 获取短链接数据

**端点**: `GET /api/common/shortLink/{id}`

**描述**: 根据短链接ID获取存储的JSON对象数据。

**路径参数**:
- `id`: 短链接ID

**响应**:
```json
{
  "code": 200,
  "message": "Short link data retrieved successfully",
  "data": {
    "data": {
      // 原始存储的JSON对象数据
    }
  }
}
```

**示例请求**:
```bash
curl http://localhost:3000/api/common/shortLink/abc123xy
```

## 错误响应

### 400 Bad Request
```json
{
  "code": 400,
  "message": "Invalid data parameter. Must be a JSON object."
}
```

### 404 Not Found
```json
{
  "code": 404,
  "message": "Short link not found or expired"
}
```

### 405 Method Not Allowed
```json
{
  "code": 405,
  "message": "Method not allowed"
}
```

### 500 Internal Server Error
```json
{
  "code": 500,
  "message": "Redis service unavailable"
}
```

## 特性

1. **自动生成ID**: 使用nanoid生成8位随机字符串作为短链接ID
2. **Redis存储**: 数据存储在Redis中，支持过期时间设置
3. **JSON支持**: 支持任意复杂的JSON对象存储
4. **错误处理**: 完善的错误处理和响应
5. **类型安全**: 使用TypeScript提供类型定义

## 配置

### Redis配置
确保Redis服务正在运行，并且环境变量`REDIS_URL`已正确设置：
```bash
export REDIS_URL="redis://localhost:6379"
```

### 默认设置
- 短链接ID长度: 8位
- 字符集: `abcdefghijklmnopqrstuvwxyz1234567890`
- 默认过期时间: 7天 (604800秒)
- Redis键前缀: `fastgpt:cache:shortlink:`

## 使用场景

1. **临时数据共享**: 创建临时链接分享复杂的JSON数据
2. **配置传递**: 在不同系统间传递配置信息
3. **状态保存**: 保存用户操作状态或会话数据
4. **API响应缓存**: 缓存复杂的API响应数据

## 安全考虑

1. **数据敏感性**: 不要存储敏感信息，如密码、密钥等
2. **过期时间**: 根据数据敏感性设置合适的过期时间
3. **访问控制**: 考虑添加访问权限验证（当前版本未实现）
4. **数据大小**: 注意JSON对象大小，避免存储过大的数据

## 测试

运行测试脚本：
```bash
node test_shortlink_api.js
```

测试脚本将验证：
- 短链接创建功能
- 数据检索功能
- 数据一致性
- 错误处理

## 技术实现

- **框架**: Next.js API Routes
- **存储**: Redis
- **ID生成**: nanoid
- **类型检查**: TypeScript
- **错误处理**: 统一的jsonRes响应格式