import { FigmaAnalyzer } from '../analyzers/figmaAnalyzer';
import { TokenCollector } from '../collectors/tokenCollector';
import { 
  CSSGenerator, 
  SCSSGenerator, 
  JSONGenerator, 
  JSGenerator, 
  DartGenerator, 
  TailwindGenerator 
} from '../generators/formatGenerators';
import { GeneratedFiles, TokenAnalysis } from '../types';
import { StringUtils } from '../utils/stringUtils';

export class ExportService {
  
  /**
   * Handle variable export with full modular workflow
   */
  static async exportVariables(format: string): Promise<void> {
    console.log('=== COMPLETE VARIABLE EXPORT STARTED (ASYNC API) ===');
    
    try {
      // Step 1: Analyze the Figma file
      const { localVariables, allCollections, totalExpectedTokens } = await FigmaAnalyzer.getCollectionDetails();
      
      // Step 2: Collect all tokens
      const tokens = await TokenCollector.collectAllTokensComprehensively(localVariables, allCollections);
      
      console.log(`\n✅ COLLECTION RESULTS:`);
      console.log(`Tokens collected: ${tokens.length} / ${totalExpectedTokens} expected`);
      
      if (tokens.length < totalExpectedTokens * 0.9) {
        console.warn(`⚠️  WARNING: Collected ${tokens.length} tokens but expected ~${totalExpectedTokens}. Some tokens may be missing!`);
      }
      
      // Step 3: Analyze tokens
      const tokenAnalysis = TokenCollector.analyzeTokensComprehensively(tokens);
      console.log(`\n📊 TOKEN ANALYSIS:`);
      console.log(`Collections processed: ${Object.keys(tokenAnalysis.byCollection).length}`);
      console.log(`Token types found: ${Object.keys(tokenAnalysis.byType).join(', ')}`);
      console.log(`Modes processed: ${Object.keys(tokenAnalysis.byMode).join(', ')}`);
      
      Object.entries(tokenAnalysis.byCollection).forEach(([collection, count]) => {
        console.log(`  ${collection}: ${count} tokens`);
      });

      // Step 4: Generate files
      const files = await this.generateFiles(tokenAnalysis, format);
      
      console.log(`\n📁 FILE GENERATION:`);
      console.log(`Generated ${Object.keys(files).length} files:`);
      Object.entries(files).forEach(([filename, content]) => {
        const lines = content.split('\n').length;
        const vars = (content.match(/--[a-zA-Z0-9-]+:/g) || []).length;
        console.log(`  ${filename}: ${Math.round(content.length / 1024)}KB, ${lines} lines, ${vars} CSS variables`);
      });
      
      // Step 5: Send results to UI
      this.sendExportResults(files, format);
      
    } catch (error) {
      console.error('Variable export failed:', error);
      figma.ui.postMessage({
        type: 'error',
        message: `Variable export failed: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Handle styles export
   */
  static async exportStyles(format: string): Promise<void> {
    console.log('=== STYLES EXPORT STARTED ===');
    
    try {
      const localPaintStyles = await figma.getLocalPaintStylesAsync();
      const localTextStyles = await figma.getLocalTextStylesAsync();
      const localEffectStyles = await figma.getLocalEffectStylesAsync();
      
      if (localPaintStyles.length === 0 && localTextStyles.length === 0 && localEffectStyles.length === 0) {
        throw new Error('No local styles found in this Figma file');
      }
      
      const content = await this.generateStylesFile(localPaintStyles, localTextStyles, localEffectStyles, format);
      const filename = `styles.${StringUtils.getFileExtension(format)}`;
      
      figma.ui.postMessage({
        type: 'export-complete',
        format: format,
        filename: filename,
        content: content
      });
      
      console.log('✅ Styles export completed successfully');
      
    } catch (error) {
      console.error('Styles export failed:', error);
      figma.ui.postMessage({
        type: 'error',
        message: `Styles export failed: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Generate files using appropriate generators
   */
  private static async generateFiles(tokenAnalysis: TokenAnalysis, format: string): Promise<GeneratedFiles> {
    const allFiles: GeneratedFiles = {};
    
    // Generate collection-based files
    for (const collection of tokenAnalysis.collections) {
      let collectionFiles: GeneratedFiles = {};
      
      switch (format.toLowerCase()) {
        case 'css':
          collectionFiles = CSSGenerator.generateCollectionCSS(collection);
          break;
        case 'scss':
        case 'sass':
          collectionFiles = SCSSGenerator.generateCollectionSCSS(collection);
          break;
        case 'json':
          collectionFiles = JSONGenerator.generateCollectionJSON(collection);
          break;
        case 'js':
        case 'javascript':
          collectionFiles = JSGenerator.generateCollectionJS(collection);
          break;
        case 'dart':
          collectionFiles = DartGenerator.generateCollectionDart(collection);
          break;
        case 'tailwind':
          collectionFiles = TailwindGenerator.generateCollectionTailwind(collection);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
      
      // Merge collection files into all files
      Object.assign(allFiles, collectionFiles);
    }
    
    // Only generate files based on actual Figma collections and modes
    // No artificial "comprehensive" files
    
    return allFiles;
  }

  /**
   * Send export results to UI - files organized by Figma collections and modes
   */
  private static sendExportResults(files: GeneratedFiles, format: string): void {
    if (Object.keys(files).length > 1) {
      // Multiple files (collections/modes) - send them all
      figma.ui.postMessage({
        type: 'export-multi-file',
        format: format,
        fileCount: Object.keys(files).length,
        files: files,
        instructions: `${Object.keys(files).length} files generated based on your Figma collections and modes.`
      });
    } else {
      // Single file
      const filename = Object.keys(files)[0];
      const content = files[filename];
      
      figma.ui.postMessage({
        type: 'export-complete',
        format: format,
        filename: filename,
        content: content
      });
    }
  }

  /**
   * Generate styles file (legacy functionality)
   */
  private static async generateStylesFile(
    paintStyles: any[], 
    textStyles: any[], 
    effectStyles: any[], 
    format: string
  ): Promise<string> {
    // This is a simplified version - could be modularized further
    let content = '';
    
    switch (format.toLowerCase()) {
      case 'css':
        content = '/* Generated Figma Styles */\n:root {\n';
        paintStyles.forEach(style => {
          const name = StringUtils.tokenToCSSVariable(style.name);
          // Simplified color extraction - would need proper implementation
          content += `  --${name}: /* ${style.name} */;\n`;
        });
        content += '}\n';
        break;
        
      case 'json':
        const stylesObject = {
          _metadata: {
            generator: 'ExportEase Plugin',
            type: 'styles',
            generated: new Date().toISOString()
          },
          paintStyles: paintStyles.map(style => ({ name: style.name, id: style.id })),
          textStyles: textStyles.map(style => ({ name: style.name, id: style.id })),
          effectStyles: effectStyles.map(style => ({ name: style.name, id: style.id }))
        };
        content = JSON.stringify(stylesObject, null, 2);
        break;
        
      default:
        throw new Error(`Styles export not implemented for format: ${format}`);
    }
    
    return content;
  }
} 