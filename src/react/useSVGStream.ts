import { useState, useCallback, useRef } from "react";
import { streamText } from "ai";
import { createSpecStreamCompiler } from "../core/streaming";
import { SVGSpec, Catalog } from "../core/types";
import { getAIModel } from "../ai/config";

export interface UseSVGStreamOptions {
  catalog: Catalog<any, any>;
  model?: string;
  systemPrompt?: string;
  customRules?: string[];
  temperature?: number;
}

export function useSVGStream(options: UseSVGStreamOptions) {
  const {
    catalog,
    model,
    systemPrompt = "You are an expert SVG designer. The user will ask you to draw something.",
    customRules = [
      "Use a 500x500 viewport by default.",
      "Group related elements using the Group type.",
      "Always provide a root element.",
      "Do NOT use markdown code blocks. Output raw JSONL.",
    ],
    temperature = 0.2,
  } = options;

  const [spec, setSpec] = useState<Partial<SVGSpec>>({});
  const [rawJsonl, setRawJsonl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || isGenerating) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsGenerating(true);
      setSpec({});
      setRawJsonl("");
      setError(null);

      try {
        const fullSystemPrompt = catalog.prompt({
          system: systemPrompt,
          customRules,
        });

        const aiModel = getAIModel(model);

        const { textStream } = streamText({
          model: aiModel,
          system: fullSystemPrompt,
          prompt,
          temperature,
          abortSignal: abortControllerRef.current.signal,
        });

        const compiler = createSpecStreamCompiler();
        let buffer = "";

        for await (const chunkText of textStream) {
          if (abortControllerRef.current?.signal.aborted) break;

          if (!chunkText) continue;

          setRawJsonl((prev) => prev + chunkText);
          buffer += chunkText;

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          const chunkToProcess = lines.join("\n");
          if (chunkToProcess) {
            const { result } = compiler.push(chunkToProcess);
            setSpec({ ...result });
          }
        }

        if (
          buffer.trim() &&
          !buffer.trim().startsWith("```") &&
          !abortControllerRef.current?.signal.aborted
        ) {
          const { result } = compiler.push(buffer);
          setSpec({ ...result });
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Generation error:", err);
          setError(err);
        }
      } finally {
        setIsGenerating(false);
      }
    },
    [catalog, model, systemPrompt, customRules, temperature, isGenerating],
  );

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  }, []);

  const reRender = useCallback(async () => {
    if (!rawJsonl || isGenerating) return;
    
    // Cancel any existing generation or re-render
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsGenerating(true);
    setSpec({});
    
    const compiler = createSpecStreamCompiler();
    const lines = rawJsonl.split('\n').filter(line => line.trim() !== '');
    
    try {
      for (const line of lines) {
        if (signal.aborted) break;
        
        const { result } = compiler.push(line + '\n');
        setSpec({ ...result });
        
        // Add a small delay to simulate streaming animation
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } finally {
      if (!signal.aborted) {
        setIsGenerating(false);
      }
    }
  }, [rawJsonl, isGenerating]);

  return {
    spec,
    rawJsonl,
    isGenerating,
    error,
    generate,
    stop,
    reRender,
  };
}
