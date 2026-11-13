// The API reference on a component's page, read from its code at build time, so nobody writes it by hand (the docs
// site's pattern, bin/docs.mjs): each React component's props from its types, with the comment over each prop, and each
// exported function of its behavior module with its signature. Props a component takes from React's own element types
// (ButtonHTMLAttributes and the like) are not listed; the table says which element's it also takes.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

interface Prop {
  name: string;
  type: string;
  required: boolean;
  about: string;
}
interface ReactPart {
  name: string;
  props: Prop[];
  // The element whose own attributes it also takes ("button" for ButtonHTMLAttributes<HTMLButtonElement>), if any.
  element: string | null;
}
interface Fn {
  name: string;
  signature: string;
  about: string;
}
export interface Api {
  react: ReactPart[];
  functions: Fn[];
}

/** The comment written over a declaration, `//` lines or a block, as one line of text. */
function commentOver(node: ts.Node): string {
  const sf = node.getSourceFile();
  const ranges = ts.getLeadingCommentRanges(sf.text, node.getFullStart()) ?? [];
  return ranges
    .map((r) =>
      sf.text
        .slice(r.pos, r.end)
        .replace(/^\/\*\*?|\*\/$/g, "")
        .split("\n")
        .map((l) => l.replace(/^\s*(\/\/+|\*)\s?/, "").trim())
        .join(" "),
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

/** Every component's API, by name, for the names given: those with a React wrapper or a behavior module. */
export function apiOf(root: string, names: string[]): Map<string, Api> {
  const file = (n: string, ext: string) => resolve(root, "components", n, `${n}${ext}`);
  const files = names.flatMap((n) => [file(n, ".react.tsx"), file(n, ".ts")].filter(existsSync));
  const config = ts.parseJsonConfigFileContent(
    ts.readConfigFile(resolve(root, "tsconfig.json"), (p) => readFileSync(p, "utf8")).config,
    ts.sys,
    root,
  );
  const program = ts.createProgram(files, { ...config.options, noEmit: true });
  const checker = program.getTypeChecker();
  const own = (d: ts.Declaration) => !d.getSourceFile().fileName.includes("node_modules");

  const propsOf = (type: ts.Type, at: ts.Node): { props: Prop[]; element: string | null } => {
    const props: Prop[] = [];
    let element: string | null = null;
    for (const p of checker.getPropertiesOfType(type)) {
      const decl = p.valueDeclaration ?? p.declarations?.[0];
      if (!decl) continue;
      if (!own(decl)) {
        // An element's own attributes: name the element once, from React's HTMLAttributes types.
        const owner = (decl.parent as ts.InterfaceDeclaration | undefined)?.name?.getText();
        if (!element && owner && owner.endsWith("HTMLAttributes")) {
          const m = /(\w+)HTMLAttributes$/.exec(owner)?.[1];
          element = m && m !== "" && m !== "DOM" && m !== "All" ? m.toLowerCase() : "element";
        }
        continue;
      }
      const typeNode = (decl as ts.PropertySignature).type;
      props.push({
        name: p.name,
        type: oneLine(
          typeNode
            ? typeNode.getText()
            : checker.typeToString(checker.getTypeOfSymbolAtLocation(p, at)),
        ),
        required: !(p.flags & ts.SymbolFlags.Optional),
        about: commentOver(decl),
      });
    }
    return { props, element };
  };

  const out = new Map<string, Api>();
  for (const n of names) {
    const api: Api = { react: [], functions: [] };
    for (const [path, react] of [
      [file(n, ".react.tsx"), true],
      [file(n, ".ts"), false],
    ] as const) {
      const sf = program.getSourceFile(path);
      if (!sf) continue;
      const moduleSymbol = checker.getSymbolAtLocation(sf);
      if (!moduleSymbol) continue;
      for (const sym of checker.getExportsOfModule(moduleSymbol)) {
        const decl = sym.valueDeclaration;
        if (!decl || decl.getSourceFile() !== sf) continue;
        const type = checker.getTypeOfSymbolAtLocation(sym, decl);
        const sig = type.getCallSignatures()[0];
        if (!sig) continue;
        const node = ts.isVariableDeclaration(decl) ? decl.parent.parent : decl;
        if (react && /^[A-Z]/.test(sym.name)) {
          const param = sig.getParameters()[0];
          const { props, element } = param
            ? propsOf(checker.getTypeOfSymbolAtLocation(param, decl), decl)
            : { props: [], element: null };
          api.react.push({ name: sym.name, props, element });
        } else if (!react || /^use[A-Z]/.test(sym.name)) {
          api.functions.push({
            name: sym.name,
            signature: oneLine(checker.signatureToString(sig)),
            about: commentOver(node),
          });
        }
      }
    }
    if (api.react.length || api.functions.length) out.set(n, api);
  }
  return out;
}
