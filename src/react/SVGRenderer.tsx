import React, { useMemo, useId } from "react";
import { renderSVG } from "../core/renderer";
import { SVGSpec, Catalog } from "../core/types";

export function SVGRenderer({
  spec,
  catalog,
  className,
}: {
  spec: Partial<SVGSpec>;
  catalog: Catalog<any, any>;
  className?: string;
}) {
  const idPrefix = useId().replace(/:/g, "");

  const svg = useMemo(() => {
    try {
      if (!spec.elements) return "";
      return renderSVG(spec, catalog, { idPrefix });
    } catch (e) {
      console.error("Failed to render SVG:", e);
      return "";
    }
  }, [spec, catalog, idPrefix]);

  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: svg }} />
  );
}
