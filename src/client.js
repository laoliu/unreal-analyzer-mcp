import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["./build/index.js"]
});

const client = new Client(
  {
    name: "unreal-analyzer",
    version: "0.1.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

await client.connect(transport);
// List resources
const resources = await client.listTools();
// Call a tool
const result0 = await client.callTool({
    name: "set_unreal_path",
    arguments: {
      path: "D:\\Program Files\\EpicGames\\UE_5.4"
    }
  });
  const result = await client.callTool({
    name: "set_custom_codebase",
    arguments: {
      path: "G:\\work\\mcp\\ExamplesForUEGenAIPlugin"
    }
  });
// const result2 = await client.callTool({
// name: "search_code",
// arguments: {
//     query: "ATDeepSeekChatExample"
// }
// });
    
const result3 = await client.callTool({
name: "analyze_class",
arguments: {
    className: "AAIController"
}
});

//ATDeepSeekChatExample
