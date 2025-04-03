import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { CallToolResultSchema, JSONRPCMessage } from "@modelcontextprotocol/sdk/types";
import { JSONRPCMessageSchema }  from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// 初始化客户端（网页2示例调整）
const client = new Client(
  { name: "js-client", version: "1.0.0" },
  { capabilities: { tools: true } }
);

// 创建 SSE 传输层（网页6架构实现）
const url = new URL("http://localhost:3001/sse");
const transport = new SSEClientTransport(
  url
);
class ToolCaller {
    requestMap: Map<any, any>;
    currentRequestId: number;
  constructor() {
    this.requestMap = new Map(); // 存储 pending 的请求
    this.currentRequestId = 0;
    
    // 监听服务器响应
    transport.onmessage = (event:any) => {
      try {
        // 解析并验证消息格式
        const id = event.id || event.data.id; // 处理不同的事件格式
        const message = event;
    
        // 检查消息是否有 id 并在 requestMap 中存在
        if (id && this.requestMap.has(id)) {
          const { resolve, reject } = this.requestMap.get(id);
    
          // 根据消息内容处理结果或错误
          if ("result" in message) {
            resolve(message.result);
          } else if ("error" in message) {
            reject(new Error(message.error.message));
          }
    
          // 从 requestMap 中移除已处理的消息
          this.requestMap.delete(id);
        }
      } catch (error) {
        console.error("Failed to process message:", error);
      }
    };
  }

  // 实现类 call 方法调用机制
  async ListTool() {
    const requestId = this._generateRequestId();
    return new Promise((resolve, reject) => {
      // 构造符合 MCP 协议的请求消息
      const message = {
        jsonrpc: "2.0",
        id: requestId,
        method: "tools/list",
        params: {
        }
      };

      // 存储 pending 请求
      this.requestMap.set(requestId, { resolve, reject });

      const parsedMessage = JSONRPCMessageSchema.parse(message);
      // 发送请求（模拟 call 方法的立即执行特性[4](@ref)）          
      transport
        .send(parsedMessage)
        .then(() => {
          console.log("Message sent successfully");
        })
        .catch((error) => {
          console.error("Failed to send message:", error);
        });
    });
  }

  // 实现类 call 方法调用机制
  async callTool(toolName: any, params: any) {
    const requestId = this._generateRequestId();
    return new Promise((resolve, reject) => {
      // 构造符合 MCP 协议的请求消息
      const message = {
        jsonrpc: "2.0",
        id: requestId,
        method: "tools/call",
        params: {
          name: toolName,
          arguments: params
        }
      };

      // 存储 pending 请求
      this.requestMap.set(requestId, { resolve, reject });

      const parsedMessage = JSONRPCMessageSchema.parse(message);


      // 发送请求（模拟 call 方法的立即执行特性[4](@ref)）          
      transport
        .send(parsedMessage)
        .then(() => {
          console.log("Message sent successfully");
        })
        .catch((error) => {
          console.error("Failed to send message:", error);
        });
    });
  }

  // 生成唯一请求 ID（基于 Symbol 的防冲突机制[5](@ref)）
  _generateRequestId() {
    return Symbol(`request_${this.currentRequestId++}`).toString();
  }
}


const sleep = (ms: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
// 使用示例（网页6交互流程）
async function main() {
  await client.connect(transport);
  const toolCaller = new ToolCaller();
  
  // 获取工具列表（网页4的Brave示例调整）
  const tools = await toolCaller.ListTool();
  //console.log("可用工具:", tools.map(t => t.name));
  

  const result1 = await toolCaller.callTool("set_unreal_path",
      {
        path: "D:/Program Files/EpicGames/UE_5.4"
      });
  const result2 = await toolCaller.callTool("set_custom_codebase",
      {
        path: "G:/work/mcp/ExamplesForUEGenAIPlugin"
      });
  // const result3 = await toolCaller.callTool("analyze_class",
  //     {
  //         className: "AAIController"
  //     });
  const result4 = await toolCaller.callTool("find_references",
      {
        identifier: "ATDeepSeekChatExample",
        type: "class"
      });
  console.log(result4); 
  let testFlag = 0; // 控制循环的布尔变量
  while (true) {
    if (testFlag == 0) {
      testFlag = 1; // 设置标志位为1，表示正在执行      
    }
    sleep(2000); // 延时 2 秒
  }
}

main();
