import { z } from "zod";

export interface SVGElement<TProps = Record<string, unknown>> {
  key: string;
  type: string;
  props: TProps;
  children?: string[];
  parentKey?: string;
}

export interface SVGSpec {
  root: string;
  elements: Record<string, SVGElement>;
  viewport?: {
    width: number;
    height: number;
    viewBox?: string;
  };
  definitions?: Record<string, unknown>;
}

export interface SVGElementDef {
  tag?: string;
  props: z.ZodType;
  description: string;
  hasChildren?: boolean;
  render?: (props: any, childrenStr: string) => string;
  isDef?: boolean;
}

export interface Catalog<TData = unknown, TMeta = unknown> {
  schema: any;
  data: {
    elements: Record<string, SVGElementDef>;
  };
  validate: (
    spec: unknown,
  ) => { success: true; data: SVGSpec } | { success: false; error: any };
  prompt: (options?: { system?: string; customRules?: string[] }) => string;
}
