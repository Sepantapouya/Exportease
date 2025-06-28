import { Token, TokenAnalysis, CollectionGroup } from '../types';
import { StringUtils } from '../utils/stringUtils';

export class TokenCollector {
  
  /**
   * Collect all tokens comprehensively from variables and collections
   */
  static async collectAllTokensComprehensively(variables: Variable[], collections: VariableCollection[]): Promise<Token[]> {
    console.log('\n🔄 STARTING COMPREHENSIVE TOKEN COLLECTION...');
    
    // Add null safety checks
    if (!variables || variables.length === 0) {
      console.warn('No variables provided for token collection');
      return [];
    }
    
    if (!collections || collections.length === 0) {
      console.warn('No collections provided for token collection');
      return [];
    }
    
    const tokens: Token[] = [];
    let processedCount = 0;
    let totalToProcess = 0;
    
    // Calculate total tokens to process
    collections.forEach(collection => {
      if (!collection || !collection.modes) {
        console.warn(`Skipping invalid collection: ${collection?.name || 'unknown'}`);
        return;
      }
      
      const variablesInCollection = variables.filter(v => v && v.variableCollectionId === collection.id);
      totalToProcess += variablesInCollection.length * collection.modes.length;
    });
    
    console.log(`Will process ${totalToProcess} variable-mode combinations...`);
    
    for (const collection of collections) {
      if (!collection || !collection.modes || !collection.name) {
        console.warn(`Skipping invalid collection: ${collection?.name || 'unknown'}`);
        continue;
      }
      
      console.log(`\n📁 Processing collection: "${collection.name}"`);
      const variablesInCollection = variables.filter(v => v && v.variableCollectionId === collection.id);
      
      for (const mode of collection.modes) {
        if (!mode || !mode.name || !mode.modeId) {
          console.warn(`Skipping invalid mode in collection "${collection.name}"`);
          continue;
        }
        
        console.log(`  🎯 Processing mode: "${mode.name}"`);
        
        for (const variable of variablesInCollection) {
          if (!variable || !variable.name || !variable.valuesByMode) {
            console.warn(`Skipping invalid variable in collection "${collection.name}"`);
            continue;
          }
          
          try {
            const value = variable.valuesByMode[mode.modeId];
            if (value !== undefined) {
              const resolvedValue = await this.resolveVariableValue(value, variable.resolvedType);
              
              const token: Token = {
                name: variable.name,
                value: resolvedValue,
                type: variable.resolvedType || 'UNKNOWN',
                collection: collection.name,
                mode: mode.name,
                resolvedType: variable.resolvedType || 'UNKNOWN',
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
    
    // Add null safety check
    if (!tokens || tokens.length === 0) {
      console.warn('No tokens provided for analysis');
      return {
        byCollection: {},
        byType: {},
        byMode: {},
        collections: []
      };
    }
    
    const byCollection: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byMode: Record<string, number> = {};
    const collectionsMap: Record<string, Record<string, Token[]>> = {};
    
    // Single pass through tokens for efficiency
    tokens.forEach(token => {
      // Skip invalid tokens
      if (!token || !token.collection || !token.mode || !token.name) {
        console.warn('Skipping invalid token:', token);
        return;
      }
      
      // Count by collection
      byCollection[token.collection] = (byCollection[token.collection] || 0) + 1;
      
      // Count by type
      const tokenType = token.type || 'UNKNOWN';
      byType[tokenType] = (byType[tokenType] || 0) + 1;
      
      // Count by mode
      byMode[token.mode] = (byMode[token.mode] || 0) + 1;
      
      // Group for structured output - initialize nested objects safely
      if (!collectionsMap[token.collection]) {
        collectionsMap[token.collection] = {};
      }
      if (!collectionsMap[token.collection][token.mode]) {
        collectionsMap[token.collection][token.mode] = [];
      }
      collectionsMap[token.collection][token.mode].push(token);
    });
    
    // Convert to structured format with dynamic sorting and validation
    const collections: CollectionGroup[] = Object.entries(collectionsMap)
      .filter(([collectionName, modes]) => collectionName && modes && Object.keys(modes).length > 0)
      .map(([collectionName, modes]) => ({
        name: collectionName,
        modes: Object.entries(modes)
          .filter(([modeName, tokens]) => modeName && tokens && tokens.length > 0)
          .map(([modeName, tokens]) => {
            // Extract token names for dynamic sorting - with null safety
            const tokenNames = tokens
              .filter(t => t && t.name)
              .map(t => t.name);
            
            if (tokenNames.length === 0) {
              console.warn(`No valid tokens found for mode ${modeName} in collection ${collectionName}`);
              return {
                name: modeName,
                tokens: []
              };
            }
            
            const sortedNames = StringUtils.dynamicSort(tokenNames);
            
            // Create a sorted tokens array based on the dynamic sort order
            const sortedTokens = sortedNames
              .map(name => tokens.find(t => t && t.name === name))
              .filter(token => token !== undefined) as Token[];
            
            return {
              name: modeName,
              tokens: sortedTokens
            };
          })
          .filter(mode => mode.tokens.length > 0) // Remove empty modes
      }))
      .filter(collection => collection.modes.length > 0); // Remove empty collections
    
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
      // Handle null/undefined values
      if (value === null || value === undefined) {
        console.warn('Encountered null/undefined value in variable resolution');
        return 'undefined';
      }
      
      if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
        // Handle variable aliases/references
        try {
          if (!value.id) {
            console.warn('Variable alias missing ID');
            return 'var(--missing-alias-id)';
          }
          
          const referencedVariable = await figma.variables.getVariableByIdAsync(value.id);
          if (referencedVariable && referencedVariable.name) {
            // For aliases, we'll use the referenced variable's name with a CSS var() reference
            return `var(--${this.tokenToCSSVariable(referencedVariable.name)})`;
          } else {
            console.warn(`Referenced variable not found for ID: ${value.id}`);
            return `var(--unresolved-${value.id})`;
          }
        } catch (error) {
          console.warn(`Failed to resolve variable alias ${value.id}:`, error);
          return `var(--error-${value.id || 'unknown'})`;
        }
      }
      
      // Handle different value types with better error checking
      switch (type) {
        case 'COLOR':
          if (value && typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
            const r = Math.max(0, Math.min(255, Math.round((value.r || 0) * 255)));
            const g = Math.max(0, Math.min(255, Math.round((value.g || 0) * 255)));
            const b = Math.max(0, Math.min(255, Math.round((value.b || 0) * 255)));
            const a = value.a !== undefined ? Math.max(0, Math.min(1, value.a)) : 1;
            
            if (a === 1) {
              return `rgb(${r}, ${g}, ${b})`;
            } else {
              return `rgba(${r}, ${g}, ${b}, ${a})`;
            }
          } else {
            console.warn('Invalid color value format:', value);
            return 'rgba(0, 0, 0, 1)'; // fallback to black
          }
          
        case 'FLOAT':
          if (typeof value === 'number' && !isNaN(value)) {
            return value.toString();
          } else {
            const parsed = parseFloat(String(value));
            return isNaN(parsed) ? '0' : parsed.toString();
          }
          
        case 'STRING':
          return String(value || '');
          
        case 'BOOLEAN':
          return String(Boolean(value));
          
        default:
          return String(value || '');
      }
    } catch (error) {
      console.warn(`Error resolving value for type ${type}:`, error);
      return String(value || 'error');
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