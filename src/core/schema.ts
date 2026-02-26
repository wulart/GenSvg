import { z } from "zod";
import { Catalog, SVGElementDef, SVGSpec } from "./types";

export function defineSVGSchema(builder: any) {
  const createType = (type: string, shape?: any) => ({
    type,
    shape,
    optional: function () {
      return { ...this, isOptional: true };
    },
  });

  return {
    definition: builder({
      object: (shape: any) => createType("object", shape),
      string: () => createType("string"),
      record: (type: any) => createType("record", type),
      ref: (path: string) => createType("ref", path),
      number: () => createType("number"),
      map: (shape: any) => createType("map", shape),
      zod: () => createType("zod"),
    }),
  };
}

export function defineSVGCatalog(
  schema: any,
  data: { elements: Record<string, SVGElementDef> },
): Catalog {
  return {
    schema,
    data,
    validate: (spec: unknown) => {
      try {
        const parsed = spec as SVGSpec;
        if (!parsed.root) throw new Error("Missing root");
        if (!parsed.elements) throw new Error("Missing elements");

        // Deep validation of all elements using Zod
        for (const [key, el] of Object.entries(parsed.elements)) {
          const def = data.elements[el.type];
          if (!def)
            throw new Error(`Unknown element type: ${el.type} at key: ${key}`);
          def.props.parse(el.props || {});
        }

        return { success: true, data: parsed };
      } catch (error) {
        return { success: false, error };
      }
    },
    prompt: (options?: { system?: string; customRules?: string[] }) => {
      const elementsDesc = Object.entries(data.elements)
        .map(([name, def]) => {
          let propsDesc = "{}";
          if (def.props instanceof z.ZodObject) {
            const shape = def.props.shape;
            propsDesc = JSON.stringify(
              Object.keys(shape).reduce(
                (acc, key) => {
                  acc[key] = "value";
                  return acc;
                },
                {} as Record<string, string>,
              ),
            );
          }
          return `- ${name}: ${def.description}. Props: ${propsDesc}`;
        })
        .join("\n");

      return `${options?.system || "You are an SVG generator."}
${options?.customRules ? options.customRules.map((r: string) => `- ${r}`).join("\n") : ""}

Available elements:
${elementsDesc}

You must output the drawing as a sequence of JSON objects, one per line (JSONL format). Each JSON object represents a JSON Patch (RFC 6902) to the SVG spec.
Do not include any markdown formatting or extra text. Output ONLY valid JSONL.

JSON schema for each line:
{"op": "add", "path": "/root", "value": "rootElementKey"}
{"op": "add", "path": "/viewport", "value": {"width": 500, "height": 500}}
{"op": "add", "path": "/elements/elementKey", "value": {"key": "elementKey", "type": "ElementType", "props": {...}, "children": ["childKey1"]}}
{"op": "replace", "path": "/elements/elementKey/props/fill", "value": "#ff0000"}

Example:
{"op":"add","path":"/viewport","value":{"width":500,"height":500}}
{"op":"add","path":"/root","value":"bg"}
{"op":"add","path":"/elements/bg","value":{"key":"bg","type":"Rect","props":{"x":0,"y":0,"width":500,"height":500,"fill":"#f0f0f0"}}}
{"op":"add","path":"/elements/circle1","value":{"key":"circle1","type":"Circle","props":{"cx":250,"cy":250,"r":100,"fill":"#ff0000"}}}
{"op":"add","path":"/root","value":"group1"}
{"op":"add","path":"/elements/group1","value":{"key":"group1","type":"Group","props":{},"children":["bg","circle1"]}}`;
    },
  };
}
