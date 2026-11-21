import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';

/** Execute the real TypeScript module against explicit in-memory service stubs. */
export async function loadSourceModule(
  sourceUrl: URL,
  imports: Record<string, Record<string, unknown>>,
  env: Record<string, string> = {},
) {
  const source = stripTypeScriptTypes(readFileSync(sourceUrl, 'utf8'));
  const context = createContext({
    URL,
    console,
    process: { env: { ...env } },
  });
  const sourceModule = new SourceTextModule(source, {
    context,
    identifier: fileURLToPath(sourceUrl),
  });

  await sourceModule.link(async (specifier) => {
    assert.ok(Object.hasOwn(imports, specifier), 'Unexpected import: ' + specifier);
    const exports = imports[specifier];
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) {
        this.setExport(name, value);
      }
    }, { context, identifier: specifier });
  });
  await sourceModule.evaluate();
  return sourceModule.namespace;
}
