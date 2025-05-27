import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Textarea,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  Code,
  Divider,
  useToast
} from '@chakra-ui/react';
import axios from 'axios';

interface ShortLinkResponse {
  code: number;
  message: string;
  data: {
    id: string;
  };
}

interface GetDataResponse {
  code: number;
  message: string;
  data: {
    data: any;
  };
}

const ShortLinkDemo: React.FC = () => {
  const [jsonInput, setJsonInput] = useState(
    '{\n  "title": "示例文档",\n  "content": "这是一个测试内容",\n  "author": "测试用户",\n  "timestamp": "' +
      new Date().toISOString() +
      '"\n}'
  );
  const [expireSeconds, setExpireSeconds] = useState('3600');
  const [shortLinkId, setShortLinkId] = useState('');
  const [retrievedData, setRetrievedData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toast = useToast();

  const createShortLink = async () => {
    setLoading(true);
    setError('');

    try {
      // 验证JSON格式
      const data = JSON.parse(jsonInput);

      const response = await axios.post<ShortLinkResponse>('/api/common/shortLink', {
        data,
        expireSeconds: parseInt(expireSeconds) || 3600
      });

      if (response.data.code === 200) {
        setShortLinkId(response.data.data.id);
        toast({
          title: '短链接创建成功',
          description: `ID: ${response.data.data.id}`,
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      if (err.name === 'SyntaxError') {
        setError('JSON格式错误，请检查输入');
      } else {
        setError(err.response?.data?.message || err.message || '创建失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const retrieveData = async () => {
    if (!shortLinkId) {
      setError('请先创建短链接或输入有效的ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get<GetDataResponse>(`/api/common/shortLink/${shortLinkId}`);

      if (response.data.code === 200) {
        setRetrievedData(JSON.stringify(response.data.data.data, null, 2));
        toast({
          title: '数据获取成功',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '获取失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="xl" textAlign="center">
          短链接API演示
        </Heading>

        <Text textAlign="center" color="gray.600">
          这个演示页面展示了如何使用短链接API来存储和检索JSON数据
        </Text>

        <Divider />

        {/* 创建短链接部分 */}
        <Box>
          <Heading as="h2" size="lg" mb={4}>
            1. 创建短链接
          </Heading>

          <VStack spacing={4} align="stretch">
            <Box>
              <Text mb={2} fontWeight="semibold">
                JSON数据:
              </Text>
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="输入要存储的JSON数据"
                rows={8}
                fontFamily="mono"
              />
            </Box>

            <HStack>
              <Box>
                <Text mb={2} fontWeight="semibold">
                  过期时间(秒):
                </Text>
                <Input
                  value={expireSeconds}
                  onChange={(e) => setExpireSeconds(e.target.value)}
                  placeholder="3600"
                  type="number"
                  width="150px"
                />
              </Box>

              <Button
                colorScheme="blue"
                onClick={createShortLink}
                isLoading={loading}
                alignSelf="end"
              >
                创建短链接
              </Button>
            </HStack>
          </VStack>
        </Box>

        <Divider />

        {/* 短链接ID显示 */}
        {shortLinkId && (
          <Box>
            <Text fontWeight="semibold" mb={2}>
              生成的短链接ID:
            </Text>
            <Code p={3} borderRadius="md" fontSize="lg" colorScheme="green">
              {shortLinkId}
            </Code>
          </Box>
        )}

        {/* 获取数据部分 */}
        <Box>
          <Heading as="h2" size="lg" mb={4}>
            2. 获取短链接数据
          </Heading>

          <HStack mb={4}>
            <Input
              value={shortLinkId}
              onChange={(e) => setShortLinkId(e.target.value)}
              placeholder="输入短链接ID"
            />
            <Button colorScheme="green" onClick={retrieveData} isLoading={loading}>
              获取数据
            </Button>
          </HStack>
        </Box>

        {/* 检索到的数据显示 */}
        {retrievedData && (
          <Box>
            <Text fontWeight="semibold" mb={2}>
              检索到的数据:
            </Text>
            <Code p={4} borderRadius="md" whiteSpace="pre-wrap" display="block" bg="gray.50">
              {retrievedData}
            </Code>
          </Box>
        )}

        {/* 错误信息显示 */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Divider />

        {/* API信息 */}
        <Box>
          <Heading as="h3" size="md" mb={3}>
            API端点信息
          </Heading>
          <VStack align="stretch" spacing={2}>
            <Text>
              <strong>创建短链接:</strong> <Code>POST /api/common/shortLink</Code>
            </Text>
            <Text>
              <strong>获取数据:</strong> <Code>GET /api/common/shortLink/{'{id}'}</Code>
            </Text>
            <Text fontSize="sm" color="gray.600">
              更多详细信息请查看 SHORT_LINK_API.md 文档
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default ShortLinkDemo;
