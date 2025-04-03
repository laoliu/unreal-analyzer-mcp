#!/usr/bin/env node
/**
 * Created by Ayelet Technology Private Limited
 */

import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { UnrealCodeAnalyzer } from './analyzer.js';
import { GAME_GENRES, GameGenre, GenreFlag } from './types/game-genres.js';
import { z } from "zod";
import { LogLevel, Logger } from './logger.js';
import path from "path";
import { ToolService } from "./toolservices.js";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

const logger = new Logger();
const app = express();
class UnrealAnalyzerServer {
  private server: McpServer;
  private analyzer: UnrealCodeAnalyzer;

  constructor() {
    this.server = new McpServer(
      {
        name: 'unreal-analyzer',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.analyzer = new UnrealCodeAnalyzer();
    this.setupToolHandlers();
    
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {

    let tools= [
      {
        name: 'set_unreal_path',
        description: 'Set the path to Unreal Engine source code',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Absolute path to Unreal Engine source directory',
            },
          },
          required: ['path'],
        },
        params: {path: z.string()},
        toolfunc: async (args:any) => { },
      },
      {
        name: 'set_custom_codebase',
        description: 'Set the path to a custom C++ codebase for analysis',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Absolute path to custom codebase directory',
            },
          },
          required: ['path'],
        },
        params: {path: z.string()},
        toolfunc: async (args:any) => { },
      },
      {
        name: 'analyze_class',
        description: 'Get detailed information about a C++ class',
        inputSchema: {
          type: 'object',
          properties: {
            className: {
              type: 'string',
              description: 'Name of the class to analyze',
            },
          },
          required: ['className'],
        },
        params: {className: z.string()},
        toolfunc: async (args:any) => { },
      },
      {
        name: 'find_class_hierarchy',
        description: 'Get the inheritance hierarchy for a class',
        inputSchema: {
          type: 'object',
          properties: {
            className: {
              type: 'string',
              description: 'Name of the class to analyze',
            },
            includeImplementedInterfaces: {
              type: 'boolean',
              description: 'Whether to include implemented interfaces',
              default: true,
            },
          },
          required: ['className'],
        },
        params: {className: z.string(), includeImplementedInterfaces: z.boolean()},
        toolfunc: async (args:any) => { },
      },
      {
        name: 'find_references',
        description: 'Find all references to a class, function, or variable',
        inputSchema: {
          type: 'object',
          properties: {
            identifier: {
              type: 'string',
              description: 'Name of the symbol to find references for',
            },
            type: {
              type: 'string',
              description: 'Type of symbol (class, function, variable)',
              enum: ['class', 'function', 'variable'],
            },
          },
          required: ['identifier'],
        },
        params: {identifier: z.string(), type: z.enum(['class', 'function', 'variable'])},
        toolfunc: async (args:any) => { },
      },
      {
        name: 'search_code',
        description: 'Search through code with context',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (supports regex)',
            },
            filePattern: {
              type: 'string',
              description: 'File pattern to search in (e.g. *.h, *.cpp)',
              default: '*.{h,cpp}',
            },
            includeComments: {
              type: 'boolean',
              description: 'Whether to include comments in search',
              default: true,
            },
          },
          required: ['query'],
        },
        params: {query: z.string(), filePattern: z.string(), includeComments: z.boolean()},
        toolfunc: async (args:any) => { },
      },
      {
        name: 'detect_patterns',
        description: 'Detect Unreal Engine patterns and suggest improvements',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Path to the file to analyze',
            },
          },
          required: ['filePath'],
        },
        params: {filePath: z.string()},
        toolfunc: async (args:any) => { },
      },
      {
        name: 'get_best_practices',
        description: 'Get Unreal Engine best practices and documentation for a specific concept',
        inputSchema: {
          type: 'object',
          properties: {
            concept: {
              type: 'string',
              description: 'Concept to get best practices for (e.g. UPROPERTY, Components, Events)',
              enum: ['UPROPERTY', 'UFUNCTION', 'Components', 'Events', 'Replication', 'Blueprints'],
            },
          },
          required: ['concept'],
        },
        params: {concept: z.enum(['UPROPERTY', 'UFUNCTION', 'Components', 'Events', 'Replication', 'Blueprints'])},
        toolfunc: async (args:any) => { },
      },
      {
        name: 'analyze_subsystem',
        description: 'Analyze a specific Unreal Engine subsystem',
        inputSchema: {
          type: 'object',
          properties: {
            subsystem: {
              type: 'string',
              description: 'Name of the subsystem (e.g. Rendering, Physics)',
              enum: [
                'Rendering',
                'Physics',
                'Audio',
                'Networking',
                'Input',
                'AI',
                'Animation',
                'UI',
              ],
            },
          },
          required: ['subsystem'],
        },
        params: {subsystem: z.enum(['Rendering', 'Physics', 'Audio', 'Networking', 'Input', 'AI', 'Animation', 'UI'])},
        toolfunc: async (args:any) => { },
      },
      {
        name: 'query_api',
        description: 'Search and retrieve Unreal Engine API documentation',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for API documentation',
            },
            category: {
              type: 'string',
              description: 'Filter by category (Object, Actor, Structure, Component)',
              enum: ['Object', 'Actor', 'Structure', 'Component', 'Miscellaneous'],
            },
            module: {
              type: 'string',
              description: 'Filter by module (Core, RenderCore, etc.)',
            },
            includeExamples: {
              type: 'boolean',
              description: 'Include code examples in results',
              default: true,
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of results to return',
              default: 10,
            },
          },
          required: ['query'],
        },
        params: {query: z.string(), category: z.enum(['Object', 'Actor', 'Structure', 'Component', 'Miscellaneous']), module: z.string(), includeExamples: z.boolean(), maxResults: z.number()},
        toolfunc: async (args:any) => { },
      },
    ]
    
    Object.entries(tools).forEach(([id, tool]) => {
      let name : any = tool.name;
      let description = tool.description;
      let inputSchema = tool.inputSchema;
      let toolschemas : any = new ToolService().toolSchemas;
      
    this.server.tool(name,  description, toolschemas[name].schema, async(args:any) =>{let a:any = await this.process(args); return a;});
    });
  }

    private async process(args: any) {     
      const parsed = args;
      const name = parsed.method;
      logger.log(LogLevel.INFO, 'name111111111111:'+ name);
      logger.log(LogLevel.INFO, 'params22222222222222:'+ JSON.stringify(args, null, 2));      
            
      // Initialization check
      if (this.requiresInitialization(name) && !this.analyzer.isInitialized()) {
        throw new Error('No codebase initialized. Use set_unreal_path or set_custom_codebase first.');
      }

      // Routing logic
      switch (name) {
        case 'analyze_class':
          return this.handleAnalyzeClass(parsed);
        case 'find_class_hierarchy':
          return this.handleFindClassHierarchy(parsed);
        case 'find_references':
          return this.handleFindReferences(parsed);
        case 'search_code':
          return this.handleSearchCode(parsed);
        case 'analyze_subsystem':
          return this.handleAnalyzeSubsystem(parsed);
        case 'query_api':
          return this.handleQueryApi(parsed);
        case 'detect_patterns':
          return this.handleDetectPatterns(parsed);
        case 'get_best_practices':
          return this.handleGetBestPractices(parsed);
        case 'set_unreal_path':
          return this.handleSetUnrealPath(parsed);
        case 'set_custom_codebase':
          return this.handleSetCustomCodebase(parsed);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    }
  
  private requiresInitialization(toolName: string): boolean {
    const analysisTools = [
      'analyze_class', 'find_class_hierarchy', 
      'find_references', 'search_code', 
      'analyze_subsystem', 'query_api'
    ];
    return analysisTools.includes(toolName);
  }
  

  private async handleSetUnrealPath(args: any) {
    try {
      await this.analyzer.initialize(args.path);
      return {
        content: [
          {
            type: 'text',
            text: `Successfully set Unreal Engine path to: ${args.path}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to set Unreal Engine path');
    }
  }

  private async handleSetCustomCodebase(args: any) {
    try {
      await this.analyzer.initializeCustomCodebase(args.path);
      return {
        content: [
          {
            type: 'text',
            text: `Successfully set custom codebase path to: ${args.path}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to set custom codebase path');
    }
  }

  private async handleAnalyzeClass(args: any) {
    try {
      const classInfo = await this.analyzer.analyzeClass(args.className);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(classInfo, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to analyze class');
    }
  }

  private async handleFindClassHierarchy(args: any) {
    try {
      const hierarchy = await this.analyzer.findClassHierarchy(
        args.className,
        args.includeImplementedInterfaces
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(hierarchy, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to find class hierarchy');
    }
  }

  private async handleFindReferences(args: any) {
    try {
      const references = await this.analyzer.findReferences(
        args.identifier,
        args.type
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(references, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to find references');
    }
  }

  private async handleSearchCode(args: any) {
    try {
      const results = await this.analyzer.searchCode(
        args.query,
        args.filePattern,
        args.includeComments
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to search code');
    }
  }

  private async handleDetectPatterns(args: any) {
    try {
      const fileContent = await require('fs').promises.readFile(args.filePath, 'utf8');
      const patterns = await this.analyzer.detectPatterns(fileContent, args.filePath);
      
      // Format the output to be more readable in Cline
      const formattedPatterns = patterns.map(match => {
        return {
          pattern: match.pattern.name,
          description: match.pattern.description,
          location: `${match.file}:${match.line}`,
          context: match.context,
          improvements: match.suggestedImprovements?.join('\n'),
          documentation: match.pattern.documentation,
          bestPractices: match.pattern.bestPractices.join('\n'),
          examples: match.pattern.examples.join('\n'),
        };
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(formattedPatterns, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to detect patterns');
    }
  }

  private async handleGetBestPractices(args: any) {
    const bestPractices: { [key: string]: any } = {
      'UPROPERTY': {
        description: 'Property declaration for Unreal reflection system',
        bestPractices: [
          'Use appropriate specifiers (EditAnywhere, BlueprintReadWrite)',
          'Consider replication needs (Replicated, ReplicatedUsing)',
          'Group related properties with categories',
          'Use Meta tags for validation and UI customization',
        ],
        examples: [
          'UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Combat")\nfloat Health;',
          'UPROPERTY(Replicated, Meta = (ClampMin = "0.0"))\nfloat Speed;',
        ],
        documentation: 'https://docs.unrealengine.com/5.0/en-US/unreal-engine-uproperty-specifier-reference/',
      },
      'UFUNCTION': {
        description: 'Function declaration for Unreal reflection system',
        bestPractices: [
          'Use BlueprintCallable for functions that can be called from Blueprints',
          'Use BlueprintPure for functions without side effects',
          'Consider using BlueprintNativeEvent for overridable functions',
          'Add categories and tooltips for better organization',
        ],
        examples: [
          'UFUNCTION(BlueprintCallable, Category = "Combat")\nvoid TakeDamage(float DamageAmount);',
          'UFUNCTION(BlueprintPure, Category = "Stats")\nfloat GetHealthPercentage() const;',
        ],
        documentation: 'https://docs.unrealengine.com/5.0/en-US/ufunctions-in-unreal-engine/',
      },
      'Components': {
        description: 'Component setup and management in Unreal Engine',
        bestPractices: [
          'Create components in constructor using CreateDefaultSubobject',
          'Set up component hierarchy properly',
          'Initialize component properties in constructor',
          'Consider component replication needs',
        ],
        examples: [
          'MeshComponent = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Mesh"));\nRootComponent = MeshComponent;',
          'CollisionComponent->SetupAttachment(RootComponent);',
        ],
        documentation: 'https://docs.unrealengine.com/5.0/en-US/components-in-unreal-engine/',
      },
      'Events': {
        description: 'Event handling and delegation in Unreal Engine',
        bestPractices: [
          'Bind events in BeginPlay and unbind in EndPlay',
          'Use weak pointers for delegate bindings',
          'Consider using BlueprintAssignable for Blueprint events',
          'Handle edge cases and null checks',
        ],
        examples: [
          'DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnHealthChanged, float, NewHealth);',
          'OnHealthChanged.AddDynamic(this, &AMyActor::HandleHealthChanged);',
        ],
        documentation: 'https://docs.unrealengine.com/5.0/en-US/delegates-in-unreal-engine/',
      },
      'Replication': {
        description: 'Network replication in Unreal Engine',
        bestPractices: [
          'Mark properties with Replicated specifier',
          'Implement GetLifetimeReplicatedProps',
          'Use ReplicatedUsing for property change callbacks',
          'Consider replication conditions (COND_*)',
        ],
        examples: [
          'void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const;',
          'UPROPERTY(ReplicatedUsing = OnRep_Health)\nfloat Health;',
        ],
        documentation: 'https://docs.unrealengine.com/5.0/en-US/networking-overview-for-unreal-engine/',
      },
      'Blueprints': {
        description: 'Blueprint integration and exposure',
        bestPractices: [
          'Use appropriate function and property specifiers',
          'Organize functions and properties into categories',
          'Add tooltips and descriptions',
          'Consider Blueprint/C++ interaction patterns',
        ],
        examples: [
          'UCLASS(Blueprintable, BlueprintType)',
          'UFUNCTION(BlueprintImplementableEvent)',
        ],
        documentation: 'https://docs.unrealengine.com/5.0/en-US/blueprints-and-cpp-in-unreal-engine/',
      },
    };

    const concept = bestPractices[args.concept];
    if (!concept) {
      throw new Error(`Unknown concept: ${args.concept}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(concept, null, 2),
        },
      ],
    };
  }

  private async handleAnalyzeSubsystem(args: any) {
    try {
      const subsystemInfo = await this.analyzer.analyzeSubsystem(args.subsystem);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(subsystemInfo, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to analyze subsystem');
    }
  }

  private async handleQueryApi(args: any) {
    try {
      const results = await this.analyzer.queryApiReference(args.query, {
        category: args.category,
        module: args.module,
        includeExamples: args.includeExamples,
        maxResults: args.maxResults,
      });

      // Format results for better readability
      const formattedResults = results.map(result => ({
        class: result.reference.className,
        description: result.reference.description,
        module: result.reference.module,
        category: result.reference.category,
        syntax: result.reference.syntax,
        examples: result.reference.examples,
        remarks: result.reference.remarks,
        documentation: result.learningResources[0]?.url,
        relevance: result.relevance,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(formattedResults, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to query API documentation');
    }
  }

  async run() {    
    // to support multiple simultaneous connections we have a lookup object from
    // sessionId to transport
    const transports: {[sessionId: string]: SSEServerTransport} = {};

    app.get("/sse", async (_: Request, res: Response) => {
      const transport = new SSEServerTransport('/messages', res);
      transports[transport.sessionId] = transport;
      res.on("close", () => {
        delete transports[transport.sessionId];
      });
      await this.server.connect(transport);
    });

    app.post("/messages", async (req: Request, res: Response) => {
      const sessionId = req.query.sessionId as string;
      const transport = transports[sessionId];
      if (transport) {
        await transport.handlePostMessage(req, res);
      } else {
        res.status(400).send('No transport found for sessionId');
      }
    });

    app.listen(3001);
    console.error('Unreal Engine Analyzer MCP server running on stdio');
  }
}

const server = new UnrealAnalyzerServer();
server.run().catch(console.error);
