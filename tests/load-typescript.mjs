import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compileFunction } from "node:vm";
import ts from "typescript";

const root = fileURLToPath(new URL("../src/", import.meta.url));
const requirePackage = createRequire(import.meta.url);

/** Load trusted application code in Node without a second TypeScript build. */
export function createSourceLoader(overrides = {}) {
  const cache = new Map();

  function load(path) {
    const directPath = resolve(root, path.endsWith(".ts") ? path : `${path}.ts`);
    const filename = existsSync(directPath) ? directPath : resolve(root, path, "index.ts");
    const cached = cache.get(filename);
    if (cached) return cached.exports;

    const loaded = { exports: {} };
    cache.set(filename, loaded);
    const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    });
    const loadImport = (id) => {
      if (Object.hasOwn(overrides, id)) return overrides[id];
      if (id.startsWith("@/")) return load(id.slice(2));
      if (id.startsWith(".")) return load(resolve(dirname(filename), id));
      return requirePackage(id);
    };
    compileFunction(outputText, ["require", "module", "exports"], { filename })(loadImport, loaded, loaded.exports);
    return loaded.exports;
  }

  return load;
}
