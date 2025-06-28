export interface ExportFormat {
  extension: string;
  name: string;
}

export interface ExportMessage {
  type: 'export';
  format: string;
  source: string;
}

export interface CancelMessage {
  type: 'cancel-export';
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export interface ExportStatusMessage {
  type: 'export-status';
  hasExports: boolean;
  stylesCount: number;
  variablesCount: number;
  breakdown: ExportBreakdown;
}

export interface ExportBreakdown {
  paintStyles: number;
  textStyles: number;
  effectStyles: number;
  variables: number;
}

export interface Token {
  name: string;
  value: string;
  type: string;
  collection: string;
  mode: string;
  resolvedType: string;
  originalValue?: any;
}

export interface TokenAnalysis {
  byCollection: Record<string, number>;
  byType: Record<string, number>;
  byMode: Record<string, number>;
  collections: CollectionGroup[];
}

export interface CollectionGroup {
  name: string;
  modes: ModeGroup[];
}

export interface ModeGroup {
  name: string;
  tokens: Token[];
}

export interface GeneratedFiles {
  [filename: string]: string;
}

export interface AnalysisResult {
  hasExports: boolean;
  stylesCount: number;
  variablesCount: number;
  breakdown: ExportBreakdown;
}

export interface UIMessage {
  type: 'export' | 'preview-files' | 'export-selected' | 'export-selected-direct' | 'cancel-export' | 'check-exports';
  format?: string;
  source?: string;
  selectedFiles?: string[];
}

export interface FilePreviewMessage {
  type: 'file-preview';
  format: string;
  source: string;
  files: Array<{
    filename: string;
    collection: string;
    mode: string;
    estimated_size: string;
    tokens_count: number;
  }>;
  total_collections: number;
  total_modes: number;
}

export type PluginResponse = ErrorMessage | ExportStatusMessage | ExportMultiFileMessage | ExportSingleFileMessage | FilePreviewMessage;

export interface ExportMultiFileMessage {
  type: 'export-multi-file';
  format: string;
  fileCount: number;
  primaryFile?: string; // Optional since we don't use primary files anymore
  files: GeneratedFiles;
  instructions: string;
}

export interface ExportSingleFileMessage {
  type: 'export-ready';
  format: string;
  filename: string;
  content: string;
} 