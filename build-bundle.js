const fs = require('fs');
const path = require('path');

// Read all the modular TypeScript files and combine them
function combineModules() {
  const srcDir = './src';
  const outputFile = './code.ts';
  
  // Read all the module files in order
  const typesContent = fs.readFileSync(path.join(srcDir, 'types.ts'), 'utf8');
  const stringUtilsContent = fs.readFileSync(path.join(srcDir, 'utils/stringUtils.ts'), 'utf8');
  const figmaAnalyzerContent = fs.readFileSync(path.join(srcDir, 'analyzers/figmaAnalyzer.ts'), 'utf8');
  const tokenCollectorContent = fs.readFileSync(path.join(srcDir, 'collectors/tokenCollector.ts'), 'utf8');
  const formatGeneratorsContent = fs.readFileSync(path.join(srcDir, 'generators/formatGenerators.ts'), 'utf8');
  const exportServiceContent = fs.readFileSync(path.join(srcDir, 'services/exportService.ts'), 'utf8');
  const mainContent = fs.readFileSync(path.join(srcDir, 'main.ts'), 'utf8');
  
  // Remove import/export statements and combine
  const cleanContent = (content) => {
    return content
      .replace(/^import.*from.*$/gm, '') // Remove import statements
      .replace(/^export\s+/gm, '') // Remove export keywords
      .replace(/export\s+\{[^}]*\}/g, '') // Remove export blocks
      .replace(/^\s*$/gm, '') // Remove empty lines
      .trim();
  };
  
  // Combine all content
  const combinedContent = `
// ExportEase Plugin - Figma Design Token Exporter
// Author: Sepanta Pouya
// License: MIT
// Combined modular build

${cleanContent(typesContent)}

${cleanContent(stringUtilsContent)}

${cleanContent(figmaAnalyzerContent)}

${cleanContent(tokenCollectorContent)}

${cleanContent(formatGeneratorsContent)}

${cleanContent(exportServiceContent)}

${cleanContent(mainContent)}
`.trim();
  
  // Write the combined file
  fs.writeFileSync(outputFile, combinedContent);
  console.log('✅ Bundle created: code.ts');
}

combineModules(); 