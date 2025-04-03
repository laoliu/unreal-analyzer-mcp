import { z } from "zod";

export class ToolService {
  public toolSchemas = {
    set_unreal_path: {
      name: 'set_unreal_path',
      description: 'Configure the path to Unreal Engine source code directory',
      schema: {
        path: z.string()
          .regex(/^\/[^\0]+$/, "Must be a valid absolute path")
          .describe("Absolute path to UE source directory")
      }
    },
    
    set_custom_codebase: {
      name: 'set_custom_codebase',
      description: 'Set the path to a custom C++ codebase for analysis',
      schema: {
        path: z.string()
          .regex(/^\/[^\0]+$/, "Must be a valid absolute path")
          .describe("Absolute path to custom codebase directory")
      }
    },

    analyze_class: {
      name: 'analyze_class',
      description: 'Retrieve detailed metadata for C++ classes including inheritance and member analysis',
      schema: {
        className: z.string()
          .regex(/^[A-Z]\w+$/, "Class name must follow PascalCase convention")
          .describe("Target class name for analysis")
      }
    },

    find_class_hierarchy: {
      name: 'find_class_hierarchy',
      description: 'Trace inheritance relationships and interface implementations',
      schema: {
        className: z.string()
          .regex(/^[A-Z]\w+$/, "Class name must follow PascalCase convention")
          .describe("Root class for hierarchy analysis"),
        includeImplementedInterfaces: z.boolean()
          .default(true)
          .describe("Flag to include interface implementations")
      }
    },

    find_references: {
      name: 'find_references',
      description: 'Locate all code references for symbols across the codebase',
      schema: {
        identifier: z.string()
          .min(3, "Identifier must be at least 3 characters")
          .describe("Symbol name to search for"),
        type: z.enum(['class', 'function', 'variable'])
          .describe("Type of symbol to locate")
      }
    },

    search_code: {
      name: 'search_code',
      description: 'Perform contextual code search with regex support',
      schema: {
        query: z.string()
          .min(2, "Search query must be at least 2 characters")
          .describe("Regex pattern or literal search string"),
        filePattern: z.string()
          .default("*.{h,cpp}")
          .describe("File extensions to include in search"),
        includeComments: z.boolean()
          .default(true)
          .describe("Include code comments in search scope")
      }
    },

    detect_patterns: {
      name: 'detect_patterns',
      description: 'Identify Unreal Engine anti-patterns and optimization opportunities',
      schema: {
        filePath: z.string()
          .regex(/\.(h|cpp)$/i, "Only C++ header/source files allowed")
          .describe("File to analyze for engine-specific patterns")
      }
    },

    get_best_practices: {
      name: 'get_best_practices',
      description: 'Access UE development guidelines and performance recommendations',
      schema: {
        concept: z.enum([
          'UPROPERTY', 'UFUNCTION', 'Components',
          'Events', 'Replication', 'Blueprints'
        ]).describe("UE development concept to query")
      }
    },

    analyze_subsystem: {
      name: 'analyze_subsystem',
      description: 'Inspect core Unreal Engine subsystems for configuration analysis',
      schema: {
        subsystem: z.enum([
          'Rendering', 'Physics', 'Audio',
          'Networking', 'Input', 'AI',
          'Animation', 'UI'
        ]).describe("Engine subsystem to analyze")
      }
    },

    query_api: {
      name: 'query_api',
      description: 'Search Unreal Engine API documentation with filters',
      schema: {
        query: z.string()
          .min(2, "Search query must be at least 2 characters")
          .describe("API element to search for"),
        category: z.enum(['Object', 'Actor', 'Structure', 'Component', 'Miscellaneous'])
          .optional()
          .describe("API category filter"),
        module: z.string()
          .optional()
          .describe("Engine module filter (e.g., Core, RenderCore)"),
        includeExamples: z.boolean()
          .default(true)
          .describe("Include code samples in results"),
        maxResults: z.number()
          .int()
          .positive()
          .default(10)
          .describe("Maximum number of documentation entries to return")
      }
    }
  };
}