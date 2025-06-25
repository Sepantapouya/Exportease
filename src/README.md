# ExportEase Plugin - Modular Architecture

This document describes the modular architecture of the ExportEase Figma plugin.

## Architecture Overview

The plugin has been refactored from a monolithic `code.ts` file into a modular TypeScript architecture with clear separation of concerns.

## Directory Structure

```
src/
├── main.ts                     # Main entry point
├── types.ts                    # TypeScript type definitions
├── analyzers/
│   └── figmaAnalyzer.ts       # Figma file analysis logic
├── collectors/
│   └── tokenCollector.ts      # Token collection and processing
├── generators/
│   └── formatGenerators.ts    # Output format generators (CSS, JS, Tailwind)
├── services/
│   └── exportService.ts       # Main export orchestration service
└── utils/
    └── stringUtils.ts         # String manipulation utilities
```

## Module Responsibilities

### `main.ts`
- Plugin initialization
- UI message handling
- Entry point coordination
- Error handling at the top level

### `types.ts`
- Comprehensive TypeScript type definitions
- Interface definitions for tokens, analysis results, and UI messages
- Type safety across all modules

### `analyzers/figmaAnalyzer.ts`
- Analysis of Figma variables, styles, and collections
- Detection of available exports
- Detailed collection information gathering

### `collectors/tokenCollector.ts`
- Token collection from Figma variables
- Value resolution (including variable aliases)
- Token analysis and grouping by collection/mode

### `generators/formatGenerators.ts`
- Multiple format generators (CSS, JavaScript, Tailwind)
- Collection-based and comprehensive file generation
- Format-specific value conversion

### `services/exportService.ts`
- Orchestrates the export workflow
- Coordinates between analyzers, collectors, and generators
- Handles both variable and style exports
- Manages file generation and UI communication

### `utils/stringUtils.ts`
- String manipulation utilities
- Variable name conversion for different formats
- File extension handling
- Import instruction generation
- **Intelligent Dynamic Sorting**: Adapts to different naming patterns automatically

## Key Benefits

1. **Separation of Concerns**: Each module has a single responsibility
2. **Type Safety**: Comprehensive TypeScript types across all modules
3. **Maintainability**: Easier to understand and modify individual components
4. **Testability**: Each module can be tested independently
5. **Reusability**: Components can be reused across different contexts
6. **Scalability**: Easy to add new generators or analyzers
7. **Dynamic Adaptation**: Automatically adapts to different Figma file naming patterns

## 🎯 Dynamic Token Sorting

The plugin features an intelligent sorting system that adapts to different naming patterns found in Figma files:

### Supported Patterns
- **Numeric sequences**: `color-1`, `color-2`, `color-10` (not alphabetical `color-1`, `color-10`, `color-2`)
- **Semantic sizes**: `spacing-xs`, `spacing-s`, `spacing-m`, `spacing-l`, `spacing-xl`
- **Multi-part numbers**: `primary-100`, `primary-200`, `secondary-100`
- **Complex patterns**: `color-blue-500-alpha-50` sorted intelligently by each part
- **Mixed systems**: Automatically detects and applies appropriate sorting

### How It Works
1. **Pattern Analysis**: Examines all token names to identify naming patterns
2. **Semantic Detection**: Recognizes size keywords (xs, sm, md, lg, xl, etc.)
3. **Numeric Intelligence**: Handles multiple numbers and complex structures
4. **Adaptive Sorting**: Applies the most appropriate sorting method
5. **Graceful Fallback**: Uses natural alphabetical sorting when no pattern is clear

This ensures that exported tokens are always in logical order regardless of the Figma file's naming convention.

## Development Workflow

1. **Build**: `npm run build` - Compiles TypeScript to JavaScript in `dist/`
2. **Watch**: `npm run watch` - Continuous compilation during development
3. **Clean**: `npm run clean` - Removes compiled files

## Plugin Entry Point

The compiled `dist/main.js` serves as the plugin's entry point (configured in `manifest.json`).

## Adding New Features

### Adding a New Format Generator
1. Add the generator class to `generators/formatGenerators.ts`
2. Extend the format switch statements in `services/exportService.ts`
3. Add appropriate string utilities in `utils/stringUtils.ts`

### Adding New Analysis Capabilities
1. Extend `analyzers/figmaAnalyzer.ts` with new analysis methods
2. Update type definitions in `types.ts`
3. Modify the export service to use new analysis data

### Adding New Collection Methods
1. Extend `collectors/tokenCollector.ts` with new collection logic
2. Update token types and analysis structures
3. Ensure generators can handle new token formats

This modular architecture provides a solid foundation for continued development and feature expansion. 