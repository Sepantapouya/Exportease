// ExportEase Plugin - Figma Design Token Exporter
// Author: Sepanta Pouya
// License: MIT

import { FigmaAnalyzer } from './analyzers/figmaAnalyzer';
import { ExportService } from './services/exportService';
import { UIMessage } from './types';

// Show the UI
figma.showUI(__html__, { width: 420, height: 600 });

// Main plugin logic
figma.ui.onmessage = async (msg: UIMessage) => {
  console.log('=== PLUGIN MESSAGE RECEIVED ===');
  console.log('Message type:', msg?.type);
  console.log('Full message:', JSON.stringify(msg, null, 2));
  
  // Validate message structure
  if (!msg || typeof msg !== 'object' || !msg.type) {
    console.error('Invalid message received:', msg);
    figma.ui.postMessage({
      type: 'error',
      message: 'Invalid message format received'
    });
    return;
  }

  try {
    switch (msg.type) {
      case 'export':
        console.log(`🚀 Processing export request: ${msg.format} from ${msg.source}`);
        if (!msg.format || !msg.source) {
          throw new Error('Format and source are required for export');
        }
        await handleExport(msg.format, msg.source);
        console.log(`✅ Export request completed: ${msg.format} from ${msg.source}`);
        break;
        
      case 'preview-files':
        console.log(`📋 Processing preview request: ${msg.format} from ${msg.source}`);
        if (!msg.format || !msg.source) {
          throw new Error('Format and source are required for preview');
        }
        await handleFilePreview(msg.format, msg.source);
        console.log(`✅ Preview request completed: ${msg.format} from ${msg.source}`);
        break;
        
      case 'export-selected':
        console.log(`📦 Processing selected export: ${msg.format} from ${msg.source}, files: ${msg.selectedFiles?.length}`);
        if (!msg.format || !msg.source || !msg.selectedFiles) {
          throw new Error('Format, source, and selectedFiles are required for selected export');
        }
        await handleSelectedExport(msg.format, msg.source, msg.selectedFiles);
        console.log(`✅ Selected export completed: ${msg.format} from ${msg.source}`);
        break;
        
      case 'export-selected-direct':
        console.log(`🚀 Processing direct selected export: ${msg.format} from ${msg.source}, files: ${msg.selectedFiles?.length}`);
        if (!msg.format || !msg.source || !msg.selectedFiles) {
          throw new Error('Format, source, and selectedFiles are required for direct selected export');
        }
        await handleSelectedExportDirect(msg.format, msg.source, msg.selectedFiles);
        console.log(`✅ Direct selected export completed: ${msg.format} from ${msg.source}`);
        break;
        
      case 'cancel-export':
        console.log('❌ Export canceled by user');
        break;
        
      case 'check-exports':
        console.log('🔍 Re-checking exports...');
        await init();
        console.log('✅ Export check completed');
        break;
        
      default:
        console.warn(`❓ Unknown message type: ${msg.type}`);
        figma.ui.postMessage({
          type: 'error',
          message: `Unknown action: ${msg.type}`
        });
        break;
    }
  } catch (error) {
    console.error(`💥 Error handling message type "${msg.type}":`, error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    figma.ui.postMessage({
      type: 'error',
      message: `Operation failed: ${error instanceof Error ? error.message : String(error)}`
    });
  }
};

// Handle export requests
async function handleExport(format: string, source: string): Promise<void> {
  console.log(`Starting export: ${format} from ${source}`);
  
  if (source === 'variables') {
    await ExportService.exportVariables(format);
  } else if (source === 'styles') {
    await ExportService.exportStyles(format);
  } else {
    throw new Error(`Unknown export source: ${source}`);
  }
}

// Handle file preview requests
async function handleFilePreview(format: string, source: string): Promise<void> {
  console.log(`Starting file preview: ${format} from ${source}`);
  
  if (source === 'variables') {
    const preview = await ExportService.previewFiles(format);
    figma.ui.postMessage({
      type: 'file-preview',
      format,
      source,
      ...preview
    });
  } else {
    throw new Error(`File preview not supported for source: ${source}`);
  }
}

// Handle selected files export
async function handleSelectedExport(format: string, source: string, selectedFiles: string[]): Promise<void> {
  console.log(`Starting selected export: ${format} from ${source}`);
  console.log(`Selected files: ${selectedFiles.join(', ')}`);
  
  if (source === 'variables') {
    await ExportService.exportSelectedFiles(format, selectedFiles);
  } else {
    throw new Error(`Selected export not supported for source: ${source}`);
  }
}

// Handle direct selected files export (skip preview, auto-download)
async function handleSelectedExportDirect(format: string, source: string, selectedFiles: string[]): Promise<void> {
  console.log(`Starting direct selected export: ${format} from ${source}`);
  console.log(`Selected files: ${selectedFiles.join(', ')}`);
  
  if (source === 'variables') {
    await ExportService.exportSelectedFilesDirect(format, selectedFiles);
  } else {
    throw new Error(`Direct selected export not supported for source: ${source}`);
  }
}

// Initialize plugin
async function init(): Promise<void> {
  try {
    const result = await FigmaAnalyzer.analyzeAvailableExports();
    figma.ui.postMessage({
      type: 'export-status',
      hasExports: result.hasExports,
      stylesCount: result.stylesCount,
      variablesCount: result.variablesCount,
      breakdown: result.breakdown
    });
  } catch (error) {
    console.error('Initialization error:', error);
    figma.ui.postMessage({
      type: 'error',
      message: `Failed to analyze exports: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

// Start the plugin
init(); 