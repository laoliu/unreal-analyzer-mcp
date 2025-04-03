declare module '@modelcontextprotocol/create-server' {
  export class Server {
    constructor(
      info: {
        name: string;
        version: string;
      },
      config: {
        capabilities: {
          tools?: {};
          resources?: {};
        };
      }
    );

    onerror: (error: Error) => void;
    close(): Promise<void>;
    connect(transport: StdioServerTransport): Promise<void>;
    
  //   setRequestHandler<T extends ZodObject<{
  //     method: ZodLiteral<string>;
  // }>>(requestSchema: T, handler: (request: z.infer<T>, extra: RequestHandlerExtra) => SendResultT | Promise<SendResultT>): void;

    setRequestHandler<T extends { params: any }>(
      method: string,
      handler: (request: T) => Promise<{
        content?: Array<{
          type: string;
          text: string;
        }>;
        tools?: Array<{
          name: string;
          description: string;
          inputSchema: {
            type: string;
            properties: Record<string, any>;
            required: string[];
          };
        }>;
      }>
    ): void;
  }
}
