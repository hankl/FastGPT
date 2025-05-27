import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { NextAPI } from '@/service/middleware/entry';
import { getRedisCache } from '@fastgpt/service/common/redis/cache';

export type ShortLinkGetResponse = {
  data: Record<string, any>; // 存储的JSON对象数据
};

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  try {
    // 只允许GET方法
    if (req.method !== 'GET') {
      return jsonRes(res, {
        code: 405,
        message: 'Method not allowed'
      });
    }

    const { id } = req.query;

    // 验证ID参数
    if (!id || typeof id !== 'string') {
      return jsonRes(res, {
        code: 400,
        message: 'Invalid or missing id parameter'
      });
    }

    // 构建Redis key
    const redisKey = `shortlink:${id}`;

    try {
      // 从Redis获取数据
      const cachedData = await getRedisCache(redisKey);

      if (!cachedData) {
        return jsonRes(res, {
          code: 404,
          message: 'Short link not found or expired'
        });
      }

      // 解析JSON数据
      let parsedData;
      try {
        parsedData = JSON.parse(cachedData);
      } catch (parseError) {
        return jsonRes(res, {
          code: 500,
          message: 'Invalid data format in cache'
        });
      }

      // 返回成功响应
      jsonRes<ShortLinkGetResponse>(res, {
        code: 200,
        message: 'Short link data retrieved successfully',
        data: {
          data: parsedData
        }
      });
    } catch (redisError) {
      console.error('Redis error:', redisError);
      return jsonRes(res, {
        code: 500,
        message: 'Redis service unavailable'
      });
    }
  } catch (error) {
    jsonRes(res, {
      code: 500,
      error
    });
  }
}

export default NextAPI(handler);
