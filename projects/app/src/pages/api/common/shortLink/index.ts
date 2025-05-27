import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { NextAPI } from '@/service/middleware/entry';
import { setRedisCache } from '@fastgpt/service/common/redis/cache';
import { customAlphabet } from 'nanoid';

// 生成短链接ID的字符集和长度
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz1234567890', 8);

export type ShortLinkCreateBody = {
  data: Record<string, any>; // JSON对象数据
  expireSeconds?: number; // 可选的过期时间（秒）
};

export type ShortLinkCreateResponse = {
  id: string; // 短链接ID
};

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  try {
    // 只允许POST方法
    if (req.method !== 'POST') {
      return jsonRes(res, {
        code: 405,
        message: 'Method not allowed'
      });
    }

    const { data, expireSeconds = 3600 * 24 * 7 } = req.body as ShortLinkCreateBody; // 默认7天过期

    // 验证必需参数
    if (!data || typeof data !== 'object') {
      return jsonRes(res, {
        code: 400,
        message: 'Invalid data parameter. Must be a JSON object.'
      });
    }

    // 生成短链接ID
    const shortLinkId = nanoid();

    // 构建Redis key
    const redisKey = `shortlink:${shortLinkId}`;

    try {
      // 将数据存储到Redis
      await setRedisCache(redisKey, JSON.stringify(data), expireSeconds);
    } catch (redisError) {
      console.error('Redis error:', redisError);
      // 如果Redis不可用，我们仍然返回ID，但记录错误
      return jsonRes(res, {
        code: 500,
        message: 'Redis service unavailable'
      });
    }

    // 返回成功响应
    jsonRes<ShortLinkCreateResponse>(res, {
      code: 200,
      message: 'Short link created successfully',
      data: {
        id: shortLinkId
      }
    });
  } catch (error) {
    jsonRes(res, {
      code: 500,
      error
    });
  }
}

export default NextAPI(handler);
