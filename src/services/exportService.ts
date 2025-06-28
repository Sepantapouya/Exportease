import { FigmaAnalyzer } from '../analyzers/figmaAnalyzer';
import { TokenCollector } from '../collectors/tokenCollector';
import { 
  CSSGenerator, 
  JSGenerator, 
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
    console.log(`📝 Export format: ${format}`);
    
    try {
      // Step 1: Analyze the Figma file
      console.log('🔍 Step 1: Analyzing Figma file...');
      const { localVariables, allCollections, totalExpectedTokens } = await FigmaAnalyzer.getCollectionDetails();
      console.log(`📊 Found: ${localVariables.length} variables, ${allCollections.length} collections`);
      
      if (!localVariables || localVariables.length === 0) {
        throw new Error('No local variables found in this Figma file. Please create some variables first.');
      }
      
      if (!allCollections || allCollections.length === 0) {
        throw new Error('No variable collections found in this Figma file. Please create some variable collections first.');
      }
      
      // Step 2: Collect all tokens
      console.log('🔄 Step 2: Collecting tokens...');
      const tokens = await TokenCollector.collectAllTokensComprehensively(localVariables, allCollections);
      console.log(`📦 Collected ${tokens.length} tokens`);
      
      if (tokens.length === 0) {
        throw new Error('No tokens could be collected from the variables. Please check that your variables have values.');
      }
      
      console.log(`\n✅ COLLECTION RESULTS:`);
      console.log(`Tokens collected: ${tokens.length} / ${totalExpectedTokens} expected`);
      
      if (tokens.length < totalExpectedTokens * 0.9) {
        console.warn(`⚠️  WARNING: Collected ${tokens.length} tokens but expected ~${totalExpectedTokens}. Some tokens may be missing!`);
      }
      
      // Step 3: Analyze tokens
      console.log('📊 Step 3: Analyzing tokens...');
      const tokenAnalysis = TokenCollector.analyzeTokensComprehensively(tokens);
      console.log(`\n📊 TOKEN ANALYSIS:`);
      console.log(`Collections processed: ${Object.keys(tokenAnalysis.byCollection).length}`);
      console.log(`Token types found: ${Object.keys(tokenAnalysis.byType).join(', ')}`);
      console.log(`Modes processed: ${Object.keys(tokenAnalysis.byMode).join(', ')}`);
      
      if (tokenAnalysis.collections.length === 0) {
        throw new Error('No valid collections found after analysis. Please check your variable structure.');
      }
      
      Object.entries(tokenAnalysis.byCollection).forEach(([collection, count]) => {
        console.log(`  ${collection}: ${count} tokens`);
      });

      // Step 4: Generate files
      console.log('🏗️ Step 4: Generating files...');
      const files = await this.generateFiles(tokenAnalysis, format);
      console.log(`📁 Generated ${Object.keys(files).length} files`);
      
      if (Object.keys(files).length === 0) {
        throw new Error(`No files were generated for format: ${format}. Please check the format is supported.`);
      }
      
      console.log(`\n📁 FILE GENERATION:`);
      console.log(`Generated ${Object.keys(files).length} files:`);
      Object.entries(files).forEach(([filename, content]) => {
        const lines = content.split('\n').length;
        const vars = (content.match(/--[a-zA-Z0-9-]+:/g) || []).length;
        console.log(`  ${filename}: ${Math.round(content.length / 1024)}KB, ${lines} lines, ${vars} CSS variables`);
      });
      
      // Step 5: Send results to UI
      console.log('📤 Step 5: Sending results to UI...');
      this.sendExportResults(files, format);
      console.log('✅ Export completed successfully');
      
    } catch (error) {
      console.error('💥 Variable export failed:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown error type'
      });
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
        type: 'export-ready',
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
        case 'js':
        case 'javascript':
          collectionFiles = JSGenerator.generateCollectionJS(collection);
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
        type: 'export-ready',
        format: format,
        filename: filename,
        content: content
      });
    }
  }

  /**
   * Send files directly for download (bypass preview)
   */
  private static sendDirectDownload(files: GeneratedFiles, format: string): void {
    console.log('📤 Sending direct download...');
    
    if (Object.keys(files).length > 1) {
      // Multiple files - send for direct ZIP download
      figma.ui.postMessage({
        type: 'download-multi-file',
        format: format,
        fileCount: Object.keys(files).length,
        files: files,
        instructions: `${Object.keys(files).length} files ready for download.`
      });
    } else {
      // Single file - send for direct download
      const filename = Object.keys(files)[0];
      const content = files[filename];
      
      figma.ui.postMessage({
        type: 'download-single-file',
        format: format,
        filename: filename,
        content: content
      });
    }
    
    console.log('✅ Direct download message sent to UI');
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
    let content = '';
    
    switch (format.toLowerCase()) {
      case 'css':
        content = '/* Generated Figma Styles */\n:root {\n';
        
        // Process Paint Styles
        if (paintStyles && paintStyles.length > 0) {
          content += '  /* Paint Styles */\n';
          paintStyles.forEach(style => {
            if (!style || !style.name) return;
            
            const name = StringUtils.tokenToCSSVariable(style.name);
            let colorValue = 'rgba(0, 0, 0, 1)'; // fallback
            
            try {
              // Extract color from paint style
              if (style.paints && style.paints.length > 0) {
                const paint = style.paints[0]; // Use first paint
                if (paint.type === 'SOLID' && paint.color) {
                  const r = Math.round((paint.color.r || 0) * 255);
                  const g = Math.round((paint.color.g || 0) * 255);
                  const b = Math.round((paint.color.b || 0) * 255);
                  const a = paint.opacity !== undefined ? paint.opacity : 1;
                  
                  if (a === 1) {
                    colorValue = `rgb(${r}, ${g}, ${b})`;
                  } else {
                    colorValue = `rgba(${r}, ${g}, ${b}, ${a})`;
                  }
                } else if (paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL') {
                  // For gradients, use first color stop
                  if (paint.gradientStops && paint.gradientStops.length > 0) {
                    const stop = paint.gradientStops[0];
                    if (stop.color) {
                      const r = Math.round((stop.color.r || 0) * 255);
                      const g = Math.round((stop.color.g || 0) * 255);
                      const b = Math.round((stop.color.b || 0) * 255);
                      const a = stop.color.a !== undefined ? stop.color.a : 1;
                      colorValue = `rgba(${r}, ${g}, ${b}, ${a})`;
                    }
                  }
                }
              }
            } catch (error) {
              console.warn(`Failed to extract color from paint style "${style.name}":`, error);
            }
            
            content += `  --${name}: ${colorValue};\n`;
          });
        }
        
        // Process Text Styles (font information)
        if (textStyles && textStyles.length > 0) {
          content += '\n  /* Text Styles */\n';
          textStyles.forEach(style => {
            if (!style || !style.name) return;
            
            const name = StringUtils.tokenToCSSVariable(style.name);
            try {
              if (style.fontSize) {
                content += `  --${name}-font-size: ${style.fontSize}px;\n`;
              }
              if (style.fontName && style.fontName.family) {
                content += `  --${name}-font-family: "${style.fontName.family}";\n`;
              }
              if (style.fontName && style.fontName.style) {
                content += `  --${name}-font-style: ${style.fontName.style.toLowerCase()};\n`;
              }
              if (style.lineHeight && typeof style.lineHeight === 'object') {
                if (style.lineHeight.unit === 'PIXELS') {
                  content += `  --${name}-line-height: ${style.lineHeight.value}px;\n`;
                } else if (style.lineHeight.unit === 'PERCENT') {
                  content += `  --${name}-line-height: ${style.lineHeight.value}%;\n`;
                }
              }
            } catch (error) {
              console.warn(`Failed to extract properties from text style "${style.name}":`, error);
            }
          });
        }
        
        // Process Effect Styles (shadows, blurs)
        if (effectStyles && effectStyles.length > 0) {
          content += '\n  /* Effect Styles */\n';
          effectStyles.forEach(style => {
            if (!style || !style.name || !style.effects) return;
            
            const name = StringUtils.tokenToCSSVariable(style.name);
            try {
              style.effects.forEach((effect: any, index: number) => {
                if (effect.type === 'DROP_SHADOW') {
                  const x = effect.offset?.x || 0;
                  const y = effect.offset?.y || 0;
                  const blur = effect.radius || 0;
                  const spread = effect.spread || 0;
                  
                  let shadowColor = 'rgba(0, 0, 0, 0.25)';
                  if (effect.color) {
                    const r = Math.round((effect.color.r || 0) * 255);
                    const g = Math.round((effect.color.g || 0) * 255);
                    const b = Math.round((effect.color.b || 0) * 255);
                    const a = effect.color.a !== undefined ? effect.color.a : 1;
                    shadowColor = `rgba(${r}, ${g}, ${b}, ${a})`;
                  }
                  
                  const shadowValue = `${x}px ${y}px ${blur}px ${spread}px ${shadowColor}`;
                  content += `  --${name}-shadow${index > 0 ? `-${index + 1}` : ''}: ${shadowValue};\n`;
                }
              });
            } catch (error) {
              console.warn(`Failed to extract effects from style "${style.name}":`, error);
            }
          });
        }
        
        content += '}\n';
        break;
        
      case 'js':
      case 'javascript':
        content = '// Generated Figma Styles\nexport const styles = {\n';
        
        // Process Paint Styles for JS
        if (paintStyles && paintStyles.length > 0) {
          paintStyles.forEach(style => {
            if (!style || !style.name) return;
            
            const name = StringUtils.tokenToJSVariable(style.name);
            let colorValue = 'rgba(0, 0, 0, 1)';
            
            try {
              if (style.paints && style.paints.length > 0) {
                const paint = style.paints[0];
                if (paint.type === 'SOLID' && paint.color) {
                  const r = Math.round((paint.color.r || 0) * 255);
                  const g = Math.round((paint.color.g || 0) * 255);
                  const b = Math.round((paint.color.b || 0) * 255);
                  const a = paint.opacity !== undefined ? paint.opacity : 1;
                  colorValue = a === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
                }
              }
            } catch (error) {
              console.warn(`Failed to extract color from paint style "${style.name}":`, error);
            }
            
            content += `  ${name}: '${colorValue}',\n`;
          });
        }
        
        content += '};\n\nexport default styles;\n';
        break;
        
      default:
        throw new Error(`Styles export not implemented for format: ${format}`);
    }
    
    return content;
  }

  /**
   * Preview files that would be generated without actually generating them
   */
  static async previewFiles(format: string): Promise<{
    files: Array<{
      filename: string;
      collection: string;
      mode: string;
      estimated_size: string;
      tokens_count: number;
    }>;
    total_collections: number;
    total_modes: number;
  }> {
    console.log('=== PREVIEWING FILES FOR EXPORT ===');
    
    try {
      // Step 1: Analyze the Figma file
      const { localVariables, allCollections } = await FigmaAnalyzer.getCollectionDetails();
      
      // Step 2: Collect all tokens (lightweight analysis)
      const tokens = await TokenCollector.collectAllTokensComprehensively(localVariables, allCollections);
      
      // Step 3: Analyze token structure
      const tokenAnalysis = TokenCollector.analyzeTokensComprehensively(tokens);
      
      // Step 4: Generate file previews
      const filePreviews: Array<{
        filename: string;
        collection: string;
        mode: string;
        estimated_size: string;
        tokens_count: number;
      }> = [];
      
      const extension = StringUtils.getFileExtension(format);
      
      tokenAnalysis.collections.forEach(collection => {
        collection.modes.forEach(mode => {
          const filename = `${StringUtils.slugify(collection.name)}-${StringUtils.slugify(mode.name)}.${extension}`;
          const tokensCount = mode.tokens.length;
          const estimatedSize = this.estimateFileSize(tokensCount, format);
          
          filePreviews.push({
            filename,
            collection: collection.name,
            mode: mode.name,
            estimated_size: estimatedSize,
            tokens_count: tokensCount
          });
        });
      });
      
      console.log(`📋 File preview generated: ${filePreviews.length} files`);
      
      return {
        files: filePreviews,
        total_collections: tokenAnalysis.collections.length,
        total_modes: tokenAnalysis.collections.reduce((sum, col) => sum + col.modes.length, 0)
      };
      
    } catch (error) {
      console.error('File preview failed:', error);
      throw error;
    }
  }

  /**
   * Export selected files (show preview)
   */
  static async exportSelectedFiles(format: string, selectedFiles: string[]): Promise<void> {
    console.log('=== SELECTED FILES EXPORT STARTED ===');
    console.log(`Selected files: ${selectedFiles.join(', ')}`);
    
    try {
      // Step 1: Get full export data
      const { localVariables, allCollections, totalExpectedTokens } = await FigmaAnalyzer.getCollectionDetails();
      const tokens = await TokenCollector.collectAllTokensComprehensively(localVariables, allCollections);
      const fullTokenAnalysis = TokenCollector.analyzeTokensComprehensively(tokens);
      
      // Step 2: Filter to selected files only
      const filteredAnalysis = this.filterTokenAnalysisBySelection(fullTokenAnalysis, selectedFiles, format);
      
      // Step 3: Generate selected files
      const files = await this.generateFiles(filteredAnalysis, format);
      
      // Step 4: Send as preview (original behavior)
      this.sendExportResults(files, format);
      
    } catch (error) {
      console.error('Selected files export failed:', error);
      figma.ui.postMessage({
        type: 'error',
        message: `Selected files export failed: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Export selected files directly (bypass preview, auto-download)
   */
  static async exportSelectedFilesDirect(format: string, selectedFiles: string[]): Promise<void> {
    console.log('=== DIRECT SELECTED FILES EXPORT STARTED ===');
    console.log(`Selected files: ${selectedFiles.join(', ')}`);
    
    try {
      // Step 1: Get full export data
      const { localVariables, allCollections, totalExpectedTokens } = await FigmaAnalyzer.getCollectionDetails();
      const tokens = await TokenCollector.collectAllTokensComprehensively(localVariables, allCollections);
      const fullTokenAnalysis = TokenCollector.analyzeTokensComprehensively(tokens);
      
      // Step 2: Filter to selected files only
      const filteredAnalysis = this.filterTokenAnalysisBySelection(fullTokenAnalysis, selectedFiles, format);
      
      // Step 3: Generate selected files
      const files = await this.generateFiles(filteredAnalysis, format);
      
      if (Object.keys(files).length === 0) {
        throw new Error('No files were generated from the selected items');
      }
      
      // Step 4: Send directly for download (bypass preview)
      this.sendDirectDownload(files, format);
      
    } catch (error) {
      console.error('Direct selected files export failed:', error);
      figma.ui.postMessage({
        type: 'error',
        message: `Direct export failed: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Filter token analysis to include only selected files
   */
  private static filterTokenAnalysisBySelection(
    tokenAnalysis: TokenAnalysis, 
    selectedFiles: string[], 
    format: string
  ): TokenAnalysis {
    const extension = StringUtils.getFileExtension(format);
    
    const filteredCollections = tokenAnalysis.collections.map(collection => {
      const filteredModes = collection.modes.filter(mode => {
        const expectedFilename = `${StringUtils.slugify(collection.name)}-${StringUtils.slugify(mode.name)}.${extension}`;
        return selectedFiles.includes(expectedFilename);
      });
      
      return {
        ...collection,
        modes: filteredModes
      };
    }).filter(collection => collection.modes.length > 0);
    
    return {
      ...tokenAnalysis,
      collections: filteredCollections
    };
  }

  /**
   * Estimate file size based on token count and format
   */
  private static estimateFileSize(tokenCount: number, format: string): string {
    // Add input validation
    if (!tokenCount || tokenCount < 0) {
      console.warn('Invalid token count for file size estimation:', tokenCount);
      return '0B';
    }
    
    if (!format || typeof format !== 'string') {
      console.warn('Invalid format for file size estimation:', format);
      return '0B';
    }
    let bytesPerToken: number;
    
    switch (format.toLowerCase()) {
      case 'css':
        bytesPerToken = 45; // ~45 bytes per CSS variable
        break;
      case 'js':
      case 'javascript':
        bytesPerToken = 35; // ~35 bytes per JS property
        break;
      case 'tailwind':
        bytesPerToken = 50; // ~50 bytes per Tailwind entry
        break;
      default:
        bytesPerToken = 40;
    }
    
    const estimatedBytes = tokenCount * bytesPerToken + 200; // +200 for headers/boilerplate
    
    if (estimatedBytes < 1024) {
      return `${estimatedBytes}B`;
    } else if (estimatedBytes < 1024 * 1024) {
      return `${Math.round(estimatedBytes / 1024)}KB`;
    } else {
      return `${Math.round(estimatedBytes / (1024 * 1024))}MB`;
    }
  }
} 