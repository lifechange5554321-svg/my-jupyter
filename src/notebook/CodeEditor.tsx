import { useEffect, useRef } from "react";
import { highlightPython, escapeHtml } from "./logic";

export type EditorMenuInfo = {
  x: number;
  y: number;
  start: number;
  end: number;
  value: string;
};

type Props = {
  value: string;
  readOnly: boolean;
  fontSize: number;
  wrap: boolean;
  indentGuides: boolean;
  plain?: boolean;
  rtl?: boolean;
  onChange: (value: string) => void;
  onFocus: (el: HTMLTextAreaElement) => void;
  onBlur: () => void;
  onMenu: (info: EditorMenuInfo) => void;
};

export function CodeEditor({
  value,
  readOnly,
  fontSize,
  wrap,
  indentGuides,
  plain = false,
  rtl = false,
  onChange,
  onFocus,
  onBlur,
  onMenu,
}: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const gutRef = useRef<HTMLDivElement>(null);
  const hlRef = useRef<HTMLPreElement>(null);
  const caretRef = useRef<number | null>(null);
  const menuAt = useRef(0);

  const lineCount = Math.max(1, value.split("\n").length);
  const lh = Math.round(fontSize * 1.55);

  function syncScroll() {
    const ta = taRef.current;
    if (!ta) return;
    if (gutRef.current) gutRef.current.style.transform = `translateY(${-ta.scrollTop}px)`;
    if (hlRef.current) hlRef.current.style.transform = `translate(${-ta.scrollLeft}px, ${-ta.scrollTop}px)`;
  }

  useEffect(() => {
    const ta = taRef.current;
    if (!ta || caretRef.current == null) return;
    const c = caretRef.current;
    caretRef.current = null;
    ta.selectionStart = ta.selectionEnd = c;
  }, [value]);

  function openMenu(x: number, y: number) {
    const ta = taRef.current;
    if (!ta) return;
    const now = Date.now();
    if (now - menuAt.current < 350) return;
    menuAt.current = now;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    onMenu({ x, y, start, end, value: ta.value });
  }

  function insertWord(word: string) {
    const ta = taRef.current;
    if (!ta || readOnly) return;
    const a = ta.selectionStart ?? 0;
    const b = ta.selectionEnd ?? 0;
    const next = ta.value.slice(0, a) + word + ta.value.slice(b);
    caretRef.current = a + word.length;
    onChange(next);
  }

  return (
    <div
      className={"code-editor" + (indentGuides ? " guides" : "") + (wrap ? " wrap" : "") + (rtl ? " rtl" : "")}
      dir={rtl ? "rtl" : "ltr"}
      style={{ ["--fs" as string]: fontSize + "px", ["--lh" as string]: lh + "px" }}
    >
      <div className="gutter" aria-hidden="true">
        <div className="gutter-nums" ref={gutRef}>
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="gutter-n">
              {i + 1}
            </div>
          ))}
        </div>
      </div>
      <div className="code-layer">
        <pre
          className="hl"
          ref={hlRef}
          dangerouslySetInnerHTML={{
            __html: (plain ? escapeHtml(value) + (value.endsWith("\n") ? "" : "\n") : highlightPython(value)) || "\n",
          }}
        />
        <textarea
          ref={taRef}
          className="code-input"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
          wrap={wrap ? "soft" : "off"}
          readOnly={readOnly}
          value={value}
          aria-label="Cell code"
          onScroll={syncScroll}
          onFocus={(e) => onFocus(e.currentTarget)}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openMenu(e.clientX, e.clientY);
          }}
          onTouchStart={(e) => {
            const t = e.touches[0];
            if (!t) return;
            const x = t.clientX;
            const y = t.clientY;
            const sx = x;
            const sy = y;
            const timer = window.setTimeout(() => openMenu(x, y), 600);
            const move = (ev: TouchEvent) => {
              const m = ev.touches[0];
              if (!m) return;
              if (Math.abs(m.clientX - sx) > 10 || Math.abs(m.clientY - sy) > 10) {
                window.clearTimeout(timer);
              }
            };
            const end = () => {
              window.clearTimeout(timer);
              window.removeEventListener("touchmove", move);
              window.removeEventListener("touchend", end);
            };
            window.addEventListener("touchmove", move, { passive: true });
            window.addEventListener("touchend", end);
          }}
          onBeforeInput={(e) => {
            const ne = e.nativeEvent;
            if (!(ne instanceof InputEvent)) return;
            if (ne.inputType !== "insertReplacementText" && ne.inputType !== "insertCompositionText") return;
            const data = ne.data ?? "";
            if (!/[\s\u00a0]$/.test(data)) return;
            const word = data.replace(/[\s\u00a0]+$/g, "");
            if (!word || word === data) return;
            e.preventDefault();
            insertWord(word);
          }}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              if (readOnly) return;
              const ta = e.currentTarget;
              const a = ta.selectionStart ?? 0;
              const b = ta.selectionEnd ?? 0;
              const next = ta.value.slice(0, a) + "    " + ta.value.slice(b);
              caretRef.current = a + 4;
              onChange(next);
            }
          }}
        />
      </div>
    </div>
  );
}
