import {
  type DispatchNodeResultType,
  type ModuleDispatchProps
} from '@fastgpt/global/core/workflow/runtime/type';
import { DispatchNodeResponseKeyEnum } from '@fastgpt/global/core/workflow/runtime/constants';
import { NodeOutputKeyEnum } from '@fastgpt/global/core/workflow/constants';
import { MCPClient } from '../../../app/mcp';
import { getErrText } from '@fastgpt/global/common/error/utils';
import { addLog } from '../../../../common/system/log';

type RunToolProps = ModuleDispatchProps<{
  toolData: {
    name: string;
    url: string;
  };
}>;

type RunToolResponse = DispatchNodeResultType<{
  [NodeOutputKeyEnum.rawResponse]?: any;
}>;

export const dispatchRunTool = async (props: RunToolProps): Promise<RunToolResponse> => {
  const {
    params,
    node: { avatar },
    variables
  } = props;

  const { toolData, ...restParams } = params;
  const { name: toolName, url } = toolData;

  // Extract accessToken and tenantId from global variables if available
  const accessToken = variables?.accessToken;
  const tenantId = variables?.tenantId;

  if (accessToken) {
    addLog.debug(`[MCP Tool] Using accessToken for tool ${toolName}`);
  } else {
    addLog.debug(`[MCP Tool] No accessToken found in global variables for tool ${toolName}`);
  }

  if (tenantId) {
    addLog.debug(`[MCP Tool] Using tenantId for tool ${toolName}`);
  } else {
    addLog.debug(`[MCP Tool] No tenantId found in global variables for tool ${toolName}`);
  }

  const mcpClient = new MCPClient({ url, accessToken, tenantId });

  try {
    const result = await mcpClient.toolCall(toolName, restParams);

    return {
      [DispatchNodeResponseKeyEnum.nodeResponse]: {
        toolRes: result,
        moduleLogo: avatar
      },
      [DispatchNodeResponseKeyEnum.toolResponses]: result,
      [NodeOutputKeyEnum.rawResponse]: result
    };
  } catch (error) {
    return {
      [DispatchNodeResponseKeyEnum.nodeResponse]: {
        moduleLogo: avatar,
        error: getErrText(error)
      },
      [DispatchNodeResponseKeyEnum.toolResponses]: getErrText(error)
    };
  }
};
