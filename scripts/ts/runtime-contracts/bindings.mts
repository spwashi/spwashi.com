import path from 'node:path';
import ts from 'typescript';

/** Binding failures are actionable independently of the legacy JS inference debt. */
const BINDING_CODES = new Set([
  1192, // no default export
  2304, // unknown name
  2305, // missing named export
  2306, // imported file is not a module
  2307, // unresolved module
  2459, // local declaration was not exported
  2460, // local declaration exported under another name
  2552, // unknown name, with a spelling suggestion
  2613, // no default export, with a suggestion
  2614, // missing named export, with a default-import suggestion
  2724, // missing named export, with a spelling suggestion
  2834, // extension required by the module resolver
  2835, // extension required, with a suggestion
  2882, // unresolved side-effect import
]);

export type BindingFinding = {
  file: string;
  line: number;
  column: number;
  code: number;
  message: string;
};

/** Configuration and syntax must succeed before semantic filtering is meaningful. */
export function collectRuntimeBindingFindings(project: string): BindingFinding[] {
  const configPath = path.resolve(project);
  const root = path.dirname(configPath);
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config ?? {}, ts.sys, root, {
    noEmit: true,
    noUncheckedSideEffectImports: true,
  }, configPath);
  let diagnostics: readonly ts.Diagnostic[] = [
    ...(config.error ? [config.error] : []),
    ...parsed.errors,
  ];
  if (!diagnostics.length) {
    const program = ts.createProgram(parsed.fileNames, parsed.options);
    diagnostics = [
      ...program.getOptionsDiagnostics(),
      ...program.getGlobalDiagnostics(),
      ...program.getSyntacticDiagnostics(),
      ...program.getSemanticDiagnostics().filter((item) => BINDING_CODES.has(item.code)),
    ];
  }
  return diagnostics.map((item) => {
    const position = item.file?.getLineAndCharacterOfPosition(item.start ?? 0);
    return {
      file: item.file ? path.relative(root, item.file.fileName).split(path.sep).join('/') : path.basename(configPath),
      line: position ? position.line + 1 : 0,
      column: position ? position.character + 1 : 0,
      code: item.code,
      message: ts.flattenDiagnosticMessageText(item.messageText, '\n'),
    };
  }).sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column || a.code - b.code);
}
