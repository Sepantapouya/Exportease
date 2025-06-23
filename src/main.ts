// ExportEase Plugin - Figma Design Token Exporter
// Author: Sepanta Pouya
// License: MIT

import { FigmaAnalyzer } from './analyzers/figmaAnalyzer';
import { ExportService } from './services/exportService';
import { UIMessage } from './types';

// Show the UI
figma.showUI(__html__, { width: 320, height: 600 });

// Main plugin logic
figma.ui.onmessage = async (msg: UIMessage) => {
  if (msg.type === 'export') {
    try {
      await handleExport(msg.format, msg.source);
    } catch (error) {
      console.error('Export error:', error);
      figma.ui.postMessage({
        type: 'error',
        message: `Export failed: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  } else if (msg.type === 'cancel-export') {
    // Handle export cancellation
    console.log('Export canceled by user');
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