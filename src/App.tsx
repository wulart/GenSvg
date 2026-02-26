import { useState, useRef, useEffect } from "react";
import {
  Send,
  Code2,
  Sparkles,
  Square,
  Terminal,
  LayoutTemplate,
  Moon,
  Sun,
  Play
} from "lucide-react";
import { SVGRenderer } from "./react/SVGRenderer";
import { defaultCatalog } from "./catalog";
import { useSVGStream } from "./react/useSVGStream";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [isDark, setIsDark] = useState(true);
  const jsonlEndRef = useRef<HTMLDivElement>(null);

  const { spec, rawJsonl, isGenerating, generate, stop, reRender } = useSVGStream({
    catalog: defaultCatalog,
  });

  useEffect(() => {
    if (jsonlEndRef.current) {
      jsonlEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [rawJsonl]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return;
    generate(prompt);
  };

  return (
    <div className="h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans overflow-hidden selection:bg-indigo-500/30 transition-colors duration-300">
      {/* Header */}
      <header className="h-14 shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-primary)] px-4 flex items-center justify-between z-10 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-medium text-sm tracking-wide text-[var(--text-primary)]">
            GenSVG <span className="text-[var(--text-secondary)] font-normal">Studio</span>
          </h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-[var(--text-secondary)]">
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[var(--text-primary)] transition-colors">GitHub</a>
          <div className="w-px h-4 bg-[var(--border-color)]" />
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System Ready
          </span>
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Panel: Controls & Stream */}
        <div className="w-full lg:w-[400px] xl:w-[480px] flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-primary)] shrink-0 z-10 shadow-2xl transition-colors duration-300">
          
          {/* Input Area */}
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] transition-colors duration-300">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
              <div className="relative flex items-end gap-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-1 focus-within:border-indigo-500/50 transition-colors">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  placeholder="Describe an SVG to generate..."
                  className="w-full bg-transparent pl-3 pr-2 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none resize-none min-h-[44px] max-h-[160px]"
                  rows={1}
                />
                <div className="p-1 shrink-0">
                  {isGenerating ? (
                    <button
                      onClick={stop}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                      title="Stop Generation"
                    >
                      <Square className="w-4 h-4 fill-current" />
                    </button>
                  ) : (
                    <button
                      onClick={handleGenerate}
                      disabled={!prompt.trim()}
                      className="p-2 bg-indigo-500 hover:bg-indigo-400 disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-tertiary)] text-white rounded-lg transition-colors"
                      title="Generate SVG"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">
                <Terminal className="w-3 h-3" />
                <span>Generation Stream</span>
              </div>
              {rawJsonl && !isGenerating && (
                <button
                  onClick={reRender}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  title="Re-render SVG from current JSONL"
                >
                  <Play className="w-3 h-3" />
                  Re-render
                </button>
              )}
            </div>
          </div>

          {/* JSONL Stream Output */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-[var(--bg-primary)] font-mono text-[11px] leading-relaxed text-[var(--text-secondary)] transition-colors duration-300">
            {rawJsonl ? (
              <div className="whitespace-pre-wrap break-all">
                {rawJsonl.split('\n').map((line, i) => (
                  <div key={i} className="mb-1 hover:bg-[var(--bg-secondary)] px-1 -mx-1 rounded transition-colors">
                    {line}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[var(--text-tertiary)] gap-3 opacity-50">
                <Code2 className="w-8 h-8" />
                <p>Awaiting instructions...</p>
              </div>
            )}
            <div ref={jsonlEndRef} />
          </div>
        </div>

        {/* Right Panel: SVG Preview */}
        <div className="flex-1 relative bg-[var(--bg-secondary)] overflow-hidden flex flex-col transition-colors duration-300">
          {/* Subtle Grid Background */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.15] dark:opacity-[0.15] opacity-[0.05]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, var(--canvas-dot) 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }}
          />
          
          {/* Preview Header */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-primary)]/80 backdrop-blur-md border border-[var(--border-color)] rounded-full text-xs font-medium text-[var(--text-secondary)] pointer-events-auto shadow-xl transition-colors duration-300">
              <LayoutTemplate className="w-3.5 h-3.5" />
              Canvas Preview
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-8 lg:p-12 z-0">
            <div className="relative group w-full max-w-2xl aspect-square">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-indigo-500/10 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-700" />
              
              {/* SVG Container */}
              <div className="absolute inset-0 bg-[var(--canvas-bg)] rounded-2xl shadow-2xl ring-1 ring-[var(--border-color)] overflow-hidden flex items-center justify-center transition-transform duration-500 hover:scale-[1.02]">
                {!spec.root && !isGenerating ? (
                  <div className="text-[var(--text-tertiary)] flex flex-col items-center gap-4">
                    <Sparkles className="w-10 h-10 opacity-20" />
                    <p className="text-sm font-medium">Canvas is empty</p>
                  </div>
                ) : (
                  <SVGRenderer
                    spec={spec}
                    catalog={defaultCatalog}
                    className="w-full h-full flex items-center justify-center"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
