import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { LanguageModel } from "ai";

export function getAIModel(modelId?: string): LanguageModel {
  const provider = import.meta.env.VITE_AI_PROVIDER || "gemini";

  // @ts-ignore
  const geminiApiKey =
    typeof process !== "undefined" && process.env
      ? process.env.GEMINI_API_KEY
      : import.meta.env.VITE_GEMINI_API_KEY;

  switch (provider) {
    case "gemini": {
      const google = createGoogleGenerativeAI({
        apiKey: geminiApiKey || "",
      });
      return google(modelId || "gemini-3.1-pro-preview");
    }
    case "doubao": {
      const doubao = createOpenAI({
        apiKey: import.meta.env.VITE_DOUBAO_API_KEY || "",
        baseURL:
          import.meta.env.VITE_DOUBAO_BASE_URL ||
          "https://ark.cn-beijing.volces.com/api/v3",
      });
      return doubao(
        modelId || import.meta.env.VITE_DOUBAO_MODEL || "doubao-seed-2-0-lite",
      );
    }
    case "openai": {
      const openai = createOpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || "",
        baseURL:
          import.meta.env.VITE_OPENAI_BASE_URL || "https://api.openai.com/v1",
      });
      return openai(modelId || import.meta.env.VITE_OPENAI_MODEL || "gpt-4o");
    }
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
