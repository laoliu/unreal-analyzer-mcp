#!/usr/bin/env node
/**
 * Created by Ayelet Technology Private Limited
 */

import { Server, StdioServerTransport } from '@modelcontextprotocol/create-server';
import type { CallToolRequest, ListToolsRequest } from '@modelcontextprotocol/create-server';
import { UnrealCodeAnalyzer } from './analyzer.js';
import { GAME_GENRES, GameGenre, GenreFlag } from './types/game-genres.js';

class UnrealAnalyzerServer {
  private server: Server;
  private analyzer: UnrealCodeAnalyzer;

  constructor() {
    this.server = new Server(
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
    
    this.server.onerror = (error: Error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler<ListToolsRequest>('list_tools', async () => ({
      tools: [
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
        },
      ],
    }));

    this.server.setRequestHandler<CallToolRequest>('call_tool', async (request: CallToolRequest) => {
      // Only check for initialization for analysis tools
      const analysisTools = ['analyze_class', 'find_class_hierarchy', 'find_references', 'search_code', 'analyze_subsystem'];
      if (analysisTools.includes(request.params.name) && !this.analyzer.isInitialized() && 
          request.params.name !== 'set_unreal_path' && request.params.name !== 'set_custom_codebase') {
        throw new Error('No codebase initialized. Use set_unreal_path or set_custom_codebase first.');
      }

      switch (request.params.name) {
        case 'set_unreal_path':
          return this.handleSetUnrealPath(request.params.arguments);
        case 'set_custom_codebase':
          return this.handleSetCustomCodebase(request.params.arguments);
        case 'analyze_class':
          return this.handleAnalyzeClass(request.params.arguments);
        case 'find_class_hierarchy':
          return this.handleFindClassHierarchy(request.params.arguments);
        case 'find_references':
          return this.handleFindReferences(request.params.arguments);
        case 'search_code':
          return this.handleSearchCode(request.params.arguments);
        case 'analyze_subsystem':
          return this.handleAnalyzeSubsystem(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Unreal Engine Analyzer MCP server running on stdio');
  }
}

const server = new UnrealAnalyzerServer();
server.run().catch(console.error);
