#!/usr/bin/env npx ts-node
/**
 * Import Migration Script
 * 
 * This script automatically converts relative imports to path aliases
 * according to the project's alias configuration.
 * 
 * Usage:
 *   npm run migrate:imports
 *   or
 *   npx ts-node scripts/migrate-imports.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface AliasMapping {
  alias: string;
  path: string;
  pattern: RegExp;
}

// Define alias mappings based on tsconfig.json
const ALIAS_MAPPINGS: AliasMapping[] = [
  { alias: '@components', path: './src/components', pattern: /\.\.\/\.\.\/components|\.\.\/components|\.\.\/\.\.\/\.\.\/components/ },
  { alias: '@screens', path: './src/screens', pattern: /\.\.\/\.\.\/screens|\.\.\/screens|\.\.\/\.\.\/\.\.\/screens/ },
  { alias: '@services', path: './src/services', pattern: /\.\.\/\.\.\/services|\.\.\/services|\.\.\/\.\.\/\.\.\/services/ },
  { alias: '@stores', path: './src/stores', pattern: /\.\.\/\.\.\/stores|\.\.\/stores|\.\.\/\.\.\/\.\.\/stores/ },
  { alias: '@hooks', path: './src/hooks', pattern: /\.\.\/\.\.\/hooks|\.\.\/hooks|\.\.\/\.\.\/\.\.\/hooks/ },
  { alias: '@utils', path: './src/utils', pattern: /\.\.\/\.\.\/utils|\.\.\/utils|\.\.\/\.\.\/\.\.\/utils/ },
  { alias: '@context', path: './src/context', pattern: /\.\.\/\.\.\/context|\.\.\/context|\.\.\/\.\.\/\.\.\/context/ },
  { alias: '@types', path: './src/types', pattern: /\.\.\/\.\.\/types|\.\.\/types|\.\.\/\.\.\/\.\.\/types/ },
  { alias: '@theme', path: './src/theme', pattern: /\.\.\/\.\.\/theme|\.\.\/theme|\.\.\/\.\.\/\.\.\/theme/ },
  { alias: '@navigation', path: './src/navigation', pattern: /\.\.\/\.\.\/navigation|\.\.\/navigation|\.\.\/\.\.\/\.\.\/navigation/ },
  { alias: '@config', path: './src/config', pattern: /\.\.\/\.\.\/config|\.\.\/config|\.\.\/\.\.\/\.\.\/config/ },
  { alias: '@constants', path: './src/constants', pattern: /\.\.\/\.\.\/constants|\.\.\/constants|\.\.\/\.\.\/\.\.\/constants/ },
  { alias: '@test-utils', path: './src/test-utils', pattern: /\.\.\/\.\.\/test-utils|\.\.\/test-utils|\.\.\/\.\.\/\.\.\/test-utils/ },
  { alias: '@', path: './src', pattern: /\.\.\/\.\.\/src|\.\.\/src|\.\.\/\.\.\/\.\.\/src/ },
];

interface MigrationStats {
  filesProcessed: number;
  filesModified: number;
  importsReplaced: number;
  errors: string[];
}

class ImportMigrator {
  private stats: MigrationStats = {
    filesProcessed: 0,
    filesModified: 0,
    importsReplaced: 0,
    errors: [],
  };

  /**
   * Convert a relative import path to an alias path
   */
  private convertToAlias(currentFilePath: string, importPath: string): string | null {
    // Skip non-relative imports
    if (!importPath.startsWith('./') && !importPath.startsWith('../')) {
      return null;
    }

    // Resolve the absolute path of the import
    const currentDir = path.dirname(currentFilePath);
    const absoluteImportPath = path.resolve(currentDir, importPath);
    const projectRoot = process.cwd();
    const relativeFromRoot = path.relative(projectRoot, absoluteImportPath);

    // Find matching alias
    for (const mapping of ALIAS_MAPPINGS) {
      const aliasAbsolutePath = path.resolve(projectRoot, mapping.path);
      
      if (absoluteImportPath.startsWith(aliasAbsolutePath)) {
        const relativePath = path.relative(aliasAbsolutePath, absoluteImportPath);
        return relativePath ? `${mapping.alias}/${relativePath}` : mapping.alias;
      }
    }

    return null;
  }

  /**
   * Process a single file and convert its imports
   */
  private processFile(filePath: string): boolean {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      let newContent = content;

      // Regex to match import statements
      const importRegex = /^(\s*import\s+(?:{[^}]*}|\w+|[*]\s+as\s+\w+|\w+,\s*{[^}]*})\s+from\s+['"])([^'"]+)(['"];?)$/gm;

      newContent = content.replace(importRegex, (match, beforePath, importPath, afterPath) => {
        const aliasPath = this.convertToAlias(filePath, importPath);
        
        if (aliasPath) {
          modified = true;
          this.stats.importsReplaced++;
          return `${beforePath}${aliasPath}${afterPath}`;
        }
        
        return match;
      });

      // Also handle require statements
      const requireRegex = /^(\s*(?:const|let|var)\s+.*?=\s*require\s*\(\s*['"])([^'"]+)(['"]\s*\);?)$/gm;
      
      newContent = newContent.replace(requireRegex, (match, beforePath, importPath, afterPath) => {
        const aliasPath = this.convertToAlias(filePath, importPath);
        
        if (aliasPath) {
          modified = true;
          this.stats.importsReplaced++;
          return `${beforePath}${aliasPath}${afterPath}`;
        }
        
        return match;
      });

      if (modified) {
        fs.writeFileSync(filePath, newContent);
        this.stats.filesModified++;
        console.log(`✓ Modified: ${path.relative(process.cwd(), filePath)}`);
      }

      this.stats.filesProcessed++;
      return modified;
    } catch (error) {
      const errorMessage = `Error processing ${filePath}: ${error}`;
      this.stats.errors.push(errorMessage);
      console.error(`✗ ${errorMessage}`);
      return false;
    }
  }

  /**
   * Get all TypeScript/JavaScript files in src directory
   */
  private async getSourceFiles(): Promise<string[]> {
    const patterns = [
      'src/**/*.ts',
      'src/**/*.tsx',
      'src/**/*.js',
      'src/**/*.jsx',
    ];

    const files: string[] = [];
    
    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/*.d.ts',
          '**/coverage/**',
          '**/.expo/**',
        ],
      });
      files.push(...matches);
    }

    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Run the migration process
   */
  public async migrate(): Promise<MigrationStats> {
    console.log('🚀 Starting import migration...\n');

    const files = await this.getSourceFiles();
    console.log(`Found ${files.length} files to process\n`);

    for (const file of files) {
      this.processFile(file);
    }

    return this.stats;
  }

  /**
   * Print migration results
   */
  public printResults(): void {
    console.log('\n📊 Migration Results:');
    console.log('====================================');
    console.log(`Files processed: ${this.stats.filesProcessed}`);
    console.log(`Files modified: ${this.stats.filesModified}`);
    console.log(`Imports replaced: ${this.stats.importsReplaced}`);
    console.log(`Errors: ${this.stats.errors.length}`);

    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.stats.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (this.stats.filesModified > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('  1. Run `npm run lint --fix` to fix any formatting issues');
      console.log('  2. Run `npm run typecheck` to verify TypeScript compilation');
      console.log('  3. Run `npm test` to ensure all tests pass');
      console.log('  4. Test the app on both iOS and Android');
    } else {
      console.log('\n✨ No imports needed to be migrated!');
    }
  }
}

// Main execution
if (require.main === module) {
  const migrator = new ImportMigrator();
  
  migrator.migrate()
    .then(() => {
      migrator.printResults();
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { ImportMigrator };