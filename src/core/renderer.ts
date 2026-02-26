import { Catalog, SVGSpec, SVGElement } from "./types";

function camelToKebab(str: string) {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

export interface RenderOptions {
  idPrefix?: string;
}

function renderElement(
  key: string,
  elements: Record<string, SVGElement>,
  catalog: Catalog,
  isDefContext: boolean,
  options?: RenderOptions,
): string {
  const element = elements[key];
  if (!element) return "";

  const def = catalog.data.elements[element.type];
  if (!def) return "";

  if (def.isDef && !isDefContext) {
    return ""; // Skip defs in normal traversal
  }

  // 1. Zod Validation & Parsing
  const parsedProps = def.props.safeParse(element.props || {});
  if (!parsedProps.success) {
    console.warn(
      `[SVG Render] Invalid props for ${element.type} (${key}):`,
      parsedProps.error.message,
    );
    return ""; // Skip rendering invalid elements
  }
  const safeProps = parsedProps.data;

  // 2. Render children recursively
  const childrenStr = (element.children || [])
    .map((childKey) =>
      renderElement(childKey, elements, catalog, isDefContext, options),
    )
    .join("");

  // 3. Custom render logic if provided by Catalog
  if (def.render) {
    return def.render(safeProps, childrenStr);
  }

  // 4. Standard tag rendering
  const tag = def.tag || element.type.toLowerCase();

  let propsStr = "";
  let content = "";

  for (const [propKey, propValue] of Object.entries(safeProps)) {
    if (
      propKey === "text" &&
      (element.type === "Text" || element.type === "TSpan")
    ) {
      content = String(propValue);
    } else if (propValue !== undefined && propValue !== null) {
      let finalValue = String(propValue);
      const finalKey = camelToKebab(propKey);

      if (options?.idPrefix) {
        if (finalKey === "id") {
          finalValue = `${options.idPrefix}-${finalValue}`;
        } else if (
          typeof finalValue === "string" &&
          finalValue.startsWith("url(#")
        ) {
          finalValue = finalValue.replace("url(#", `url(#${options.idPrefix}-`);
        }
      }

      propsStr += ` ${finalKey}="${finalValue}"`;
    }
  }

  if (content || childrenStr) {
    return `<${tag}${propsStr}>${content}${childrenStr}</${tag}>`;
  } else {
    return `<${tag}${propsStr}/>`;
  }
}

export function renderSVG(
  spec: Partial<SVGSpec>,
  catalog: Catalog,
  options?: RenderOptions,
): string {
  if (!spec.elements) return "";

  const width = spec.viewport?.width || 500;
  const height = spec.viewport?.height || 500;
  const viewBox = spec.viewport?.viewBox || `0 0 ${width} ${height}`;

  // Collect defs
  const defsStr = Object.entries(spec.elements)
    .filter(([_, el]) => catalog.data.elements[el.type]?.isDef)
    .map(([key, _]) =>
      renderElement(key, spec.elements!, catalog, true, options),
    )
    .join("");

  const defsTag = defsStr ? `<defs>${defsStr}</defs>` : "";

  let rootElementStr = "";

  if (spec.root && spec.elements[spec.root]) {
    rootElementStr = renderElement(
      spec.root,
      spec.elements,
      catalog,
      false,
      options,
    );
  } else {
    // Fallback for streaming: render all top-level elements
    const allChildren = new Set<string>();
    for (const el of Object.values(spec.elements)) {
      if (el.children) {
        for (const child of el.children) {
          allChildren.add(child);
        }
      }
    }

    const topLevelKeys = Object.keys(spec.elements).filter(
      (key) =>
        !allChildren.has(key) &&
        !catalog.data.elements[spec.elements![key].type]?.isDef,
    );

    rootElementStr = topLevelKeys
      .map((key) => renderElement(key, spec.elements!, catalog, false, options))
      .join("");
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">${defsTag}${rootElementStr}</svg>`;
}
