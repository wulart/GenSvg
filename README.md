# GenSVG

An AI-powered SVG generator that streams JSONL and renders it incrementally, inspired by [vercel-labs/json-render](https://github.com/vercel-labs/json-render).

## Overview

**GenSVG** provides a robust, type-safe, and guardrailed system for generating SVGs using AI. Instead of letting the AI output raw, unpredictable SVG strings, this project forces the AI to output a sequence of JSON patches (JSONL) that conform to a strictly defined schema (Catalog).

### Core Values

- 🔒 **Guardrailed**: AI can only use SVG elements defined in your Catalog.
- ⚡ **Predictable**: JSON output always matches the predefined Zod schema.
- 🚀 **Fast**: Supports streaming rendering, updating the UI progressively as the AI generates the response.
- 🛡️ **Type-Safe**: Full TypeScript and Zod validation.
- 🧩 **IoC (Inversion of Control)**: The Catalog dictates how elements are rendered, keeping the core renderer agnostic.

## Architecture

1. **Schema Layer**: Defines the structure of the SVG specification.
2. **Catalog Layer**: Defines the available SVG elements, their properties (via Zod), how they render, and descriptions to prompt the AI.
3. **Streaming Layer**: Parses JSON Patch (RFC 6902) streams incrementally.
4. **Renderer Layer**: Converts the JSON specification into an actual SVG string or React component.

## Installation

```bash
npm install
npm run dev
```

## Usage

### 1. Define a Catalog

Create a catalog of allowed SVG elements using Zod schemas. The Catalog dictates the `tag` name or custom `render` function.

```typescript
import { z } from "zod";
import { defineSVGSchema, defineSVGCatalog } from "./core/schema";

const schema = defineSVGSchema((s) => ({
  // ... schema definition
}));

export const myCatalog = defineSVGCatalog(schema, {
  elements: {
    Rect: {
      tag: "rect",
      props: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
        fill: z.string().optional(),
      }),
      description: "A rectangle",
      hasChildren: false,
    },
    // You can even define custom renderers!
    Avatar: {
      props: z.object({ src: z.string(), size: z.number() }),
      description: "User Avatar",
      render: (props) =>
        `<g><circle r="${props.size / 2}"/><image href="${props.src}"/></g>`,
    },
  },
});
```

### 2. Stream AI Responses with `useSVGStream`

We provide a React hook to manage the streaming state easily.

```tsx
import { useSVGStream } from "./react/useSVGStream";
import { SVGRenderer } from "./react/SVGRenderer";
import { myCatalog } from "./catalog";

function MyComponent() {
  const { spec, isGenerating, generate, stop } = useSVGStream({
    catalog: myCatalog,
    model: "gemini-3.1-pro-preview",
  });

  return (
    <div>
      <button onClick={() => generate("Draw a red circle")}>Generate</button>
      <SVGRenderer spec={spec} catalog={myCatalog} />
    </div>
  );
}
```

## Advanced Features

### JSON Patch (RFC 6902)

The AI outputs standard JSON Patch operations (`add`, `replace`, `remove`), allowing it to not only build the SVG but also modify existing elements on the fly.

### `<defs>` Support & ID Prefixing

Elements marked with `isDef: true` in the Catalog (like `LinearGradient`, `Filter`) are automatically collected and rendered inside a `<defs>` block at the top of the SVG. The `SVGRenderer` automatically prefixes IDs to prevent collisions when multiple SVGs are rendered on the same page.

## Supported AI Providers

GenSVG supports multiple AI providers using the [Vercel AI SDK](https://sdk.vercel.ai/docs). You can configure them via environment variables:

- **Gemini** (Default): Uses `@ai-sdk/google`
- **Doubao / OpenAI**: Uses `@ai-sdk/openai` compatible endpoint

Set `VITE_AI_PROVIDER="doubao"` or `VITE_AI_PROVIDER="openai"` in your `.env` to switch providers.

## Supported Elements

The default catalog supports a wide range of SVG elements:

- **Basic Shapes**: `Rect`, `Circle`, `Ellipse`, `Line`
- **Paths & Polygons**: `Path`, `Polyline`, `Polygon`
- **Text**: `Text`
- **Containers**: `Group`
- **Definitions**: `LinearGradient`, `RadialGradient`, `Stop`, `Filter`, `FeGaussianBlur`, `FeDropShadow`

## Next Steps (Roadmap)

Based on production experience with AI-driven UI generation, the future evolution of this project focuses on interactivity, dynamic data, and self-healing mechanisms:

- **Phase 1: Interactivity & Animation**
  - **Event Binding**: Allow the Catalog to define interactive events (`onClick`, `onHover`) so AI-generated SVGs can trigger React state changes.
  - **Motion Integration**: Support `<animate>`, `<animateTransform>`, or seamless integration with Framer Motion for AI-choreographed animations.

- **Phase 2: Dynamic Data Binding (Templates)**
  - **Props Injection**: Move beyond static generation. Allow the SVG spec to accept external data (e.g., `data={{ progress: 75 }}`) and bind it to SVG attributes, turning the output into reusable, data-driven components.

- **Phase 3: Self-Healing & Auto-Correction**
  - **LLM Feedback Loop**: If Zod validation fails during streaming, automatically catch the error and prompt the LLM to fix the specific attribute in the background.
  - **Robust Partial Rendering**: Enhanced AST recovery for broken JSON patches during network interruptions.

- **Phase 4: Ecosystem & Domain-Specific Catalogs**
  - `@svg-render/charts`: Pre-built catalog for data visualization (AI outputs data, Catalog handles the D3/SVG math).
  - `@svg-render/diagrams`: Nodes, edges, and flowcharts.
  - **React Component Wrapping**: Support for `<foreignObject>` to embed complex React components inside the AI-generated SVG canvas.

- **Phase 5: Developer Experience (DX)**
  - **Visual Inspector**: A DevTools-like UI to click an SVG element and highlight the exact JSON Patch that generated it.
  - **CLI Tool**: Generate SVGs at build time via terminal (`npx svg-render "a red circle"`).
