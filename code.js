/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 341:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TokenCollector = void 0;
const stringUtils_1 = __webpack_require__(820);
class TokenCollector {
    static async collectAllTokensComprehensively(variables, collections) {
        console.log('\n🔄 STARTING COMPREHENSIVE TOKEN COLLECTION...');
        if (!variables || variables.length === 0) {
            console.warn('No variables provided for token collection');
            return [];
        }
        if (!collections || collections.length === 0) {
            console.warn('No collections provided for token collection');
            return [];
        }
        const tokens = [];
        let processedCount = 0;
        let totalToProcess = 0;
        collections.forEach(collection => {
            if (!collection || !collection.modes) {
                console.warn(`Skipping invalid collection: ${(collection === null || collection === void 0 ? void 0 : collection.name) || 'unknown'}`);
                return;
            }
            const variablesInCollection = variables.filter(v => v && v.variableCollectionId === collection.id);
            totalToProcess += variablesInCollection.length * collection.modes.length;
        });
        console.log(`Will process ${totalToProcess} variable-mode combinations...`);
        for (const collection of collections) {
            if (!collection || !collection.modes || !collection.name) {
                console.warn(`Skipping invalid collection: ${(collection === null || collection === void 0 ? void 0 : collection.name) || 'unknown'}`);
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
                            const token = {
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
                            if (processedCount % 50 === 0 || processedCount === totalToProcess) {
                                console.log(`    Progress: ${processedCount}/${totalToProcess} tokens processed`);
                            }
                        }
                    }
                    catch (error) {
                        console.warn(`    ⚠️ Failed to process variable "${variable.name}" in mode "${mode.name}":`, error);
                    }
                }
            }
        }
        console.log(`\n✅ TOKEN COLLECTION COMPLETE!`);
        console.log(`Successfully collected ${tokens.length} tokens out of ${totalToProcess} expected`);
        return tokens;
    }
    static analyzeTokensComprehensively(tokens) {
        console.log('\n📊 ANALYZING TOKEN STRUCTURE...');
        if (!tokens || tokens.length === 0) {
            console.warn('No tokens provided for analysis');
            return {
                byCollection: {},
                byType: {},
                byMode: {},
                collections: []
            };
        }
        const byCollection = {};
        const byType = {};
        const byMode = {};
        const collectionsMap = {};
        tokens.forEach(token => {
            if (!token || !token.collection || !token.mode || !token.name) {
                console.warn('Skipping invalid token:', token);
                return;
            }
            byCollection[token.collection] = (byCollection[token.collection] || 0) + 1;
            const tokenType = token.type || 'UNKNOWN';
            byType[tokenType] = (byType[tokenType] || 0) + 1;
            byMode[token.mode] = (byMode[token.mode] || 0) + 1;
            if (!collectionsMap[token.collection]) {
                collectionsMap[token.collection] = {};
            }
            if (!collectionsMap[token.collection][token.mode]) {
                collectionsMap[token.collection][token.mode] = [];
            }
            collectionsMap[token.collection][token.mode].push(token);
        });
        const collections = Object.entries(collectionsMap)
            .filter(([collectionName, modes]) => collectionName && modes && Object.keys(modes).length > 0)
            .map(([collectionName, modes]) => ({
            name: collectionName,
            modes: Object.entries(modes)
                .filter(([modeName, tokens]) => modeName && tokens && tokens.length > 0)
                .map(([modeName, tokens]) => {
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
                const sortedNames = stringUtils_1.StringUtils.dynamicSort(tokenNames);
                const sortedTokens = sortedNames
                    .map(name => tokens.find(t => t && t.name === name))
                    .filter(token => token !== undefined);
                return {
                    name: modeName,
                    tokens: sortedTokens
                };
            })
                .filter(mode => mode.tokens.length > 0)
        }))
            .filter(collection => collection.modes.length > 0);
        return {
            byCollection,
            byType,
            byMode,
            collections
        };
    }
    static async resolveVariableValue(value, type) {
        try {
            if (value === null || value === undefined) {
                console.warn('Encountered null/undefined value in variable resolution');
                return 'undefined';
            }
            if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
                try {
                    if (!value.id) {
                        console.warn('Variable alias missing ID');
                        return 'var(--missing-alias-id)';
                    }
                    const referencedVariable = await figma.variables.getVariableByIdAsync(value.id);
                    if (referencedVariable && referencedVariable.name) {
                        return `var(--${this.tokenToCSSVariable(referencedVariable.name)})`;
                    }
                    else {
                        console.warn(`Referenced variable not found for ID: ${value.id}`);
                        return `var(--unresolved-${value.id})`;
                    }
                }
                catch (error) {
                    console.warn(`Failed to resolve variable alias ${value.id}:`, error);
                    return `var(--error-${value.id || 'unknown'})`;
                }
            }
            switch (type) {
                case 'COLOR':
                    if (value && typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
                        const r = Math.max(0, Math.min(255, Math.round((value.r || 0) * 255)));
                        const g = Math.max(0, Math.min(255, Math.round((value.g || 0) * 255)));
                        const b = Math.max(0, Math.min(255, Math.round((value.b || 0) * 255)));
                        const a = value.a !== undefined ? Math.max(0, Math.min(1, value.a)) : 1;
                        if (a === 1) {
                            return `rgb(${r}, ${g}, ${b})`;
                        }
                        else {
                            return `rgba(${r}, ${g}, ${b}, ${a})`;
                        }
                    }
                    else {
                        console.warn('Invalid color value format:', value);
                        return 'rgba(0, 0, 0, 1)';
                    }
                case 'FLOAT':
                    if (typeof value === 'number' && !isNaN(value)) {
                        return value.toString();
                    }
                    else {
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
        }
        catch (error) {
            console.warn(`Error resolving value for type ${type}:`, error);
            return String(value || 'error');
        }
    }
    static tokenToCSSVariable(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}
exports.TokenCollector = TokenCollector;


/***/ }),

/***/ 346:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FigmaAnalyzer = void 0;
class FigmaAnalyzer {
    static async analyzeAvailableExports() {
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
                const variablesInCollection = localVariables.filter(v => v.variableCollectionId === collection.id);
                console.log(`    Variables in this collection: ${variablesInCollection.length}`);
                const exampleVars = variablesInCollection.slice(0, 3).map(v => v.name);
                if (exampleVars.length > 0) {
                    console.log(`    Example variables: ${exampleVars.join(', ')}`);
                }
            });
            const breakdown = {
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
        }
        catch (error) {
            console.error('💥 Error in analyzeAvailableExports:', error);
            throw error;
        }
    }
    static async getCollectionDetails() {
        const localVariables = await figma.variables.getLocalVariablesAsync();
        const allCollections = await figma.variables.getLocalVariableCollectionsAsync();
        console.log(`\n📊 FIGMA ANALYSIS:`);
        console.log(`Total local variables found: ${localVariables.length}`);
        console.log(`Total variable collections found: ${allCollections.length}`);
        if (localVariables.length === 0) {
            throw new Error('No local variables found in this Figma file');
        }
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
exports.FigmaAnalyzer = FigmaAnalyzer;


/***/ }),

/***/ 820:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StringUtils = void 0;
class StringUtils {
    static slugify(text) {
        if (!text || typeof text !== 'string') {
            console.warn('Invalid input for slugify:', text);
            return 'invalid-input';
        }
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            || 'empty';
    }
    static tokenToCSSVariable(name) {
        if (!name || typeof name !== 'string') {
            console.warn('Invalid input for tokenToCSSVariable:', name);
            return 'invalid-token';
        }
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            || 'empty-token';
    }
    static tokenToJSVariable(name) {
        if (!name || typeof name !== 'string') {
            console.warn('Invalid input for tokenToJSVariable:', name);
            return 'invalidToken';
        }
        const result = name
            .replace(/[^a-zA-Z0-9]+/g, '_')
            .replace(/^[^a-zA-Z_]/, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_+|_+$/g, '');
        if (!result) {
            return 'emptyToken';
        }
        if (/^\d/.test(result)) {
            return '_' + result;
        }
        return result;
    }
    static tokenToTailwindVariable(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    static toPascalCase(str) {
        return str
            .replace(/[^a-zA-Z0-9]+/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
    }
    static toCamelCase(str) {
        const pascalCase = this.toPascalCase(str);
        return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
    }
    static getFileExtension(format) {
        const extensions = {
            css: 'css',
            js: 'js',
            javascript: 'js',
            tailwind: 'js'
        };
        return extensions[format.toLowerCase()] || 'txt';
    }
    static generateImportInstructions(files, format) {
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
    static dynamicSort(tokens) {
        if (tokens.length === 0)
            return tokens;
        const groups = this.groupTokensBySemantics(tokens);
        const sortedGroups = groups.map(group => (Object.assign(Object.assign({}, group), { tokens: this.alphanumericSort(group.tokens) })));
        sortedGroups.sort((a, b) => this.alphanumericSort([a.prefix, b.prefix])[0] === a.prefix ? -1 : 1);
        return sortedGroups.flatMap(group => group.tokens);
    }
    static groupTokensBySemantics(tokens) {
        const groups = new Map();
        tokens.forEach(token => {
            const parts = token.split(/[-_]/);
            let prefix = parts[0];
            if (parts.length > 3) {
                if (parts[1] && !/^\d/.test(parts[1])) {
                    prefix = `${parts[0]}-${parts[1]}`;
                }
                if (parts.length > 4 && parts[2] && !/^\d/.test(parts[2])) {
                    prefix = `${parts[0]}-${parts[1]}-${parts[2]}`;
                }
            }
            if (!groups.has(prefix)) {
                groups.set(prefix, []);
            }
            groups.get(prefix).push(token);
        });
        return Array.from(groups.entries()).map(([prefix, tokens]) => ({
            prefix,
            tokens
        }));
    }
    static alphanumericSort(tokens) {
        return tokens.sort((a, b) => {
            const chunksA = this.chunkify(a);
            const chunksB = this.chunkify(b);
            const maxChunks = Math.max(chunksA.length, chunksB.length);
            for (let i = 0; i < maxChunks; i++) {
                const chunkA = chunksA[i] || '';
                const chunkB = chunksB[i] || '';
                if (chunkA !== chunkB) {
                    const numA = parseFloat(chunkA);
                    const numB = parseFloat(chunkB);
                    if (!isNaN(numA) && !isNaN(numB)) {
                        return numA - numB;
                    }
                    return chunkA.toLowerCase().localeCompare(chunkB.toLowerCase());
                }
            }
            return chunksA.length - chunksB.length;
        });
    }
    static chunkify(str) {
        const chunks = [];
        let currentChunk = '';
        let isNumber = false;
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            const charIsNumber = /\d/.test(char);
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
    static analyzeTokenStructure(tokens) {
        const structure = {
            isHierarchical: false,
            hasSemanticSizes: false,
            hasNumericSequences: false,
            isSimpleNumeric: false,
            averageDepth: 0,
            commonPrefixes: new Set(),
            maxDepth: 0
        };
        let totalDepth = 0;
        let simpleNumericCount = 0;
        let complexHierarchicalCount = 0;
        const prefixGroups = new Map();
        tokens.forEach(token => {
            const withoutNumbers = token.replace(/\d+/g, 'NUM');
            const semanticDepth = (withoutNumbers.match(/[-_]/g) || []).length;
            totalDepth += semanticDepth;
            structure.maxDepth = Math.max(structure.maxDepth, semanticDepth);
            const simpleNumericPattern = /^[a-zA-Z]+[-_][a-zA-Z]+[-_]*[a-zA-Z]*[-_]\d+$/;
            const isSimpleNumeric = simpleNumericPattern.test(token);
            if (isSimpleNumeric) {
                simpleNumericCount++;
            }
            const parts = token.split(/[-_]/);
            const nonNumericParts = parts.filter(part => !/^\d+$/.test(part));
            if (nonNumericParts.length > 3) {
                complexHierarchicalCount++;
                const prefix = nonNumericParts.slice(0, 3).join('-');
                prefixGroups.set(prefix, (prefixGroups.get(prefix) || 0) + 1);
                structure.commonPrefixes.add(prefix);
            }
            const lowerToken = token.toLowerCase();
            const semanticSizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'small', 'medium', 'large', 'tiny', 'huge'];
            if (semanticSizes.some(size => lowerToken.includes(size))) {
                structure.hasSemanticSizes = true;
            }
            if (/\d+/.test(token)) {
                structure.hasNumericSequences = true;
            }
        });
        structure.averageDepth = tokens.length > 0 ? totalDepth / tokens.length : 0;
        structure.isSimpleNumeric = simpleNumericCount > tokens.length * 0.4;
        structure.isHierarchical = !structure.isSimpleNumeric &&
            complexHierarchicalCount > tokens.length * 0.6 &&
            prefixGroups.size > 1 &&
            Array.from(prefixGroups.values()).some(count => count > 2);
        return structure;
    }
    static sortHierarchicalTokens(tokens, structure) {
        const groups = new Map();
        tokens.forEach(token => {
            const parts = token.split(/[-_]/);
            let groupKey = '';
            if (parts.length >= 3) {
                groupKey = parts.slice(0, Math.min(3, parts.length - 1)).join('-');
            }
            else {
                groupKey = parts[0] || token;
            }
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey).push(token);
        });
        const sortedGroupKeys = Array.from(groups.keys()).sort((a, b) => this.customNaturalSort(a, b));
        const result = [];
        sortedGroupKeys.forEach(groupKey => {
            const groupTokens = groups.get(groupKey);
            const sortedGroupTokens = groupTokens.sort((a, b) => this.compareHierarchicalTokens(a, b));
            result.push(...sortedGroupTokens);
        });
        return result;
    }
    static compareHierarchicalTokens(a, b) {
        const aParts = a.split(/[-_]/);
        const bParts = b.split(/[-_]/);
        const aBase = aParts.slice(0, -2).join('-');
        const bBase = bParts.slice(0, -2).join('-');
        if (aBase !== bBase) {
            return this.customNaturalSort(aBase, bBase);
        }
        const stateOrder = [
            '', 'base', 'default',
            'hover', 'active', 'focus', 'selected', 'pressed',
            'disabled', 'loading',
            'primary', 'secondary', 'tertiary',
            'success', 'warning', 'error', 'critical', 'caution', 'info',
            'inverse', 'brand', 'emphasis', 'magic',
            'transparent'
        ];
        const aModifiers = aParts.slice(-2);
        const bModifiers = bParts.slice(-2);
        for (let i = 0; i < Math.max(aModifiers.length, bModifiers.length); i++) {
            const aMod = aModifiers[i] || '';
            const bMod = bModifiers[i] || '';
            const aIndex = stateOrder.findIndex(state => aMod.includes(state));
            const bIndex = stateOrder.findIndex(state => bMod.includes(state));
            if (aIndex !== -1 && bIndex !== -1 && aIndex !== bIndex) {
                return aIndex - bIndex;
            }
            else if (aIndex !== -1 && bIndex === -1) {
                return -1;
            }
            else if (aIndex === -1 && bIndex !== -1) {
                return 1;
            }
            else {
                const comparison = this.customNaturalSort(aMod, bMod);
                if (comparison !== 0)
                    return comparison;
            }
        }
        return this.customNaturalSort(a, b);
    }
    static sortSimpleNumericTokens(tokens) {
        return tokens.sort((a, b) => {
            const aParts = a.split(/[-_]/);
            const bParts = b.split(/[-_]/);
            let aNumIndex = aParts.findIndex(part => /^\d+$/.test(part));
            let bNumIndex = bParts.findIndex(part => /^\d+$/.test(part));
            const aTextParts = aNumIndex >= 0 ? aParts.slice(0, aNumIndex) : aParts;
            const bTextParts = bNumIndex >= 0 ? bParts.slice(0, bNumIndex) : bParts;
            for (let i = 0; i < Math.max(aTextParts.length, bTextParts.length); i++) {
                const aPart = aTextParts[i] || '';
                const bPart = bTextParts[i] || '';
                if (aPart !== bPart) {
                    return aPart.localeCompare(bPart);
                }
            }
            if (aNumIndex >= 0 && bNumIndex >= 0) {
                const aNumParts = aParts.slice(aNumIndex).filter(part => /^\d+$/.test(part));
                const bNumParts = bParts.slice(bNumIndex).filter(part => /^\d+$/.test(part));
                for (let i = 0; i < Math.max(aNumParts.length, bNumParts.length); i++) {
                    const aNum = parseInt(aNumParts[i] || '0', 10);
                    const bNum = parseInt(bNumParts[i] || '0', 10);
                    if (aNum !== bNum) {
                        return aNum - bNum;
                    }
                }
                const aRemaining = aParts.slice(aNumIndex).filter(part => !/^\d+$/.test(part));
                const bRemaining = bParts.slice(bNumIndex).filter(part => !/^\d+$/.test(part));
                for (let i = 0; i < Math.max(aRemaining.length, bRemaining.length); i++) {
                    const aPart = aRemaining[i] || '';
                    const bPart = bRemaining[i] || '';
                    if (aPart !== bPart) {
                        return aPart.localeCompare(bPart);
                    }
                }
            }
            else if (aNumIndex >= 0) {
                return 1;
            }
            else if (bNumIndex >= 0) {
                return -1;
            }
            return this.customNaturalSort(a, b);
        });
    }
    static sortSemanticTokens(tokens) {
        return tokens.sort((a, b) => {
            const semanticComparison = this.compareSemanticSizes(a, b);
            if (semanticComparison !== 0)
                return semanticComparison;
            return this.customNaturalSort(a, b);
        });
    }
    static sortNumericTokens(tokens) {
        return tokens.sort((a, b) => {
            const numericComparison = this.compareNumericSequences(a, b);
            if (numericComparison !== 0)
                return numericComparison;
            return this.customNaturalSort(a, b);
        });
    }
    static compareSemanticSizes(a, b) {
        const sizeOrder = ['xs', 'sm', 's', 'md', 'm', 'lg', 'l', 'xl', 'xxl', 'xxxl', 'tiny', 'small', 'medium', 'large', 'huge'];
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        const aSize = sizeOrder.find(size => aLower.includes(size));
        const bSize = sizeOrder.find(size => bLower.includes(size));
        if (aSize && bSize) {
            const aIndex = sizeOrder.indexOf(aSize);
            const bIndex = sizeOrder.indexOf(bSize);
            if (aIndex !== bIndex) {
                return aIndex - bIndex;
            }
        }
        if (aSize && !bSize)
            return -1;
        if (!aSize && bSize)
            return 1;
        return 0;
    }
    static compareNumericSequences(a, b) {
        const aParts = a.split(/[-_\s]+/);
        const bParts = b.split(/[-_\s]+/);
        const maxParts = Math.max(aParts.length, bParts.length);
        for (let i = 0; i < maxParts; i++) {
            const aPart = aParts[i] || '';
            const bPart = bParts[i] || '';
            const aNum = parseInt(aPart, 10);
            const bNum = parseInt(bPart, 10);
            if (!isNaN(aNum) && !isNaN(bNum)) {
                if (aNum !== bNum) {
                    return aNum - bNum;
                }
            }
            else if (!isNaN(aNum)) {
                return -1;
            }
            else if (!isNaN(bNum)) {
                return 1;
            }
            else {
                const comparison = aPart.localeCompare(bPart);
                if (comparison !== 0) {
                    return comparison;
                }
            }
        }
        return 0;
    }
    static customNaturalSort(a, b) {
        const aParts = a.match(/(\d+|\D+)/g) || [];
        const bParts = b.match(/(\d+|\D+)/g) || [];
        const maxLength = Math.max(aParts.length, bParts.length);
        for (let i = 0; i < maxLength; i++) {
            const aPart = aParts[i] || '';
            const bPart = bParts[i] || '';
            const aIsNumber = /^\d+$/.test(aPart);
            const bIsNumber = /^\d+$/.test(bPart);
            if (aIsNumber && bIsNumber) {
                const aNum = parseInt(aPart, 10);
                const bNum = parseInt(bPart, 10);
                if (aNum !== bNum) {
                    return aNum - bNum;
                }
            }
            else if (aIsNumber && !bIsNumber) {
                return -1;
            }
            else if (!aIsNumber && bIsNumber) {
                return 1;
            }
            else {
                const comparison = aPart.toLowerCase().localeCompare(bPart.toLowerCase());
                if (comparison !== 0) {
                    return comparison;
                }
            }
        }
        return 0;
    }
    static naturalSort(a, b) {
        return this.customNaturalSort(a, b);
    }
    static findPrimaryFile(files) {
        const fileNames = Object.keys(files);
        const primaryKeywords = ['comprehensive', 'main', 'index', 'all', 'tokens'];
        for (const keyword of primaryKeywords) {
            const primaryFile = fileNames.find(name => name.toLowerCase().includes(keyword));
            if (primaryFile)
                return primaryFile;
        }
        return fileNames[0] || 'tokens';
    }
}
exports.StringUtils = StringUtils;


/***/ }),

/***/ 952:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExportService = void 0;
const figmaAnalyzer_1 = __webpack_require__(346);
const tokenCollector_1 = __webpack_require__(341);
const formatGenerators_1 = __webpack_require__(994);
const stringUtils_1 = __webpack_require__(820);
class ExportService {
    static async exportVariables(format) {
        console.log('=== COMPLETE VARIABLE EXPORT STARTED (ASYNC API) ===');
        console.log(`📝 Export format: ${format}`);
        try {
            console.log('🔍 Step 1: Analyzing Figma file...');
            const { localVariables, allCollections, totalExpectedTokens } = await figmaAnalyzer_1.FigmaAnalyzer.getCollectionDetails();
            console.log(`📊 Found: ${localVariables.length} variables, ${allCollections.length} collections`);
            if (!localVariables || localVariables.length === 0) {
                throw new Error('No local variables found in this Figma file. Please create some variables first.');
            }
            if (!allCollections || allCollections.length === 0) {
                throw new Error('No variable collections found in this Figma file. Please create some variable collections first.');
            }
            console.log('🔄 Step 2: Collecting tokens...');
            const tokens = await tokenCollector_1.TokenCollector.collectAllTokensComprehensively(localVariables, allCollections);
            console.log(`📦 Collected ${tokens.length} tokens`);
            if (tokens.length === 0) {
                throw new Error('No tokens could be collected from the variables. Please check that your variables have values.');
            }
            console.log(`\n✅ COLLECTION RESULTS:`);
            console.log(`Tokens collected: ${tokens.length} / ${totalExpectedTokens} expected`);
            if (tokens.length < totalExpectedTokens * 0.9) {
                console.warn(`⚠️  WARNING: Collected ${tokens.length} tokens but expected ~${totalExpectedTokens}. Some tokens may be missing!`);
            }
            console.log('📊 Step 3: Analyzing tokens...');
            const tokenAnalysis = tokenCollector_1.TokenCollector.analyzeTokensComprehensively(tokens);
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
            console.log('📤 Step 5: Sending results to UI...');
            this.sendExportResults(files, format);
            console.log('✅ Export completed successfully');
        }
        catch (error) {
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
    static async exportStyles(format) {
        console.log('=== STYLES EXPORT STARTED ===');
        try {
            const localPaintStyles = await figma.getLocalPaintStylesAsync();
            const localTextStyles = await figma.getLocalTextStylesAsync();
            const localEffectStyles = await figma.getLocalEffectStylesAsync();
            if (localPaintStyles.length === 0 && localTextStyles.length === 0 && localEffectStyles.length === 0) {
                throw new Error('No local styles found in this Figma file');
            }
            const content = await this.generateStylesFile(localPaintStyles, localTextStyles, localEffectStyles, format);
            const filename = `styles.${stringUtils_1.StringUtils.getFileExtension(format)}`;
            figma.ui.postMessage({
                type: 'export-ready',
                format: format,
                filename: filename,
                content: content
            });
            console.log('✅ Styles export completed successfully');
        }
        catch (error) {
            console.error('Styles export failed:', error);
            figma.ui.postMessage({
                type: 'error',
                message: `Styles export failed: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    }
    static async generateFiles(tokenAnalysis, format) {
        const allFiles = {};
        for (const collection of tokenAnalysis.collections) {
            let collectionFiles = {};
            switch (format.toLowerCase()) {
                case 'css':
                    collectionFiles = formatGenerators_1.CSSGenerator.generateCollectionCSS(collection);
                    break;
                case 'js':
                case 'javascript':
                    collectionFiles = formatGenerators_1.JSGenerator.generateCollectionJS(collection);
                    break;
                case 'tailwind':
                    collectionFiles = formatGenerators_1.TailwindGenerator.generateCollectionTailwind(collection);
                    break;
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }
            Object.assign(allFiles, collectionFiles);
        }
        return allFiles;
    }
    static sendExportResults(files, format) {
        if (Object.keys(files).length > 1) {
            figma.ui.postMessage({
                type: 'export-multi-file',
                format: format,
                fileCount: Object.keys(files).length,
                files: files,
                instructions: `${Object.keys(files).length} files generated based on your Figma collections and modes.`
            });
        }
        else {
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
    static sendDirectDownload(files, format) {
        console.log('📤 Sending direct download...');
        if (Object.keys(files).length > 1) {
            figma.ui.postMessage({
                type: 'download-multi-file',
                format: format,
                fileCount: Object.keys(files).length,
                files: files,
                instructions: `${Object.keys(files).length} files ready for download.`
            });
        }
        else {
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
    static async generateStylesFile(paintStyles, textStyles, effectStyles, format) {
        let content = '';
        switch (format.toLowerCase()) {
            case 'css':
                content = '/* Generated Figma Styles */\n:root {\n';
                if (paintStyles && paintStyles.length > 0) {
                    content += '  /* Paint Styles */\n';
                    paintStyles.forEach(style => {
                        if (!style || !style.name)
                            return;
                        const name = stringUtils_1.StringUtils.tokenToCSSVariable(style.name);
                        let colorValue = 'rgba(0, 0, 0, 1)';
                        try {
                            if (style.paints && style.paints.length > 0) {
                                const paint = style.paints[0];
                                if (paint.type === 'SOLID' && paint.color) {
                                    const r = Math.round((paint.color.r || 0) * 255);
                                    const g = Math.round((paint.color.g || 0) * 255);
                                    const b = Math.round((paint.color.b || 0) * 255);
                                    const a = paint.opacity !== undefined ? paint.opacity : 1;
                                    if (a === 1) {
                                        colorValue = `rgb(${r}, ${g}, ${b})`;
                                    }
                                    else {
                                        colorValue = `rgba(${r}, ${g}, ${b}, ${a})`;
                                    }
                                }
                                else if (paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL') {
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
                        }
                        catch (error) {
                            console.warn(`Failed to extract color from paint style "${style.name}":`, error);
                        }
                        content += `  --${name}: ${colorValue};\n`;
                    });
                }
                if (textStyles && textStyles.length > 0) {
                    content += '\n  /* Text Styles */\n';
                    textStyles.forEach(style => {
                        if (!style || !style.name)
                            return;
                        const name = stringUtils_1.StringUtils.tokenToCSSVariable(style.name);
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
                                }
                                else if (style.lineHeight.unit === 'PERCENT') {
                                    content += `  --${name}-line-height: ${style.lineHeight.value}%;\n`;
                                }
                            }
                        }
                        catch (error) {
                            console.warn(`Failed to extract properties from text style "${style.name}":`, error);
                        }
                    });
                }
                if (effectStyles && effectStyles.length > 0) {
                    content += '\n  /* Effect Styles */\n';
                    effectStyles.forEach(style => {
                        if (!style || !style.name || !style.effects)
                            return;
                        const name = stringUtils_1.StringUtils.tokenToCSSVariable(style.name);
                        try {
                            style.effects.forEach((effect, index) => {
                                var _a, _b;
                                if (effect.type === 'DROP_SHADOW') {
                                    const x = ((_a = effect.offset) === null || _a === void 0 ? void 0 : _a.x) || 0;
                                    const y = ((_b = effect.offset) === null || _b === void 0 ? void 0 : _b.y) || 0;
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
                        }
                        catch (error) {
                            console.warn(`Failed to extract effects from style "${style.name}":`, error);
                        }
                    });
                }
                content += '}\n';
                break;
            case 'js':
            case 'javascript':
                content = '// Generated Figma Styles\nexport const styles = {\n';
                if (paintStyles && paintStyles.length > 0) {
                    paintStyles.forEach(style => {
                        if (!style || !style.name)
                            return;
                        const name = stringUtils_1.StringUtils.tokenToJSVariable(style.name);
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
                        }
                        catch (error) {
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
    static async previewFiles(format) {
        console.log('=== PREVIEWING FILES FOR EXPORT ===');
        try {
            const { localVariables, allCollections } = await figmaAnalyzer_1.FigmaAnalyzer.getCollectionDetails();
            const tokens = await tokenCollector_1.TokenCollector.collectAllTokensComprehensively(localVariables, allCollections);
            const tokenAnalysis = tokenCollector_1.TokenCollector.analyzeTokensComprehensively(tokens);
            const filePreviews = [];
            const extension = stringUtils_1.StringUtils.getFileExtension(format);
            tokenAnalysis.collections.forEach(collection => {
                collection.modes.forEach(mode => {
                    const filename = `${stringUtils_1.StringUtils.slugify(collection.name)}-${stringUtils_1.StringUtils.slugify(mode.name)}.${extension}`;
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
        }
        catch (error) {
            console.error('File preview failed:', error);
            throw error;
        }
    }
    static async exportSelectedFiles(format, selectedFiles) {
        console.log('=== SELECTED FILES EXPORT STARTED ===');
        console.log(`Selected files: ${selectedFiles.join(', ')}`);
        try {
            const { localVariables, allCollections, totalExpectedTokens } = await figmaAnalyzer_1.FigmaAnalyzer.getCollectionDetails();
            const tokens = await tokenCollector_1.TokenCollector.collectAllTokensComprehensively(localVariables, allCollections);
            const fullTokenAnalysis = tokenCollector_1.TokenCollector.analyzeTokensComprehensively(tokens);
            const filteredAnalysis = this.filterTokenAnalysisBySelection(fullTokenAnalysis, selectedFiles, format);
            const files = await this.generateFiles(filteredAnalysis, format);
            this.sendExportResults(files, format);
        }
        catch (error) {
            console.error('Selected files export failed:', error);
            figma.ui.postMessage({
                type: 'error',
                message: `Selected files export failed: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    }
    static async exportSelectedFilesDirect(format, selectedFiles) {
        console.log('=== DIRECT SELECTED FILES EXPORT STARTED ===');
        console.log(`Selected files: ${selectedFiles.join(', ')}`);
        try {
            const { localVariables, allCollections, totalExpectedTokens } = await figmaAnalyzer_1.FigmaAnalyzer.getCollectionDetails();
            const tokens = await tokenCollector_1.TokenCollector.collectAllTokensComprehensively(localVariables, allCollections);
            const fullTokenAnalysis = tokenCollector_1.TokenCollector.analyzeTokensComprehensively(tokens);
            const filteredAnalysis = this.filterTokenAnalysisBySelection(fullTokenAnalysis, selectedFiles, format);
            const files = await this.generateFiles(filteredAnalysis, format);
            if (Object.keys(files).length === 0) {
                throw new Error('No files were generated from the selected items');
            }
            this.sendDirectDownload(files, format);
        }
        catch (error) {
            console.error('Direct selected files export failed:', error);
            figma.ui.postMessage({
                type: 'error',
                message: `Direct export failed: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    }
    static filterTokenAnalysisBySelection(tokenAnalysis, selectedFiles, format) {
        const extension = stringUtils_1.StringUtils.getFileExtension(format);
        const filteredCollections = tokenAnalysis.collections.map(collection => {
            const filteredModes = collection.modes.filter(mode => {
                const expectedFilename = `${stringUtils_1.StringUtils.slugify(collection.name)}-${stringUtils_1.StringUtils.slugify(mode.name)}.${extension}`;
                return selectedFiles.includes(expectedFilename);
            });
            return Object.assign(Object.assign({}, collection), { modes: filteredModes });
        }).filter(collection => collection.modes.length > 0);
        return Object.assign(Object.assign({}, tokenAnalysis), { collections: filteredCollections });
    }
    static estimateFileSize(tokenCount, format) {
        if (!tokenCount || tokenCount < 0) {
            console.warn('Invalid token count for file size estimation:', tokenCount);
            return '0B';
        }
        if (!format || typeof format !== 'string') {
            console.warn('Invalid format for file size estimation:', format);
            return '0B';
        }
        let bytesPerToken;
        switch (format.toLowerCase()) {
            case 'css':
                bytesPerToken = 45;
                break;
            case 'js':
            case 'javascript':
                bytesPerToken = 35;
                break;
            case 'tailwind':
                bytesPerToken = 50;
                break;
            default:
                bytesPerToken = 40;
        }
        const estimatedBytes = tokenCount * bytesPerToken + 200;
        if (estimatedBytes < 1024) {
            return `${estimatedBytes}B`;
        }
        else if (estimatedBytes < 1024 * 1024) {
            return `${Math.round(estimatedBytes / 1024)}KB`;
        }
        else {
            return `${Math.round(estimatedBytes / (1024 * 1024))}MB`;
        }
    }
}
exports.ExportService = ExportService;


/***/ }),

/***/ 994:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TailwindGenerator = exports.JSGenerator = exports.CSSGenerator = exports.BaseGenerator = void 0;
const stringUtils_1 = __webpack_require__(820);
class BaseGenerator {
    static generateFileComment(collectionName, modeName) {
        return `Generated by ExportEase Plugin\nCollection: ${collectionName}\nMode: ${modeName}\nGenerated: ${new Date().toISOString()}`;
    }
}
exports.BaseGenerator = BaseGenerator;
class CSSGenerator extends BaseGenerator {
    static generateCollectionCSS(collection) {
        const files = {};
        if (!collection || !collection.name || !collection.modes) {
            console.warn('Invalid collection provided to CSS generator:', collection);
            return files;
        }
        collection.modes.forEach(mode => {
            if (!mode || !mode.name || !mode.tokens) {
                console.warn(`Skipping invalid mode in collection "${collection.name}":`, mode);
                return;
            }
            const fileName = `${stringUtils_1.StringUtils.slugify(collection.name)}-${stringUtils_1.StringUtils.slugify(mode.name)}.css`;
            if (files[fileName]) {
                console.warn(`Duplicate filename detected: ${fileName}. Adding suffix.`);
                const timestamp = Date.now();
                const newFileName = `${stringUtils_1.StringUtils.slugify(collection.name)}-${stringUtils_1.StringUtils.slugify(mode.name)}-${timestamp}.css`;
                files[newFileName] = this.generateCSS(mode.tokens, collection.name, mode.name);
            }
            else {
                files[fileName] = this.generateCSS(mode.tokens, collection.name, mode.name);
            }
        });
        return files;
    }
    static generateComprehensiveCSS(group) {
        let css = `/* Generated by ExportEase Plugin */\n\n:root {\n`;
        group.collections.forEach(collection => {
            css += `  /* ${collection.name} */\n`;
            collection.modes.forEach(mode => {
                css += `  /* ${mode.name} */\n`;
                mode.tokens.forEach(token => {
                    const cssVar = stringUtils_1.StringUtils.tokenToCSSVariable(token.name);
                    css += `  --${cssVar}: ${token.value};\n`;
                });
            });
            css += `\n`;
        });
        css += `}\n`;
        return css;
    }
    static generateCSS(tokens, collectionName, modeName) {
        if (!tokens || !Array.isArray(tokens)) {
            console.warn('Invalid tokens provided to CSS generator');
            return `/* No valid tokens found for ${collectionName} - ${modeName} */\n:root {\n}\n`;
        }
        if (!collectionName || !modeName) {
            console.warn('Missing collection or mode name for CSS generation');
            return `/* Missing collection/mode information */\n:root {\n}\n`;
        }
        let css = `/* ${this.generateFileComment(collectionName, modeName)} */\n\n:root {\n`;
        tokens.forEach(token => {
            if (!token || !token.name || token.value === undefined || token.value === null) {
                console.warn('Skipping invalid token:', token);
                return;
            }
            const cssVar = stringUtils_1.StringUtils.tokenToCSSVariable(token.name);
            const escapedValue = String(token.value).replace(/"/g, '\\"');
            css += `  --${cssVar}: ${escapedValue};\n`;
        });
        css += `}\n`;
        return css;
    }
}
exports.CSSGenerator = CSSGenerator;
class JSGenerator extends BaseGenerator {
    static generateCollectionJS(collection) {
        const files = {};
        collection.modes.forEach(mode => {
            const fileName = `${stringUtils_1.StringUtils.slugify(collection.name)}-${stringUtils_1.StringUtils.slugify(mode.name)}.js`;
            const content = this.generateJS(mode.tokens, collection.name, mode.name);
            files[fileName] = content;
        });
        return files;
    }
    static generateComprehensiveJS(group) {
        let js = `// Generated by ExportEase Plugin\n\n`;
        js += `export const tokens = {\n`;
        group.collections.forEach(collection => {
            const collectionKey = stringUtils_1.StringUtils.slugify(collection.name);
            js += `  ${collectionKey}: {\n`;
            collection.modes.forEach(mode => {
                const modeKey = stringUtils_1.StringUtils.slugify(mode.name);
                js += `    ${modeKey}: {\n`;
                mode.tokens.forEach(token => {
                    const tokenKey = stringUtils_1.StringUtils.tokenToJSVariable(token.name);
                    js += `      ${tokenKey}: '${token.value}',\n`;
                });
                js += `    },\n`;
            });
            js += `  },\n`;
        });
        js += `};\n\nexport default tokens;\n`;
        return js;
    }
    static generateJS(tokens, collectionName, modeName) {
        let js = `// ${this.generateFileComment(collectionName, modeName)}\n\n`;
        js += `export const ${stringUtils_1.StringUtils.slugify(collectionName)}${stringUtils_1.StringUtils.toPascalCase(modeName)} = {\n`;
        tokens.forEach(token => {
            const tokenKey = stringUtils_1.StringUtils.tokenToJSVariable(token.name);
            js += `  ${tokenKey}: '${token.value}',\n`;
        });
        js += `};\n\nexport default ${stringUtils_1.StringUtils.slugify(collectionName)}${stringUtils_1.StringUtils.toPascalCase(modeName)};\n`;
        return js;
    }
}
exports.JSGenerator = JSGenerator;
class TailwindGenerator extends BaseGenerator {
    static generateCollectionTailwind(collection) {
        const files = {};
        collection.modes.forEach(mode => {
            const fileName = `${stringUtils_1.StringUtils.slugify(collection.name)}-${stringUtils_1.StringUtils.slugify(mode.name)}.js`;
            const content = this.generateTailwind(mode.tokens, collection.name, mode.name);
            files[fileName] = content;
        });
        return files;
    }
    static generateComprehensiveTailwind(group) {
        let tailwind = `// Generated by ExportEase Plugin\n// Tailwind CSS configuration\n\n`;
        tailwind += `module.exports = {\n`;
        tailwind += `  theme: {\n`;
        tailwind += `    extend: {\n`;
        const colorTokens = [];
        const spacingTokens = [];
        const otherTokens = [];
        group.collections.forEach(collection => {
            collection.modes.forEach(mode => {
                mode.tokens.forEach(token => {
                    if (token.type === 'COLOR') {
                        colorTokens.push(token);
                    }
                    else if (token.type === 'FLOAT' && (token.name.includes('spacing') || token.name.includes('gap') || token.name.includes('margin') || token.name.includes('padding'))) {
                        spacingTokens.push(token);
                    }
                    else {
                        otherTokens.push(token);
                    }
                });
            });
        });
        if (colorTokens.length > 0) {
            tailwind += `      colors: {\n`;
            colorTokens.forEach(token => {
                const tailwindVar = stringUtils_1.StringUtils.tokenToTailwindVariable(token.name);
                tailwind += `        '${tailwindVar}': '${token.value}',\n`;
            });
            tailwind += `      },\n`;
        }
        if (spacingTokens.length > 0) {
            tailwind += `      spacing: {\n`;
            spacingTokens.forEach(token => {
                const tailwindVar = stringUtils_1.StringUtils.tokenToTailwindVariable(token.name);
                tailwind += `        '${tailwindVar}': '${token.value}',\n`;
            });
            tailwind += `      },\n`;
        }
        tailwind += `    },\n`;
        tailwind += `  },\n`;
        tailwind += `};\n`;
        return tailwind;
    }
    static generateTailwind(tokens, collectionName, modeName) {
        let tailwind = `// ${this.generateFileComment(collectionName, modeName)}\n// Tailwind CSS configuration\n\n`;
        tailwind += `module.exports = {\n`;
        tailwind += `  theme: {\n`;
        tailwind += `    extend: {\n`;
        tailwind += `      // ${collectionName} - ${modeName}\n`;
        const byType = {};
        tokens.forEach(token => {
            if (!byType[token.type])
                byType[token.type] = [];
            byType[token.type].push(token);
        });
        Object.entries(byType).forEach(([type, typeTokens]) => {
            const section = type === 'COLOR' ? 'colors' : 'variables';
            tailwind += `      ${section}: {\n`;
            typeTokens.forEach(token => {
                const tailwindVar = stringUtils_1.StringUtils.tokenToTailwindVariable(token.name);
                tailwind += `        '${tailwindVar}': '${token.value}',\n`;
            });
            tailwind += `      },\n`;
        });
        tailwind += `    },\n`;
        tailwind += `  },\n`;
        tailwind += `};\n`;
        return tailwind;
    }
}
exports.TailwindGenerator = TailwindGenerator;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it uses a non-standard name for the exports (exports).
(() => {
var exports = __webpack_exports__;
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
const figmaAnalyzer_1 = __webpack_require__(346);
const exportService_1 = __webpack_require__(952);
figma.showUI(__html__, { width: 420, height: 600 });
figma.ui.onmessage = async (msg) => {
    var _a, _b;
    console.log('=== PLUGIN MESSAGE RECEIVED ===');
    console.log('Message type:', msg === null || msg === void 0 ? void 0 : msg.type);
    console.log('Full message:', JSON.stringify(msg, null, 2));
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
                console.log(`📦 Processing selected export: ${msg.format} from ${msg.source}, files: ${(_a = msg.selectedFiles) === null || _a === void 0 ? void 0 : _a.length}`);
                if (!msg.format || !msg.source || !msg.selectedFiles) {
                    throw new Error('Format, source, and selectedFiles are required for selected export');
                }
                await handleSelectedExport(msg.format, msg.source, msg.selectedFiles);
                console.log(`✅ Selected export completed: ${msg.format} from ${msg.source}`);
                break;
            case 'export-selected-direct':
                console.log(`🚀 Processing direct selected export: ${msg.format} from ${msg.source}, files: ${(_b = msg.selectedFiles) === null || _b === void 0 ? void 0 : _b.length}`);
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
    }
    catch (error) {
        console.error(`💥 Error handling message type "${msg.type}":`, error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        figma.ui.postMessage({
            type: 'error',
            message: `Operation failed: ${error instanceof Error ? error.message : String(error)}`
        });
    }
};
async function handleExport(format, source) {
    console.log(`Starting export: ${format} from ${source}`);
    if (source === 'variables') {
        await exportService_1.ExportService.exportVariables(format);
    }
    else if (source === 'styles') {
        await exportService_1.ExportService.exportStyles(format);
    }
    else {
        throw new Error(`Unknown export source: ${source}`);
    }
}
async function handleFilePreview(format, source) {
    console.log(`Starting file preview: ${format} from ${source}`);
    if (source === 'variables') {
        const preview = await exportService_1.ExportService.previewFiles(format);
        figma.ui.postMessage(Object.assign({ type: 'file-preview', format,
            source }, preview));
    }
    else {
        throw new Error(`File preview not supported for source: ${source}`);
    }
}
async function handleSelectedExport(format, source, selectedFiles) {
    console.log(`Starting selected export: ${format} from ${source}`);
    console.log(`Selected files: ${selectedFiles.join(', ')}`);
    if (source === 'variables') {
        await exportService_1.ExportService.exportSelectedFiles(format, selectedFiles);
    }
    else {
        throw new Error(`Selected export not supported for source: ${source}`);
    }
}
async function handleSelectedExportDirect(format, source, selectedFiles) {
    console.log(`Starting direct selected export: ${format} from ${source}`);
    console.log(`Selected files: ${selectedFiles.join(', ')}`);
    if (source === 'variables') {
        await exportService_1.ExportService.exportSelectedFilesDirect(format, selectedFiles);
    }
    else {
        throw new Error(`Direct selected export not supported for source: ${source}`);
    }
}
async function init() {
    try {
        const result = await figmaAnalyzer_1.FigmaAnalyzer.analyzeAvailableExports();
        figma.ui.postMessage({
            type: 'export-status',
            hasExports: result.hasExports,
            stylesCount: result.stylesCount,
            variablesCount: result.variablesCount,
            breakdown: result.breakdown
        });
    }
    catch (error) {
        console.error('Initialization error:', error);
        figma.ui.postMessage({
            type: 'error',
            message: `Failed to analyze exports: ${error instanceof Error ? error.message : String(error)}`
        });
    }
}
init();

})();

/******/ })()
;