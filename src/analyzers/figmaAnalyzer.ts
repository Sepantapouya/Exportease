import { AnalysisResult, ExportBreakdown } from '../types';

export class FigmaAnalyzer {
  
  /**
   * Analyze what's available for export from the current Figma file
   */
  static async analyzeAvailableExports(): Promise<AnalysisResult> {
    console.log('=== ANALYZING AVAILABLE EXPORTS ===');
    
    try {
      const localPaintStyles = await figma.getLocalPaintStylesAsync();
      const localTextStyles = await figma.getLocalTextStylesAsync();
      const localEffectStyles = await figma.getLocalEffectStylesAsync();
      const localVariables = await figma.variables.getLocalVariablesAsync();
      const localCollections = await figma.variables.getLocalVariableCollectionsAsync();

      console.log('📊 Raw Figma API Results:');
      console.log(`  - Paint styles: ${localPaintStyles.length}`);
      console.log(`  - Text styles: ${localTextStyles.length}`);
      console.log(`  - Effect styles: ${localEffectStyles.length}`);
      console.log(`  - Variables: ${localVariables.length}`);
      console.log(`  - Collections: ${localCollections.length}`);

      if (localVariables.length === 0) {
        console.warn('⚠️ No local variables found! User needs to create variables first.');
      }

      if (localCollections.length === 0) {
        console.warn('⚠️ No variable collections found! User needs to create variable collections first.');
      }

      console.log(`Found ${localVariables.length} total local variables`);
      console.log(`Found ${localCollections.length} variable collections:`);
      
      localCollections.forEach((collection, index) => {
        console.log(`  Collection ${index + 1}: "${collection.name}" with ${collection.modes.length} modes`);
        collection.modes.forEach((mode, modeIndex) => {
          console.log(`    Mode ${modeIndex + 1}: "${mode.name}" (${mode.modeId})`);
        });
        
        // Count variables in this collection
        const variablesInCollection = localVariables.filter(v => v.variableCollectionId === collection.id);
        console.log(`    Variables in this collection: ${variablesInCollection.length}`);
        
        // Show first few variable names as examples
        const exampleVars = variablesInCollection.slice(0, 3).map(v => v.name);
        if (exampleVars.length > 0) {
          console.log(`    Example variables: ${exampleVars.join(', ')}`);
        }
      });

      const breakdown: ExportBreakdown = {
        paintStyles: localPaintStyles.length,
        textStyles: localTextStyles.length,
        effectStyles: localEffectStyles.length,
        variables: localVariables.length
      };

      const stylesCount = localPaintStyles.length + localTextStyles.length + localEffectStyles.length;
      const variablesCount = localVariables.length;
      const hasExports = stylesCount > 0 || variablesCount > 0;

      console.log(`📊 Analysis Summary:`);
      console.log(`  - Total styles: ${stylesCount}`);
      console.log(`  - Total variables: ${variablesCount}`);
      console.log(`  - Has exports: ${hasExports}`);

      if (!hasExports) {
        console.warn('⚠️ No exports available! User needs to create variables or styles first.');
      }

      return {
        hasExports,
        stylesCount,
        variablesCount,
        breakdown
      };
    } catch (error) {
      console.error('💥 Error in analyzeAvailableExports:', error);
      throw error;
    }
  }

  /**
   * Get detailed collection information for variable analysis
   */
  static async getCollectionDetails() {
    const localVariables = await figma.variables.getLocalVariablesAsync();
    const allCollections = await figma.variables.getLocalVariableCollectionsAsync();
    
    console.log(`\n📊 FIGMA ANALYSIS:`);
    console.log(`Total local variables found: ${localVariables.length}`);
    console.log(`Total variable collections found: ${allCollections.length}`);
    
    if (localVariables.length === 0) {
      throw new Error('No local variables found in this Figma file');
    }

    // Detailed collection analysis
    console.log(`\n🔍 DETAILED COLLECTION ANALYSIS:`);
    let totalExpectedTokens = 0;
    
    allCollections.forEach((collection, index) => {
      const variablesInCollection = localVariables.filter(v => v.variableCollectionId === collection.id);
      const expectedTokensForCollection = variablesInCollection.length * collection.modes.length;
      totalExpectedTokens += expectedTokensForCollection;
      
      console.log(`\nCollection ${index + 1}: "${collection.name}"`);
      console.log(`  - Collection ID: ${collection.id}`);
      console.log(`  - Variables in collection: ${variablesInCollection.length}`);
      console.log(`  - Modes: ${collection.modes.length}`);
      collection.modes.forEach((mode, modeIndex) => {
        console.log(`    Mode ${modeIndex + 1}: "${mode.name}" (${mode.modeId})`);
      });
      console.log(`  - Expected tokens: ${expectedTokensForCollection} (${variablesInCollection.length} vars × ${collection.modes.length} modes)`);
      
      // Show sample variables
      if (variablesInCollection.length > 0) {
        console.log(`  - Sample variables:`);
        variablesInCollection.slice(0, 5).forEach(v => {
          console.log(`    • ${v.name} (${v.resolvedType})`);
        });
        if (variablesInCollection.length > 5) {
          console.log(`    ... and ${variablesInCollection.length - 5} more`);
        }
      }
    });
    
    console.log(`\n📈 EXPECTED TOTAL TOKENS: ${totalExpectedTokens}`);
    console.log(`(This should be close to your final token count)\n`);

    return {
      localVariables,
      allCollections,
      totalExpectedTokens
    };
  }
} 