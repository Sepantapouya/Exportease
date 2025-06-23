import { Token, TokenAnalysis, CollectionGroup } from '../types';
import { StringUtils } from '../utils/stringUtils';

export class TokenCollector {
  
  /**
   * Collect all tokens comprehensively from variables and collections
   */
  static async collectAllTokensComprehensively(variables: Variable[], collections: VariableCollection[]): Promise<Token[]> {
    console.log('\n🔄 STARTING COMPREHENSIVE TOKEN COLLECTION...');
    
    const tokens: Token[] = [];
    let processedCount = 0;
    let totalToProcess = 0;
    
    // Calculate total tokens to process
    collections.forEach(collection => {
      const variablesInCollection = variables.filter(v => v.variableCollectionId === collection.id);
      totalToProcess += variablesInCollection.length * collection.modes.length;
    });
    
    console.log(`Will process ${totalToProcess} variable-mode combinations...`);
    
    for (const collection of collections) {
      console.log(`\n📁 Processing collection: "${collection.name}"`);
      const variablesInCollection = variables.filter(v => v.variableCollectionId === collection.id);
      
      for (const mode of collection.modes) {
        console.log(`  🎯 Processing mode: "${mode.name}"`);
        
        for (const variable of variablesInCollection) {
          try {
            const value = variable.valuesByMode[mode.modeId];
            if (value !== undefined) {
              const resolvedValue = await this.resolveVariableValue(value, variable.resolvedType);
              
              const token: Token = {
                name: variable.name,
                value: resolvedValue,
                type: variable.resolvedType,
                collection: collection.name,
                mode: mode.name,
                resolvedType: variable.resolvedType,
                originalValue: value
              };
              
              tokens.push(token);
              processedCount++;
              
              // Progress logging every 50 tokens
              if (processedCount % 50 === 0 || processedCount === totalToProcess) {
                console.log(`    Progress: ${processedCount}/${totalToProcess} tokens processed`);
              }
            }
          } catch (error) {
            console.warn(`    ⚠️ Failed to process variable "${variable.name}" in mode "${mode.name}":`, error);
          }
        }
      }
    }
    
    console.log(`\n✅ TOKEN COLLECTION COMPLETE!`);
    console.log(`Successfully collected ${tokens.length} tokens out of ${totalToProcess} expected`);
    
    return tokens;
  }

  /**
   * Analyze tokens comprehensively and group them by collection and mode
   */
  static analyzeTokensComprehensively(tokens: Token[]): TokenAnalysis {
    console.log('\n📊 ANALYZING TOKEN STRUCTURE...');
    
    const byCollection: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byMode: Record<string, number> = {};
    const collectionsMap: Record<string, Record<string, Token[]>> = {};
    
    tokens.forEach(token => {
      // Count by collection
      byCollection[token.collection] = (byCollection[token.collection] || 0) + 1;
      
      // Count by type
      byType[token.type] = (byType[token.type] || 0) + 1;
      
      // Count by mode
      byMode[token.mode] = (byMode[token.mode] || 0) + 1;
      
      // Group for structured output
      if (!collectionsMap[token.collection]) {
        collectionsMap[token.collection] = {};
      }
      if (!collectionsMap[token.collection][token.mode]) {
        collectionsMap[token.collection][token.mode] = [];
      }
      collectionsMap[token.collection][token.mode].push(token);
    });
    
    // Convert to structured format with dynamic sorting
    const collections: CollectionGroup[] = Object.entries(collectionsMap).map(([collectionName, modes]) => ({
      name: collectionName,
      modes: Object.entries(modes).map(([modeName, tokens]) => {
        // Extract token names for dynamic sorting
        const tokenNames = tokens.map(t => t.name);
        const sortedNames = StringUtils.dynamicSort(tokenNames);
        
        // Create a sorted tokens array based on the dynamic sort order
        const sortedTokens = sortedNames.map(name => 
          tokens.find(t => t.name === name)!
        );
        
        return {
          name: modeName,
          tokens: sortedTokens
        };
      })
    }));
    
    return {
      byCollection,
      byType,
      byMode,
      collections
    };
  }

  /**
   * Resolve variable values, handling references and aliases
   */
  private static async resolveVariableValue(value: any, type: string): Promise<string> {
    try {
      if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
        // Handle variable aliases/references
        try {
          const referencedVariable = await figma.variables.getVariableByIdAsync(value.id);
          if (referencedVariable) {
            // For aliases, we'll use the referenced variable's name with a CSS var() reference
            return `var(--${this.tokenToCSSVariable(referencedVariable.name)})`;
          }
        } catch (error) {
          console.warn(`Failed to resolve variable alias ${value.id}:`, error);
          return `var(--unresolved-${value.id})`;
        }
      }
      
      // Handle different value types
      switch (type) {
        case 'COLOR':
          if (value && typeof value === 'object' && 'r' in value) {
            const r = Math.round(value.r * 255);
            const g = Math.round(value.g * 255);
            const b = Math.round(value.b * 255);
            const a = value.a !== undefined ? value.a : 1;
            
            if (a === 1) {
              return `rgb(${r}, ${g}, ${b})`;
            } else {
              return `rgba(${r}, ${g}, ${b}, ${a})`;
            }
          }
          break;
          
        case 'FLOAT':
          return typeof value === 'number' ? value.toString() : String(value);
          
        case 'STRING':
          return String(value);
          
        case 'BOOLEAN':
          return String(value);
          
        default:
          return String(value);
      }
      
      return String(value);
    } catch (error) {
      console.warn(`Error resolving value:`, error);
      return String(value);
    }
  }

  /**
   * Convert token name to CSS variable format
   */
  private static tokenToCSSVariable(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
} 