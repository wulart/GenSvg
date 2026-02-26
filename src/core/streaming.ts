import { SVGSpec } from "./types";

export interface SpecPatch {
  op: "set" | "add" | "replace" | "remove";
  path: string;
  value?: unknown;
}

export class SpecStreamCompiler<TSpec extends SVGSpec = SVGSpec> {
  private result: Partial<TSpec> = {};
  private elements: Record<string, unknown> = {};

  push(chunk: string): { result: Partial<TSpec>; newPatches: SpecPatch[] } {
    const patches: SpecPatch[] = [];

    for (const line of chunk.split("\n")) {
      if (!line.trim()) continue;

      try {
        const patch = JSON.parse(line) as SpecPatch;
        patches.push(patch);
        this.applyPatch(patch);
      } catch (e) {
        // Ignore invalid JSON lines during streaming
      }
    }

    return {
      result: this.getResult(),
      newPatches: patches,
    };
  }

  private applyPatch(patch: SpecPatch): void {
    const { op, path, value } = patch;

    // Handle root and viewport
    if (path === "/root") {
      if (op === "set" || op === "add" || op === "replace") {
        this.result = { ...this.result, root: value as string };
      } else if (op === "remove") {
        const { root, ...rest } = this.result;
        this.result = rest as Partial<TSpec>;
      }
      return;
    }

    if (path === "/viewport") {
      if (op === "set" || op === "add" || op === "replace") {
        this.result = { ...this.result, viewport: value as any };
      } else if (op === "remove") {
        const { viewport, ...rest } = this.result;
        this.result = rest as Partial<TSpec>;
      }
      return;
    }

    // Handle elements
    if (path.startsWith("/elements/")) {
      const parts = path.split("/").filter(Boolean); // ["elements", "key", "props", "fill"]
      const key = parts[1];

      if (!key) return;

      if (parts.length === 2) {
        // Modifying the entire element
        if (op === "set" || op === "add" || op === "replace") {
          this.elements[key] = value;
        } else if (op === "remove") {
          delete this.elements[key];
        }
      } else {
        // Deep modification (e.g., /elements/rect1/props/fill)
        const element = this.elements[key] as any;
        if (!element) return;

        let current = element;
        for (let i = 2; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part]) current[part] = {};
          current = current[part];
        }

        const lastPart = parts[parts.length - 1];
        if (op === "set" || op === "add" || op === "replace") {
          current[lastPart] = value;
        } else if (op === "remove") {
          if (Array.isArray(current)) {
            const index = parseInt(lastPart, 10);
            if (!isNaN(index)) current.splice(index, 1);
          } else {
            delete current[lastPart];
          }
        }
      }
    }
  }

  getResult(): TSpec {
    return {
      ...this.result,
      elements: this.elements,
    } as TSpec;
  }
}

export function createSpecStreamCompiler<TSpec extends SVGSpec = SVGSpec>() {
  return new SpecStreamCompiler<TSpec>();
}
