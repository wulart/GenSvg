import { z } from "zod";
import { defineSVGSchema, defineSVGCatalog } from "./core/schema";

const schema = defineSVGSchema((s: any) => ({
  spec: s.object({
    root: s.string(),
    elements: s.record(s.ref("catalog.elements")),
    viewport: s
      .object({
        width: s.number(),
        height: s.number(),
        viewBox: s.string().optional(),
      })
      .optional(),
  }),
  catalog: s.object({
    elements: s.map({
      props: s.zod(),
      description: s.string(),
    }),
  }),
}));

export const defaultCatalog = defineSVGCatalog(schema, {
  elements: {
    Rect: {
      tag: "rect",
      props: z.object({
        x: z.number().or(z.string()),
        y: z.number().or(z.string()),
        width: z.number().or(z.string()),
        height: z.number().or(z.string()),
        fill: z.string().optional(),
        stroke: z.string().optional(),
        strokeWidth: z.number().or(z.string()).optional(),
        rx: z.number().or(z.string()).optional(),
        ry: z.number().or(z.string()).optional(),
      }),
      description: "Rectangle",
      hasChildren: false,
    },
    Circle: {
      tag: "circle",
      props: z.object({
        cx: z.number().or(z.string()),
        cy: z.number().or(z.string()),
        r: z.number().or(z.string()),
        fill: z.string().optional(),
        stroke: z.string().optional(),
        strokeWidth: z.number().or(z.string()).optional(),
      }),
      description: "Circle",
      hasChildren: false,
    },
    Ellipse: {
      tag: "ellipse",
      props: z.object({
        cx: z.number().or(z.string()),
        cy: z.number().or(z.string()),
        rx: z.number().or(z.string()),
        ry: z.number().or(z.string()),
        fill: z.string().optional(),
        stroke: z.string().optional(),
        strokeWidth: z.number().or(z.string()).optional(),
      }),
      description: "Ellipse",
      hasChildren: false,
    },
    Line: {
      tag: "line",
      props: z.object({
        x1: z.number().or(z.string()),
        y1: z.number().or(z.string()),
        x2: z.number().or(z.string()),
        y2: z.number().or(z.string()),
        stroke: z.string().optional(),
        strokeWidth: z.number().or(z.string()).optional(),
        strokeDasharray: z.string().optional(),
      }),
      description: "Line",
      hasChildren: false,
    },
    Path: {
      tag: "path",
      props: z.object({
        d: z.string(),
        fill: z.string().optional(),
        stroke: z.string().optional(),
        strokeWidth: z.number().or(z.string()).optional(),
      }),
      description: "Path",
      hasChildren: false,
    },
    Polyline: {
      tag: "polyline",
      props: z.object({
        points: z.string(),
        fill: z.string().optional(),
        stroke: z.string().optional(),
        strokeWidth: z.number().or(z.string()).optional(),
      }),
      description: "Polyline",
      hasChildren: false,
    },
    Polygon: {
      tag: "polygon",
      props: z.object({
        points: z.string(),
        fill: z.string().optional(),
        stroke: z.string().optional(),
        strokeWidth: z.number().or(z.string()).optional(),
      }),
      description: "Polygon",
      hasChildren: false,
    },
    Text: {
      tag: "text",
      props: z.object({
        x: z.number().or(z.string()),
        y: z.number().or(z.string()),
        text: z.string(),
        fontSize: z.number().or(z.string()).optional(),
        fill: z.string().optional(),
        fontFamily: z.string().optional(),
        textAnchor: z.string().optional(),
      }),
      description: "Text",
      hasChildren: true,
    },
    Group: {
      tag: "g",
      props: z.object({
        transform: z.string().optional(),
        fill: z.string().optional(),
        stroke: z.string().optional(),
        strokeWidth: z.number().or(z.string()).optional(),
      }),
      description: "Group container for multiple elements",
      hasChildren: true,
    },
    LinearGradient: {
      tag: "linearGradient",
      isDef: true,
      props: z.object({
        id: z.string(),
        x1: z.string().optional(),
        y1: z.string().optional(),
        x2: z.string().optional(),
        y2: z.string().optional(),
      }),
      description:
        "Linear gradient definition. Must have an id. Children should be Stop elements.",
      hasChildren: true,
    },
    RadialGradient: {
      tag: "radialGradient",
      isDef: true,
      props: z.object({
        id: z.string(),
        cx: z.string().optional(),
        cy: z.string().optional(),
        r: z.string().optional(),
        fx: z.string().optional(),
        fy: z.string().optional(),
      }),
      description:
        "Radial gradient definition. Must have an id. Children should be Stop elements.",
      hasChildren: true,
    },
    Stop: {
      tag: "stop",
      props: z.object({
        offset: z.string(),
        stopColor: z.string(),
        stopOpacity: z.number().or(z.string()).optional(),
      }),
      description:
        "Gradient stop. Used inside LinearGradient or RadialGradient.",
      hasChildren: false,
    },
    Filter: {
      tag: "filter",
      isDef: true,
      props: z.object({
        id: z.string(),
        x: z.string().optional(),
        y: z.string().optional(),
        width: z.string().optional(),
        height: z.string().optional(),
      }),
      description:
        "Filter definition. Must have an id. Children should be filter primitives like FeGaussianBlur.",
      hasChildren: true,
    },
    FeGaussianBlur: {
      tag: "feGaussianBlur",
      props: z.object({
        in: z.string().optional(),
        stdDeviation: z.number().or(z.string()),
        result: z.string().optional(),
      }),
      description: "Gaussian blur filter primitive.",
      hasChildren: false,
    },
    FeDropShadow: {
      tag: "feDropShadow",
      props: z.object({
        dx: z.number().or(z.string()).optional(),
        dy: z.number().or(z.string()).optional(),
        stdDeviation: z.number().or(z.string()).optional(),
        floodColor: z.string().optional(),
        floodOpacity: z.number().or(z.string()).optional(),
      }),
      description: "Drop shadow filter primitive.",
      hasChildren: false,
    },
  },
});
