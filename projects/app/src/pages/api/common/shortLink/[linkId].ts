import type { NextApiResponse } from 'next';
import { type ApiRequestProps } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';

type ShortLinkResponse = {
  initData?: Record<string, any>;
  error?: string;
};

async function handler(
  req: ApiRequestProps<{}, { linkId: string }>,
  res: NextApiResponse
): Promise<ShortLinkResponse> {
  const { linkId } = req.query;

  if (!linkId) {
    return {
      error: 'linkId is required'
    };
  }

  try {
    // 这里应该从数据库或缓存中获取shortLink对应的数据
    // 目前先返回一个模拟的响应，您需要根据实际的数据存储方式来实现

    // 示例：从Redis或数据库中获取数据
    // const shortLinkData = await getShortLinkData(linkId);

    // 模拟数据，实际使用时请替换为真实的数据获取逻辑
    // 这里可以根据linkId返回不同的initData
    const mockInitData: Record<string, any> = {};

    // 示例：根据linkId返回不同的初始化数据
    if (linkId === 'demo') {
      mockInitData.userId = 'demo-user-123';
      mockInitData.sessionId = 'demo-session-456';
      mockInitData.customParam1 = 'value1';
      mockInitData.customParam2 = 'value2';
    } else if (linkId === 'test') {
      mockInitData.testMode = true;
      mockInitData.debugLevel = 'verbose';
    }

    // 在实际实现中，您可能需要：
    // 1. 从Redis/数据库查询linkId对应的数据
    // 2. 验证linkId的有效性和过期时间
    // 3. 记录访问日志
    // 4. 处理权限验证

    return {
      initData: mockInitData
    };
  } catch (error) {
    console.error('Error fetching shortLink data:', error);
    return {
      error: 'Failed to fetch shortLink data'
    };
  }
}

export default NextAPI(handler);
