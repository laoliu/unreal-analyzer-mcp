// 扩展错误代码处理
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import exp from 'constants';

export { ErrorCode }; // Add this line to export the ErrorCode

export class McpError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string
  ) {
    super(message);
  }
}
