<!--
Created by Ayelet Technology Private Limited
-->

# Unreal Engine Code Analyzer MCP Server

A Model Context Protocol (MCP) server that provides powerful source code analysis capabilities for Unreal Engine codebases. This tool enables AI assistants like Claude and Cline to deeply understand and analyze Unreal Engine source code.

## Features

- **Class Analysis**: Get detailed information about Unreal Engine classes including methods, properties, and inheritance
- **Hierarchy Mapping**: Visualize and understand class inheritance hierarchies
- **Code Search**: Search through Unreal Engine code with context-aware results
- **Reference Finding**: Locate all references to classes, functions, or variables
- **Subsystem Analysis**: Analyze major Unreal Engine subsystems like Rendering, Physics, etc.

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/unreal-analyzer
cd unreal-analyzer
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Configuration

### For Claude Desktop App

Add the following to your Claude desktop configuration file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "unreal-analyzer": {
      "command": "node",
      "args": ["path/to/unreal-analyzer/build/index.js"],
      "env": {}
    }
  }
}
```

### For Cline

Add the following to your Cline MCP settings file (`~/.config/cline/mcp_settings.json` on macOS/Linux, `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json` on Windows):

```json
{
  "mcpServers": {
    "unreal-analyzer": {
      "command": "node",
      "args": ["path/to/unreal-analyzer/build/index.js"],
      "env": {}
    }
  }
}
```

## Usage

Once configured, the analyzer provides the following tools to Claude/Cline:

### 1. Set Unreal Engine Path
```typescript
use_mcp_tool({
  server_name: "unreal-analyzer",
  tool_name: "set_unreal_path",
  arguments: {
    path: "/path/to/UnrealEngine"
  }
})
```

### 2. Analyze a Class
```typescript
use_mcp_tool({
  server_name: "unreal-analyzer",
  tool_name: "analyze_class",
  arguments: {
    className: "AActor"
  }
})
```

### 3. Get Class Hierarchy
```typescript
use_mcp_tool({
  server_name: "unreal-analyzer",
  tool_name: "find_class_hierarchy",
  arguments: {
    className: "UPrimitiveComponent",
    includeImplementedInterfaces: true
  }
})
```

### 4. Find References
```typescript
use_mcp_tool({
  server_name: "unreal-analyzer",
  tool_name: "find_references",
  arguments: {
    identifier: "BeginPlay",
    type: "function"
  }
})
```

### 5. Search Code
```typescript
use_mcp_tool({
  server_name: "unreal-analyzer",
  tool_name: "search_code",
  arguments: {
    query: "UPROPERTY\\(.*BlueprintReadWrite.*\\)",
    filePattern: "*.h",
    includeComments: true
  }
})
```

### 6. Analyze Subsystem
```typescript
use_mcp_tool({
  server_name: "unreal-analyzer",
  tool_name: "analyze_subsystem",
  arguments: {
    subsystem: "Rendering"
  }
})
```

## Example Prompts for Claude/Cline

1. "Analyze the AActor class and explain its core functionality"
2. "Show me the inheritance hierarchy of UPrimitiveComponent"
3. "Find all references to BeginPlay in the engine code"
4. "Search for Blueprint-exposed properties in the Physics system"
5. "Explain how the Rendering subsystem is structured"

## Enhancing with Latest Source Code

To enhance the analyzer with more recent Unreal Engine source code:

1. **Update Parser Capabilities**:
   - Add support for newer C++ features in `tree-sitter-cpp`
   - Enhance the query patterns in `analyzer.ts` to capture modern code patterns

2. **Add New Analysis Features**:
   ```typescript
   // In analyzer.ts
   public async analyzeBlueprints(className: string): Promise<BlueprintInfo> {
     // Add blueprint analysis logic
   }

   public async analyzeBuildSystem(target: string): Promise<BuildInfo> {
     // Add build system analysis
   }

   public async analyzePerformance(subsystem: string): Promise<PerformanceMetrics> {
     // Add performance analysis
   }
   ```

3. **Extend Subsystem Coverage**:
   ```typescript
   // Add new subsystems to the analyzer
   const subsystemDirs: { [key: string]: string } = {
     // Existing subsystems...
     Niagara: 'Engine/Source/Runtime/Niagara',
     MetaSounds: 'Engine/Source/Runtime/MetasoundEngine',
     EnhancedInput: 'Engine/Source/Runtime/EnhancedInput',
     // Add more modern subsystems
   };
   ```

4. **Add Modern Feature Analysis**:
   - World Partition system analysis
   - Nanite geometry system analysis
   - Lumen lighting system analysis
   - MetaSounds system analysis
   - Enhanced Input system analysis

5. **Improve Performance**:
   - Implement parallel file processing
   - Add caching for frequently accessed data
   - Optimize AST traversal patterns

## Contributing

Contributions are welcome! Please feel free to submit pull requests with improvements to:

- Source code parsing capabilities
- New analysis features
- Performance optimizations
- Documentation improvements
- Test coverage

## License

MIT License - See LICENSE file for details
