<!--
Created by Ayelet Technology Private Limited
-->

# Unreal Engine Code Analyzer MCP Server

A Model Context Protocol (MCP) server that provides powerful source code analysis capabilities for Unreal Engine codebases. This tool enables AI assistants like Claude and Cline to deeply understand and analyze Unreal Engine source code.

## Features

- **Class Analysis**: Get detailed information about C++ classes including methods, properties, and inheritance
- **Hierarchy Mapping**: Visualize and understand class inheritance hierarchies
- **Code Search**: Search through code with context-aware results
- **Reference Finding**: Locate all references to classes, functions, or variables
- **Subsystem Analysis**: Analyze major Unreal Engine subsystems like Rendering, Physics, etc.
- **Game Genre Knowledge**: Built-in knowledge base of game genres, features, and implementation patterns
- **Custom Codebase Support**: Analyze any C++ codebase, not just Unreal Engine code

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

Add the following to your Claude desktop configuration file (`%APPDATA%\Claude\claude_desktop_config.json` on Windows):

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

Add the following to your Cline MCP settings file (`%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json` on Windows):

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

## Technical Details

The analyzer is built using:
- TypeScript for type-safe code
- Tree-sitter for robust C++ parsing
- Model Context Protocol SDK for AI assistant integration
- Glob for file pattern matching

Key dependencies:
- @modelcontextprotocol/create-server: ^0.1.0
- tree-sitter: ^0.20.1
- tree-sitter-cpp: ^0.20.0
- glob: ^8.1.0

## Usage

Before using any analysis tools, you must first set either the Unreal Engine source path or a custom codebase path:

### Setting Up Analysis

#### For Unreal Engine Source Code
```typescript
{
  "name": "set_unreal_path",
  "arguments": {
    "path": "/path/to/UnrealEngine/Source"
  }
}
```

#### For Custom C++ Codebases
```typescript
{
  "name": "set_custom_codebase",
  "arguments": {
    "path": "/path/to/your/codebase"
  }
}
```

The custom codebase feature allows you to analyze any C++ project. For example:
- Game engines (Unity, Godot, custom engines)
- Graphics libraries (OpenGL, Vulkan, DirectX)
- Frameworks (Qt, Boost, SFML)
- Any C++ application or library

Example analyzing a custom game engine:
```typescript
// Initialize with custom codebase
{
  "name": "set_custom_codebase",
  "arguments": {
    "path": "/path/to/game-engine"
  }
}

// Analyze engine's renderer class
{
  "name": "analyze_class",
  "arguments": {
    "className": "Renderer"
  }
}

// Find all shader-related code
{
  "name": "search_code",
  "arguments": {
    "query": "shader|glsl|hlsl",
    "filePattern": "*.{h,cpp,hpp}"
  }
}

// Get render system class hierarchy
{
  "name": "find_class_hierarchy",
  "arguments": {
    "className": "RenderSystem",
    "includeImplementedInterfaces": true
  }
}
```

Example analyzing a Qt application:
```typescript
// Initialize with Qt project
{
  "name": "set_custom_codebase",
  "arguments": {
    "path": "/path/to/qt-app"
  }
}

// Find widget class definitions
{
  "name": "search_code",
  "arguments": {
    "query": "class.*:.*public.*QWidget",
    "filePattern": "*.h"
  }
}

// Analyze main window class
{
  "name": "analyze_class",
  "arguments": {
    "className": "MainWindow"
  }
}

// Find signal/slot connections
{
  "name": "find_references",
  "arguments": {
    "identifier": "connect",
    "type": "function"
  }
}
```

### Available Tools

#### 1. Class Analysis
```typescript
// Get detailed information about the AActor class
{
  "name": "analyze_class",
  "arguments": {
    "className": "AActor"
  }
}
```
Example output:
```json
{
  "name": "AActor",
  "properties": [
    {
      "name": "RootComponent",
      "type": "USceneComponent*",
      "access": "protected"
    }
    // ... other properties
  ],
  "methods": [
    {
      "name": "BeginPlay",
      "returnType": "void",
      "access": "protected",
      "virtual": true
    }
    // ... other methods
  ]
}
```

#### 2. Class Hierarchy Analysis
```typescript
// Get the inheritance hierarchy for ACharacter
{
  "name": "find_class_hierarchy",
  "arguments": {
    "className": "ACharacter",
    "includeImplementedInterfaces": true
  }
}
```
Example output:
```json
{
  "class": "ACharacter",
  "inheritsFrom": "APawn",
  "interfaces": ["IMovementModeInterface"],
  "hierarchy": [
    "ACharacter",
    "APawn",
    "AActor",
    "UObject"
  ]
}
```

#### 3. Reference Finding
```typescript
// Find all references to the BeginPlay function
{
  "name": "find_references",
  "arguments": {
    "identifier": "BeginPlay",
    "type": "function"
  }
}
```
Example output:
```json
{
  "references": [
    {
      "file": "Actor.cpp",
      "line": 245,
      "context": "void AActor::BeginPlay() { ... }"
    },
    {
      "file": "Character.cpp",
      "line": 178,
      "context": "Super::BeginPlay();"
    }
  ]
}
```

#### 4. Code Search
```typescript
// Search for physics-related code
{
  "name": "search_code",
  "arguments": {
    "query": "PhysicsHandle",
    "filePattern": "*.h",
    "includeComments": true
  }
}
```
Example output:
```json
{
  "matches": [
    {
      "file": "PhysicsEngine/PhysicsHandleComponent.h",
      "line": 15,
      "context": "class UPhysicsHandleComponent : public UActorComponent",
      "snippet": "// Component used for grabbing and moving physics objects"
    }
  ]
}
```

#### 5. Subsystem Analysis
```typescript
// Analyze the Physics subsystem
{
  "name": "analyze_subsystem",
  "arguments": {
    "subsystem": "Physics"
  }
}
```
Example output:
```json
{
  "name": "Physics",
  "coreClasses": [
    "UPhysicsEngine",
    "FPhysScene",
    "UBodySetup"
  ],
  "keyFeatures": [
    "PhysX integration",
    "Collision detection",
    "Physical materials"
  ],
  "commonUseCases": [
    "Character movement",
    "Vehicle simulation",
    "Destructible environments"
  ]
}
```

### Best Practices

1. Always set either the Unreal Engine path or custom codebase path before using analysis tools
2. Use specific class names when analyzing (e.g., "MyClass" instead of just "Class")
3. Leverage the file pattern parameter in `search_code` to narrow down results
4. Include implemented interfaces when analyzing class hierarchies for complete understanding
5. Use the subsystem analysis tool to get a high-level overview before diving into specific classes (Unreal Engine only)

### Error Handling

The analyzer will throw clear error messages when:
- No codebase path is set (Unreal Engine or custom)
- Provided path does not exist or is inaccessible
- Class or symbol cannot be found in the codebase
- Invalid file patterns are provided
- Syntax errors in search queries or C++ code
- Access to source files is restricted
- Tree-sitter parsing fails for C++ files

### Performance Considerations

- Large codebases may take longer to analyze
- Complex class hierarchies might require more processing time
- Broad search patterns could result in many matches
- Consider using more specific queries for faster results

## Contributing

Contributions are welcome! Please feel free to submit pull requests with improvements to:

- Source code parsing capabilities
- New analysis features
- Performance optimizations
- Documentation improvements
- Test coverage

## License

MIT License - See LICENSE file for details
