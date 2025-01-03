/**
 * Created by Ayelet Technology Private Limited
 */

import Parser, { Query, QueryCapture, SyntaxNode } from 'tree-sitter';
import * as CPP from 'tree-sitter-cpp';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface ClassInfo {
  name: string;
  file: string;
  line: number;
  superclasses: string[];
  interfaces: string[];
  methods: MethodInfo[];
  properties: PropertyInfo[];
  comments: string[];
}

interface MethodInfo {
  name: string;
  returnType: string;
  parameters: ParameterInfo[];
  isVirtual: boolean;
  isOverride: boolean;
  visibility: 'public' | 'protected' | 'private';
  comments: string[];
  line: number;
}

interface ParameterInfo {
  name: string;
  type: string;
  defaultValue?: string;
}

interface PropertyInfo {
  name: string;
  type: string;
  visibility: 'public' | 'protected' | 'private';
  comments: string[];
  line: number;
}

interface CodeReference {
  file: string;
  line: number;
  column: number;
  context: string;
}

interface ClassHierarchy {
  className: string;
  superclasses: ClassHierarchy[];
  interfaces: string[];
}

interface SubsystemInfo {
  name: string;
  mainClasses: string[];
  keyFeatures: string[];
  dependencies: string[];
  sourceFiles: string[];
}

export class UnrealCodeAnalyzer {
  private parser: any;
  private unrealPath: string | null = null;
  private customPath: string | null = null;
  private classCache: Map<string, ClassInfo> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(CPP);
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async initialize(enginePath: string): Promise<void> {
    if (!fs.existsSync(enginePath)) {
      throw new Error('Invalid Unreal Engine path: Directory does not exist');
    }

    const engineDir = path.join(enginePath, 'Engine');
    if (!fs.existsSync(engineDir)) {
      throw new Error('Invalid Unreal Engine path: Engine directory not found');
    }

    this.unrealPath = enginePath;
    this.initialized = true;
    await this.buildInitialCache();
  }

  public async initializeCustomCodebase(customPath: string): Promise<void> {
    if (!fs.existsSync(customPath)) {
      throw new Error('Invalid custom codebase path: Directory does not exist');
    }

    this.customPath = customPath;
    this.initialized = true;
    await this.buildInitialCache();
  }

  private async buildInitialCache(): Promise<void> {
    if (this.unrealPath) {
      // Start with Unreal core classes
      const corePaths = [
        path.join(this.unrealPath, 'Engine/Source/Runtime/Core'),
        path.join(this.unrealPath, 'Engine/Source/Runtime/CoreUObject'),
      ];

      for (const corePath of corePaths) {
        const files = glob.sync('**/*.h', { cwd: corePath, absolute: true });
        for (const file of files) {
          await this.parseFile(file);
        }
      }
    } else if (this.customPath) {
      // Parse all header files in custom codebase
      const files = glob.sync('**/*.h', { cwd: this.customPath, absolute: true });
      for (const file of files) {
        await this.parseFile(file);
      }
    }
  }

  private async parseFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf8');
    const tree = this.parser.parse(content);

    const classQuery = this.parser.createQuery(`
      (class_specifier
        name: (type_identifier) @class_name
        body: (field_declaration_list) @class_body
      ) @class
    `);

    const matches = classQuery.matches(tree.rootNode);
    for (const match of matches) {
      const classNode = match.captures.find((c: QueryCapture) => c.name === 'class')?.node;
      const className = match.captures.find((c: QueryCapture) => c.name === 'class_name')?.node.text;
      
      if (classNode && className) {
        const classInfo = await this.extractClassInfo(classNode, filePath);
        this.classCache.set(className, classInfo);
      }
    }
  }

  private async extractClassInfo(node: Parser.SyntaxNode, filePath: string): Promise<ClassInfo> {
    const classInfo: ClassInfo = {
      name: '',
      file: filePath,
      line: node.startPosition.row + 1,
      superclasses: [],
      interfaces: [],
      methods: [],
      properties: [],
      comments: [],
    };

    // Extract class name
    const nameNode = node.descendantsOfType('type_identifier')[0];
    if (nameNode) {
      classInfo.name = nameNode.text;
    }

    // Extract superclasses
    const baseClause = node.descendantsOfType('base_class_clause')[0];
    if (baseClause) {
      const baseClasses = baseClause.descendantsOfType('type_identifier');
      classInfo.superclasses = baseClasses.map(n => n.text);
    }

    // Extract methods and properties
    const body = node.descendantsOfType('field_declaration_list')[0];
    if (body) {
      for (const child of body.children) {
        if (child.type === 'function_definition') {
          const methodInfo = this.extractMethodInfo(child);
          if (methodInfo) {
            classInfo.methods.push(methodInfo);
          }
        } else if (child.type === 'field_declaration') {
          const propertyInfo = this.extractPropertyInfo(child);
          if (propertyInfo) {
            classInfo.properties.push(propertyInfo);
          }
        }
      }
    }

    return classInfo;
  }

  private extractMethodInfo(node: Parser.SyntaxNode): MethodInfo | null {
    const declarator = node.descendantsOfType('function_declarator')[0];
    if (!declarator) return null;

    const methodInfo: MethodInfo = {
      name: '',
      returnType: '',
      parameters: [],
      isVirtual: false,
      isOverride: false,
      visibility: 'public',
      comments: [],
      line: node.startPosition.row + 1,
    };

    // Extract method name
    const nameNode = declarator.descendantsOfType('identifier')[0];
    if (nameNode) {
      methodInfo.name = nameNode.text;
    }

    // Extract return type
    const returnTypeNode = node.descendantsOfType('type_identifier')[0];
    if (returnTypeNode) {
      methodInfo.returnType = returnTypeNode.text;
    }

    // Extract parameters
    const paramList = declarator.descendantsOfType('parameter_list')[0];
    if (paramList) {
      for (const param of paramList.descendantsOfType('parameter_declaration')) {
        const paramInfo = this.extractParameterInfo(param);
        if (paramInfo) {
          methodInfo.parameters.push(paramInfo);
        }
      }
    }

    return methodInfo;
  }

  private extractParameterInfo(node: Parser.SyntaxNode): ParameterInfo | null {
    const typeNode = node.descendantsOfType('type_identifier')[0];
    const nameNode = node.descendantsOfType('identifier')[0];
    
    if (!typeNode || !nameNode) return null;

    return {
      name: nameNode.text,
      type: typeNode.text,
    };
  }

  private extractPropertyInfo(node: Parser.SyntaxNode): PropertyInfo | null {
    const typeNode = node.descendantsOfType('type_identifier')[0];
    const nameNode = node.descendantsOfType('identifier')[0];
    
    if (!typeNode || !nameNode) return null;

    return {
      name: nameNode.text,
      type: typeNode.text,
      visibility: 'public',
      comments: [],
      line: node.startPosition.row + 1,
    };
  }

  public async analyzeClass(className: string): Promise<ClassInfo> {
    if (!this.initialized) {
      throw new Error('Analyzer not initialized');
    }

    // Check cache first
    if (this.classCache.has(className)) {
      return this.classCache.get(className)!;
    }

    // Search for the class
    const searchPath = this.customPath || this.unrealPath;
    const files = glob.sync('**/*.h', {
      cwd: searchPath!,
      absolute: true,
    });

    for (const file of files) {
      await this.parseFile(file);
      if (this.classCache.has(className)) {
        return this.classCache.get(className)!;
      }
    }

    throw new Error(`Class not found: ${className}`);
  }

  public async findClassHierarchy(
    className: string,
    includeInterfaces: boolean = true
  ): Promise<ClassHierarchy> {
    const classInfo = await this.analyzeClass(className);
    
    const hierarchy: ClassHierarchy = {
      className: classInfo.name,
      superclasses: [],
      interfaces: includeInterfaces ? classInfo.interfaces : [],
    };

    // Recursively build superclass hierarchies
    for (const superclass of classInfo.superclasses) {
      try {
        const superHierarchy = await this.findClassHierarchy(
          superclass,
          includeInterfaces
        );
        hierarchy.superclasses.push(superHierarchy);
      } catch (error) {
        // Superclass might not be found, skip it
        console.error(`Could not analyze superclass: ${superclass}`);
      }
    }

    return hierarchy;
  }

  public async findReferences(
    identifier: string,
    type?: 'class' | 'function' | 'variable'
  ): Promise<CodeReference[]> {
    if (!this.initialized) {
      throw new Error('Analyzer not initialized');
    }

    const references: CodeReference[] = [];
    const searchPath = this.customPath || this.unrealPath;
    const files = glob.sync('**/*.{h,cpp}', {
      cwd: searchPath!,
      absolute: true,
    });

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const tree = this.parser.parse(content);

      // Create appropriate query based on type
      let queryString = '';
      switch (type) {
        case 'class':
          queryString = `(type_identifier) @id (#eq? @id "${identifier}")`;
          break;
        case 'function':
          queryString = `(identifier) @id (#eq? @id "${identifier}")`;
          break;
        case 'variable':
          queryString = `(identifier) @id (#eq? @id "${identifier}")`;
          break;
        default:
          queryString = `(identifier) @id (#eq? @id "${identifier}")`;
          break;
      }

      const query = this.parser.createQuery(queryString);
      const matches = query.matches(tree.rootNode);

      for (const match of matches) {
        const node = match.captures[0].node;
        const startRow = node.startPosition.row;
        const lines = content.split('\n');
        const context = lines
          .slice(Math.max(0, startRow - 2), startRow + 3)
          .join('\n');

        references.push({
          file,
          line: startRow + 1,
          column: node.startPosition.column + 1,
          context,
        });
      }
    }

    return references;
  }

  public async searchCode(
    query: string,
    filePattern: string = '*.{h,cpp}',
    includeComments: boolean = true
  ): Promise<CodeReference[]> {
    if (!this.initialized) {
      throw new Error('Analyzer not initialized');
    }

    const results: CodeReference[] = [];
    const files = glob.sync(`**/${filePattern}`, {
      cwd: this.unrealPath!,
      absolute: true,
    });

    const regex = new RegExp(query, 'gi');

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (regex.test(line)) {
          const context = lines
            .slice(Math.max(0, i - 2), i + 3)
            .join('\n');

          results.push({
            file,
            line: i + 1,
            column: line.indexOf(query) + 1,
            context,
          });
        }
      }
    }

    return results;
  }

  public async analyzeSubsystem(subsystem: string): Promise<SubsystemInfo> {
    if (!this.initialized) {
      throw new Error('Analyzer not initialized');
    }

    const subsystemInfo: SubsystemInfo = {
      name: subsystem,
      mainClasses: [],
      keyFeatures: [],
      dependencies: [],
      sourceFiles: [],
    };

    // Map subsystem names to their directories
    const subsystemDirs: { [key: string]: string } = {
      Rendering: 'Engine/Source/Runtime/RenderCore',
      Physics: 'Engine/Source/Runtime/PhysicsCore',
      Audio: 'Engine/Source/Runtime/AudioCore',
      Networking: 'Engine/Source/Runtime/Networking',
      Input: 'Engine/Source/Runtime/InputCore',
      AI: 'Engine/Source/Runtime/AIModule',
      Animation: 'Engine/Source/Runtime/AnimationCore',
      UI: 'Engine/Source/Runtime/UMG',
    };

    const subsystemDir = subsystemDirs[subsystem];
    if (!subsystemDir) {
      throw new Error(`Unknown subsystem: ${subsystem}`);
    }

    const fullPath = path.join(this.unrealPath!, subsystemDir);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Subsystem directory not found: ${fullPath}`);
    }

    // Get all source files
    subsystemInfo.sourceFiles = glob.sync('**/*.{h,cpp}', {
      cwd: fullPath,
      absolute: true,
    });

    // Analyze each header file to find main classes
    const headerFiles = subsystemInfo.sourceFiles.filter(f => f.endsWith('.h'));
    for (const file of headerFiles) {
      await this.parseFile(file);
      const content = fs.readFileSync(file, 'utf8');
      const tree = this.parser.parse(content);

      // Find class declarations
      const classQuery = this.parser.createQuery(`
        (class_specifier
          name: (type_identifier) @class_name
        ) @class
      `);

      const matches = classQuery.matches(tree.rootNode);
      for (const match of matches) {
        const className = match.captures.find((c: QueryCapture) => c.name === 'class_name')?.node.text;
        if (className) {
          subsystemInfo.mainClasses.push(className);
        }
      }
    }

    return subsystemInfo;
  }
}
