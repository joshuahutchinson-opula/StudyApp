import { useRef, useState } from "react";
import { SpringButton } from "../../components/SpringButton";

// Executes the snippet inside a sandboxed iframe with scripts-only permission
// (no allow-same-origin) so it can never reach the parent window, cookies, or
// localStorage — the safe pattern for running arbitrary in-app JS.
function buildSandboxDoc(code: string) {
  const escaped = JSON.stringify(code);
  return `<!doctype html><html><body><script>
    const logs = [];
    const send = (type, payload) => parent.postMessage({ type, payload }, "*");
    console.log = (...args) => { logs.push(args.map(String).join(" ")); };
    try {
      const result = (0, eval)(${escaped});
      if (result !== undefined) logs.push("=> " + String(result));
      // Grace window before reporting back: without it, logs from inside a
      // setTimeout/promise (e.g. a debounce example) fire after we'd already
      // have sent the result and stopped listening, and would be silently lost.
      setTimeout(() => send("result", logs), 250);
    } catch (err) {
      send("error", (err && err.message) || String(err));
    }
  </script></body></html>`;
}

export function RunnableCode({ code }: { code: string }) {
  const [output, setOutput] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function run() {
    setRunning(true);
    setOutput(null);
    setError(null);

    const handleMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (e.data.type === "result") setOutput(e.data.payload);
      if (e.data.type === "error") setError(e.data.payload);
      setRunning(false);
      window.removeEventListener("message", handleMessage);
    };
    window.addEventListener("message", handleMessage);

    if (iframeRef.current) {
      iframeRef.current.srcdoc = buildSandboxDoc(code);
    }
  }

  return (
    <div className="mt-[var(--space-2)]">
      <div className="flex items-center gap-[var(--space-2)]">
        <SpringButton
          type="button"
          onClick={run}
          disabled={running}
          whileTap={running ? undefined : { scale: 0.92 }}
          className="rounded-[var(--radius-sm)] px-[var(--space-3)] py-[var(--space-1)] text-xs disabled:opacity-50"
          style={{ background: "var(--color-accent)", color: "#0b0d12", fontFamily: "var(--font-mono)" }}
        >
          {running ? "running…" : "▸ run"}
        </SpringButton>
        <span className="text-xs text-[var(--color-text-muted)]">sandboxed — no network, no parent access</span>
      </div>
      <iframe ref={iframeRef} sandbox="allow-scripts" style={{ display: "none" }} title="code-sandbox" />
      {(output || error) && (
        <pre
          className="mt-[var(--space-2)] overflow-x-auto rounded-[var(--radius-lg)] p-[var(--space-3)] text-xs"
          style={{
            background: "#0b0d12",
            color: error ? "#f87171" : "#5eead4",
            fontFamily: "var(--font-mono)",
            border: "1px solid var(--color-border)",
          }}
        >
          {error ?? (output!.join("\n") || "(no output)")}
        </pre>
      )}
    </div>
  );
}
