export class StringUtils {
  /**
   * Convert string to slug format (lowercase, dashes, no special chars)
   */
  static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Convert token name to CSS variable format
   */
  static tokenToCSSVariable(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Convert token name to JavaScript variable format
   */
  static tokenToJSVariable(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^[^a-zA-Z_]/, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  /**
   * Convert token name to Tailwind variable format
   */
  static tokenToTailwindVariable(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Convert string to PascalCase
   */
  static toPascalCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Convert string to camelCase
   */
  static toCamelCase(str: string): string {
    const pascalCase = this.toPascalCase(str);
    return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
  }

  /**
   * Get file extension for a given format
   */
  static getFileExtension(format: string): string {
    const extensions: Record<string, string> = {
      css: 'css',
      js: 'js',
      javascript: 'js',
      tailwind: 'js'
    };
    
    return extensions[format.toLowerCase()] || 'txt';
  }

  /**
   * Generate import instructions for multiple files
   */
  static generateImportInstructions(files: Record<string, string>, format: string): string {
    const fileNames = Object.keys(files);
    const primaryFile = this.findPrimaryFile(files);
    
    let instructions = `📁 Generated ${fileNames.length} files:\n\n`;
    
    fileNames.forEach(filename => {
      instructions += `• ${filename}${filename === primaryFile ? ' (primary)' : ''}\n`;
    });
    
    instructions += `\n💡 Import instructions:\n`;
    
    switch (format.toLowerCase()) {
      case 'css':
        instructions += `Import in HTML:\n`;
        fileNames.forEach(filename => {
          instructions += `<link rel="stylesheet" href="${filename}">\n`;
        });
        break;
        
      case 'js':
        instructions += `Import in JavaScript:\n`;
        fileNames.forEach(filename => {
          const moduleName = this.toCamelCase(filename.replace('.js', ''));
          instructions += `import ${moduleName} from './${filename}';\n`;
        });
        break;
        
      default:
        instructions += `Use the files as appropriate for your ${format} setup.\n`;
        break;
    }
    
    return instructions;
  }

  /**
   * Dynamic intelligent sorting that adapts to different naming patterns
   * Uses multi-stage sorting for optimal results across all use cases
   */
  static dynamicSort(tokens: string[]): string[] {
    if (tokens.length === 0) return tokens;
    
    // STAGE 1: Group tokens by semantic hierarchy
    const groups = this.groupTokensBySemantics(tokens);
    
    // STAGE 2: Sort each group using appropriate algorithm
    const sortedGroups = groups.map(group => ({
      ...group,
      tokens: this.alphanumericSort(group.tokens)
    }));
    
    // STAGE 3: Sort groups themselves and flatten
    sortedGroups.sort((a, b) => this.alphanumericSort([a.prefix, b.prefix])[0] === a.prefix ? -1 : 1);
    
    return sortedGroups.flatMap(group => group.tokens);
  }
  
  /**
   * Group tokens by their semantic prefixes
   */
  private static groupTokensBySemantics(tokens: string[]): Array<{prefix: string, tokens: string[]}> {
    const groups = new Map<string, string[]>();
    
    tokens.forEach(token => {
      // Extract semantic prefix (first 1-2 parts before numbers/states)
      const parts = token.split(/[-_]/);
      let prefix = parts[0];
      
      // For hierarchical tokens, include more context
      if (parts.length > 3) {
        // Check if second part is semantic (not a number)
        if (parts[1] && !/^\d/.test(parts[1])) {
          prefix = `${parts[0]}-${parts[1]}`;
        }
        // For very complex tokens, add third part if semantic
        if (parts.length > 4 && parts[2] && !/^\d/.test(parts[2])) {
          prefix = `${parts[0]}-${parts[1]}-${parts[2]}`;
        }
      }
      
      if (!groups.has(prefix)) {
        groups.set(prefix, []);
      }
      groups.get(prefix)!.push(token);
    });
    
    return Array.from(groups.entries()).map(([prefix, tokens]) => ({
      prefix,
      tokens
    }));
  }
  
  /**
   * Proven alphanumeric sorting algorithm (based on Alphanum algorithm)
   * Handles numbers naturally: color-1, color-2, color-10 (not color-1, color-10, color-2)
   */
  private static alphanumericSort(tokens: string[]): string[] {
    return tokens.sort((a, b) => {
      // Split strings into chunks of letters and numbers
      const chunksA = this.chunkify(a);
      const chunksB = this.chunkify(b);
      
      const maxChunks = Math.max(chunksA.length, chunksB.length);
      
      for (let i = 0; i < maxChunks; i++) {
        const chunkA = chunksA[i] || '';
        const chunkB = chunksB[i] || '';
        
        if (chunkA !== chunkB) {
          // Try to parse as numbers
          const numA = parseFloat(chunkA);
          const numB = parseFloat(chunkB);
          
          // If both are valid numbers, compare numerically
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          
          // Otherwise compare as strings (case-insensitive)
          return chunkA.toLowerCase().localeCompare(chunkB.toLowerCase());
        }
      }
      
      return chunksA.length - chunksB.length;
    });
  }
  
  /**
   * Split string into alternating letter and number chunks
   * "color-10-alpha" → ["color-", "10", "-alpha"]
   */
  private static chunkify(str: string): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    let isNumber = false;
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const charIsNumber = /\d/.test(char);
      
      // If type changes (number ↔ text), start new chunk
      if (i > 0 && charIsNumber !== isNumber) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      
      currentChunk += char;
      isNumber = charIsNumber;
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }
  
  /**
   * Analyze token structure to determine the best sorting approach
   */
  private static analyzeTokenStructure(tokens: string[]) {
    const structure = {
      isHierarchical: false,
      hasSemanticSizes: false,
      hasNumericSequences: false,
      isSimpleNumeric: false,
      averageDepth: 0,
      commonPrefixes: new Set<string>(),
      maxDepth: 0
    };
    
    let totalDepth = 0;
    let simpleNumericCount = 0;
    let complexHierarchicalCount = 0;
    const prefixGroups = new Map<string, number>();
    
    tokens.forEach(token => {
      // Calculate semantic depth (excluding numbers as structural separators)
      const withoutNumbers = token.replace(/\d+/g, 'NUM');
      const semanticDepth = (withoutNumbers.match(/[-_]/g) || []).length;
      totalDepth += semanticDepth;
      structure.maxDepth = Math.max(structure.maxDepth, semanticDepth);
      
      // Check if it's a simple numeric pattern like "color-blue-1", "spacing-100", "border-radius-050"
      // This includes patterns with 2-3 text parts followed by numbers
      const simpleNumericPattern = /^[a-zA-Z]+[-_][a-zA-Z]+[-_]*[a-zA-Z]*[-_]\d+$/;
      const isSimpleNumeric = simpleNumericPattern.test(token);
      
      if (isSimpleNumeric) {
        simpleNumericCount++;
      }
      
      // Check for complex hierarchical patterns (more than just base-category-number)
      const parts = token.split(/[-_]/);
      const nonNumericParts = parts.filter(part => !/^\d+$/.test(part));
      
      if (nonNumericParts.length > 3) {
        complexHierarchicalCount++;
        // Analyze prefixes for truly hierarchical patterns
        const prefix = nonNumericParts.slice(0, 3).join('-');
        prefixGroups.set(prefix, (prefixGroups.get(prefix) || 0) + 1);
        structure.commonPrefixes.add(prefix);
      }
      
      // Check for semantic sizes
      const lowerToken = token.toLowerCase();
      const semanticSizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'small', 'medium', 'large', 'tiny', 'huge'];
      if (semanticSizes.some(size => lowerToken.includes(size))) {
        structure.hasSemanticSizes = true;
      }
      
      // Check for numeric sequences
      if (/\d+/.test(token)) {
        structure.hasNumericSequences = true;
      }
    });
    
    structure.averageDepth = totalDepth / tokens.length;
    
    // Determine token type priority:
    // 1. Simple numeric (color-blue-1, spacing-100) - most common design token pattern
    // More lenient threshold - even 50% simple numeric tokens should use numeric sorting
    structure.isSimpleNumeric = simpleNumericCount > tokens.length * 0.4;
    
    // 2. Complex hierarchical (color-bg-fill-brand-hover) - semantic design systems
    structure.isHierarchical = !structure.isSimpleNumeric && 
                              complexHierarchicalCount > tokens.length * 0.6 && 
                              prefixGroups.size > 1 && 
                              Array.from(prefixGroups.values()).some(count => count > 2);
    
    return structure;
  }
  
  /**
   * Sort hierarchical tokens by semantic groups
   */
  private static sortHierarchicalTokens(tokens: string[], structure: any): string[] {
    // Group tokens by their semantic hierarchy
    const groups = new Map<string, string[]>();
    
    tokens.forEach(token => {
      const parts = token.split(/[-_]/);
      
      // Create hierarchical grouping key
      let groupKey = '';
      if (parts.length >= 3) {
        // For tokens like "color-bg-fill-fill-brand-active"
        // Group by "color-bg-fill" or similar base structure
        groupKey = parts.slice(0, Math.min(3, parts.length - 1)).join('-');
      } else {
        groupKey = parts[0] || token;
      }
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(token);
    });
    
    // Sort groups by their keys
    const sortedGroupKeys = Array.from(groups.keys()).sort((a, b) => this.customNaturalSort(a, b));
    
    // Sort tokens within each group and flatten
    const result: string[] = [];
    sortedGroupKeys.forEach(groupKey => {
      const groupTokens = groups.get(groupKey)!;
      const sortedGroupTokens = groupTokens.sort((a, b) => this.compareHierarchicalTokens(a, b));
      result.push(...sortedGroupTokens);
    });
    
    return result;
  }
  
  /**
   * Compare two hierarchical tokens part by part
   */
  private static compareHierarchicalTokens(a: string, b: string): number {
    const aParts = a.split(/[-_]/);
    const bParts = b.split(/[-_]/);
    
    // First, compare by base structure (all parts except the last 1-2)
    const aBase = aParts.slice(0, -2).join('-');
    const bBase = bParts.slice(0, -2).join('-');
    
    if (aBase !== bBase) {
      return this.customNaturalSort(aBase, bBase);
    }
    
    // Then compare by semantic importance of states/modifiers
    const stateOrder = [
      '', 'base', 'default',
      'hover', 'active', 'focus', 'selected', 'pressed',
      'disabled', 'loading',
      'primary', 'secondary', 'tertiary',
      'success', 'warning', 'error', 'critical', 'caution', 'info',
      'inverse', 'brand', 'emphasis', 'magic',
      'transparent'
    ];
    
    // Get the modifier parts (last 1-2 parts)
    const aModifiers = aParts.slice(-2);
    const bModifiers = bParts.slice(-2);
    
    // Compare modifier by modifier
    for (let i = 0; i < Math.max(aModifiers.length, bModifiers.length); i++) {
      const aMod = aModifiers[i] || '';
      const bMod = bModifiers[i] || '';
      
      const aIndex = stateOrder.findIndex(state => aMod.includes(state));
      const bIndex = stateOrder.findIndex(state => bMod.includes(state));
      
      if (aIndex !== -1 && bIndex !== -1 && aIndex !== bIndex) {
        return aIndex - bIndex;
      } else if (aIndex !== -1 && bIndex === -1) {
        return -1;
      } else if (aIndex === -1 && bIndex !== -1) {
        return 1;
      } else {
        const comparison = this.customNaturalSort(aMod, bMod);
        if (comparison !== 0) return comparison;
      }
    }
    
    return this.customNaturalSort(a, b);
  }
  
  /**
   * Sort simple numeric tokens like color-blue-1, spacing-100, etc.
   */
  private static sortSimpleNumericTokens(tokens: string[]): string[] {
    return tokens.sort((a, b) => {
      // Split into parts
      const aParts = a.split(/[-_]/);
      const bParts = b.split(/[-_]/);
      
      // Find the position of the first numeric part
      let aNumIndex = aParts.findIndex(part => /^\d+$/.test(part));
      let bNumIndex = bParts.findIndex(part => /^\d+$/.test(part));
      
      // Compare text parts before the first number
      const aTextParts = aNumIndex >= 0 ? aParts.slice(0, aNumIndex) : aParts;
      const bTextParts = bNumIndex >= 0 ? bParts.slice(0, bNumIndex) : bParts;
      
      // Compare text parts first
      for (let i = 0; i < Math.max(aTextParts.length, bTextParts.length); i++) {
        const aPart = aTextParts[i] || '';
        const bPart = bTextParts[i] || '';
        
        if (aPart !== bPart) {
          return aPart.localeCompare(bPart);
        }
      }
      
      // If text parts are the same, compare numeric parts
      if (aNumIndex >= 0 && bNumIndex >= 0) {
        // Both have numbers - compare all numeric parts
        const aNumParts = aParts.slice(aNumIndex).filter(part => /^\d+$/.test(part));
        const bNumParts = bParts.slice(bNumIndex).filter(part => /^\d+$/.test(part));
        
        for (let i = 0; i < Math.max(aNumParts.length, bNumParts.length); i++) {
          const aNum = parseInt(aNumParts[i] || '0', 10);
          const bNum = parseInt(bNumParts[i] || '0', 10);
          
          if (aNum !== bNum) {
            return aNum - bNum;
          }
        }
        
        // If all numbers are equal, compare remaining text parts
        const aRemaining = aParts.slice(aNumIndex).filter(part => !/^\d+$/.test(part));
        const bRemaining = bParts.slice(bNumIndex).filter(part => !/^\d+$/.test(part));
        
        for (let i = 0; i < Math.max(aRemaining.length, bRemaining.length); i++) {
          const aPart = aRemaining[i] || '';
          const bPart = bRemaining[i] || '';
          
          if (aPart !== bPart) {
            return aPart.localeCompare(bPart);
          }
        }
      } else if (aNumIndex >= 0) {
        return 1; // tokens with numbers come after those without
      } else if (bNumIndex >= 0) {
        return -1; // tokens without numbers come before those with
      }
      
      // Fall back to natural sort
      return this.customNaturalSort(a, b);
    });
  }
  
  /**
   * Sort tokens with semantic sizes
   */
  private static sortSemanticTokens(tokens: string[]): string[] {
    return tokens.sort((a, b) => {
      const semanticComparison = this.compareSemanticSizes(a, b);
      if (semanticComparison !== 0) return semanticComparison;
      return this.customNaturalSort(a, b);
    });
  }
  
  /**
   * Sort tokens with numeric sequences
   */
  private static sortNumericTokens(tokens: string[]): string[] {
    return tokens.sort((a, b) => {
      const numericComparison = this.compareNumericSequences(a, b);
      if (numericComparison !== 0) return numericComparison;
      return this.customNaturalSort(a, b);
    });
  }
  

  
  /**
   * Compare tokens with semantic size names
   */
  private static compareSemanticSizes(a: string, b: string): number {
    const sizeOrder = ['xs', 'sm', 's', 'md', 'm', 'lg', 'l', 'xl', 'xxl', 'xxxl', 'tiny', 'small', 'medium', 'large', 'huge'];
    
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    // Find size indicators in both strings
    const aSize = sizeOrder.find(size => aLower.includes(size));
    const bSize = sizeOrder.find(size => bLower.includes(size));
    
    // If both have sizes, compare by size order
    if (aSize && bSize) {
      const aIndex = sizeOrder.indexOf(aSize);
      const bIndex = sizeOrder.indexOf(bSize);
      
      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }
    }
    
    // If only one has a size, that affects ordering
    if (aSize && !bSize) return -1;
    if (!aSize && bSize) return 1;
    
    return 0; // No clear semantic size comparison
  }
  
  /**
   * Compare tokens with numeric sequences, handling multiple numbers intelligently
   */
  private static compareNumericSequences(a: string, b: string): number {
    // Extract all parts of the token (split by non-alphanumeric)
    const aParts = a.split(/[-_\s]+/);
    const bParts = b.split(/[-_\s]+/);
    
    // Compare part by part
    const maxParts = Math.max(aParts.length, bParts.length);
    
    for (let i = 0; i < maxParts; i++) {
      const aPart = aParts[i] || '';
      const bPart = bParts[i] || '';
      
      // If both parts are numbers, compare numerically
      const aNum = parseInt(aPart, 10);
      const bNum = parseInt(bPart, 10);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        if (aNum !== bNum) {
          return aNum - bNum;
        }
      } else if (!isNaN(aNum)) {
        return -1; // Numbers come before non-numbers
      } else if (!isNaN(bNum)) {
        return 1;
      } else {
        // Both are strings, compare alphabetically
        const comparison = aPart.localeCompare(bPart);
        if (comparison !== 0) {
          return comparison;
        }
      }
    }
    
    return 0;
  }
  
  /**
   * Custom natural sort implementation that works in Figma plugin environment
   * Handles numbers properly without relying on Intl API
   */
  static customNaturalSort(a: string, b: string): number {
    // Split strings into parts of letters and numbers
    const aParts = a.match(/(\d+|\D+)/g) || [];
    const bParts = b.match(/(\d+|\D+)/g) || [];
    
    const maxLength = Math.max(aParts.length, bParts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const aPart = aParts[i] || '';
      const bPart = bParts[i] || '';
      
      // Check if both parts are numbers
      const aIsNumber = /^\d+$/.test(aPart);
      const bIsNumber = /^\d+$/.test(bPart);
      
      if (aIsNumber && bIsNumber) {
        // Compare as numbers
        const aNum = parseInt(aPart, 10);
        const bNum = parseInt(bPart, 10);
        if (aNum !== bNum) {
          return aNum - bNum;
        }
      } else if (aIsNumber && !bIsNumber) {
        // Numbers come before letters
        return -1;
      } else if (!aIsNumber && bIsNumber) {
        // Letters come after numbers
        return 1;
      } else {
        // Compare as strings (case-insensitive)
        const comparison = aPart.toLowerCase().localeCompare(bPart.toLowerCase());
        if (comparison !== 0) {
          return comparison;
        }
      }
    }
    
    return 0;
  }
  
  /**
   * Simple natural sort function for backwards compatibility
   */
  static naturalSort(a: string, b: string): number {
    return this.customNaturalSort(a, b);
  }

  /**
   * Find the primary file from a collection of generated files
   */
  static findPrimaryFile(files: Record<string, string>): string {
    const fileNames = Object.keys(files);
    
    // Look for files that might be primary (comprehensive, main, index, etc.)
    const primaryKeywords = ['comprehensive', 'main', 'index', 'all', 'tokens'];
    
    for (const keyword of primaryKeywords) {
      const primaryFile = fileNames.find(name => 
        name.toLowerCase().includes(keyword)
      );
      if (primaryFile) return primaryFile;
    }
    
    // If no obvious primary file, return the first one
    return fileNames[0] || 'tokens';
  }
} 