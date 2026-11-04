export type CellType = "code" | "markdown";
export type FileFormat = "ipynb" | "py" | "md" | "html";

export type Cell = {
  id: string;
  type: CellType;
  title: string;
  titleLocked: boolean;
  content: string;
  stdout: string;
  stderr: string;
  images: string[];
  error: string | null;
  editorHeight: number;
  outputHeight: number;
  collapsed: boolean;
  outCollapsed: boolean;
  editLocked: boolean;
  maximized: boolean;
  maxRatio: number;
};

export type KeyDef = { id: string; label: string; key: string };

export const DEFAULT_KEYS: KeyDef[] = [
  { id: "ctrl", label: "Ctrl", key: "ctrl" },
  { id: "shift", label: "Shift", key: "shift" },
  { id: "tab", label: "Tab", key: "Tab" },
  { id: "esc", label: "Esc", key: "Escape" },
  { id: "left", label: "←", key: "ArrowLeft" },
  { id: "up", label: "↑", key: "ArrowUp" },
  { id: "down", label: "↓", key: "ArrowDown" },
  { id: "right", label: "→", key: "ArrowRight" },
  { id: "home", label: "Home", key: "Home" },
  { id: "end", label: "End", key: "End" },
  { id: "all", label: "All", key: "select-all" },
  { id: "copy", label: "Copy", key: "copy" },
  { id: "cut", label: "Cut", key: "cut" },
  { id: "paste", label: "Paste", key: "paste" },
  { id: "lp", label: "(", key: "(" },
  { id: "rp", label: ")", key: ")" },
  { id: "lb", label: "[", key: "[" },
  { id: "rb", label: "]", key: "]" },
  { id: "lc", label: "{", key: "{" },
  { id: "rc", label: "}", key: "}" },
  { id: "colon", label: ":", key: ":" },
  { id: "eq", label: "=", key: "=" },
  { id: "us", label: "_", key: "_" },
  { id: "sq", label: "'", key: "'" },
  { id: "dq", label: "\"", key: "\"" },
];

export const FINANCE_PKGS: { name: string; desc: string; builtin?: boolean }[] = [
  { name: "numpy", desc: "Numerical arrays", builtin: true },
  { name: "pandas", desc: "DataFrames / CSV", builtin: true },
  { name: "matplotlib", desc: "Charts", builtin: true },
  { name: "scipy", desc: "Scientific", builtin: true },
  { name: "scikit-learn", desc: "Machine learning", builtin: true },
  { name: "statsmodels", desc: "Stats models", builtin: true },
  { name: "yfinance", desc: "Market data" },
  { name: "plotly", desc: "Interactive charts" },
  { name: "requests", desc: "HTTP" },
];

const EXT: Record<FileFormat, string> = {
  ipynb: ".ipynb",
  py: ".py",
  md: ".md",
  html: ".html",
};

export function extOf(format: FileFormat) {
  return EXT[format];
}

export function ensureExt(name: string, format: FileFormat) {
  const base = name.trim().replace(/[\\/]/g, "_") || "notebook";
  const stripped = base.replace(/\.(ipynb|py|md|html|json)$/i, "");
  return stripped + EXT[format];
}

export function titleFromCode(code: string): string {
  if (!code) return "";
  const lines = String(code).split("\n");
  const hasLetter = (s: string) => /[A-Za-z\u0600-\u06FF]/.test(s);
  let commentsChecked = 0;
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    let raw = "";
    if (t.startsWith("#")) raw = t.replace(/^#+\s*/, "");
    else if (t.startsWith("//")) raw = t.replace(/^\/\/\s*/, "");
    else if (t.startsWith("/*")) raw = t.replace(/^\/\*+\s*/, "").replace(/\*+\/$/, "");
    else break;
    commentsChecked++;
    if (commentsChecked > 3) break;
    if (!raw || !hasLetter(raw)) continue;
    let name = raw
      .replace(/[\\/?*"<>|\x00-\x1f]/g, " ")
      .replace(/[^\w\u0600-\u06FF\s.:_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!name || !hasLetter(name)) continue;
    if (name.length > 64) name = name.slice(0, 64).trim();
    return name;
  }
  return "";
}

export function freshCell(id: string, type: CellType, content = "", title = ""): Cell {
  const auto = type === "code" ? titleFromCode(content) : "";
  return {
    id,
    type,
    title: title || auto || (type === "code" ? `cell-${id}.py` : "Note"),
    titleLocked: !!title,
    content,
    stdout: "",
    stderr: "",
    images: [],
    error: null,
    editorHeight: type === "markdown" ? 120 : 168,
    outputHeight: 120,
    collapsed: false,
    outCollapsed: false,
    editLocked: false,
    maximized: false,
    maxRatio: 0.7,
  };
}

export function starterCells(): Cell[] {
  return [
    freshCell(
      "c1",
      "code",
      "# Fast boot: only stdlib loaded\n# import numpy / pandas when you need them\n\nprint('Hello from Jupyter IDE')\n",
    ),
    freshCell(
      "c2",
      "markdown",
      "## Note\nInstall market libraries once from the Finance menu.\nRun each cell with the play button.\n",
      "Note",
    ),
  ];
}

type IpynbCell = {
  cell_type?: string;
  source?: string | string[];
  metadata?: { jupyteride_title?: string };
};

export function toIpynb(cells: Cell[]) {
  return JSON.stringify(
    {
      nbformat: 4,
      nbformat_minor: 5,
      metadata: {
        kernelspec: { display_name: "Python 3 (Pyodide)", language: "python", name: "python3" },
        language_info: { name: "python", version: "3.12" },
        jupyteride: { version: "9.2" },
      },
      cells: cells.map((c) => {
        const src = c.content.split("\n").map((line, i, arr) => (i < arr.length - 1 ? line + "\n" : line));
        if (c.type === "markdown") {
          return {
            cell_type: "markdown",
            metadata: { jupyteride_title: c.title || "" },
            source: src,
          };
        }
        return {
          cell_type: "code",
          metadata: { jupyteride_title: c.title || "" },
          execution_count: null,
          outputs: [],
          source: src,
        };
      }),
    },
    null,
    2,
  );
}

export function fromIpynb(text: string): { title: string; content: string; type: CellType }[] {
  const data = JSON.parse(text) as { cells?: IpynbCell[] };
  if (!data.cells || !Array.isArray(data.cells)) throw new Error("Not a valid notebook file");
  return data.cells.map((jc) => {
    const type: CellType = jc.cell_type === "markdown" ? "markdown" : "code";
    const content = Array.isArray(jc.source) ? jc.source.join("") : jc.source || "";
    const title = jc.metadata?.jupyteride_title || "";
    return { type, content, title };
  });
}

export function toPy(cells: Cell[]) {
  return cells
    .filter((c) => c.type === "code")
    .map((c) => `# %% ${c.title || "code"}\n${c.content || ""}`)
    .join("\n\n");
}

export function toMd(cells: Cell[]) {
  return cells
    .map((c) => {
      if (c.type === "markdown") return c.content;
      return "```python\n" + (c.content || "") + "\n```";
    })
    .join("\n\n");
}

export function toHtml(cells: Cell[], title: string) {
  const body = cells
    .map((c) => {
      const esc = escapeHtml(c.content || "");
      if (c.type === "markdown") return `<section class="md"><pre>${esc}</pre></section>`;
      return `<section class="code"><h3>${escapeHtml(c.title || "code")}</h3><pre>${esc}</pre></section>`;
    })
    .join("\n");
  return `<!DOCTYPE html><html lang="fa"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>body{font-family:sans-serif;background:#12140f;color:#e7ecdf;padding:24px}pre{white-space:pre-wrap;background:#1c2118;padding:12px;border-radius:8px}h3{color:#d6a23a}</style>
</head><body><h1>${escapeHtml(title)}</h1>${body}</body></html>`;
}

export function serializeExport(cells: Cell[], format: FileFormat, title: string) {
  if (format === "py") return toPy(cells);
  if (format === "md") return toMd(cells);
  if (format === "html") return toHtml(cells, title);
  return toIpynb(cells);
}

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
}

export function simpleMarkdown(src: string) {
  return escapeHtml(src || "")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}

const KEYWORDS = new Set(
  `False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield`.split(
    " ",
  ),
);

export function highlightPython(code: string) {
  const out: string[] = [];
  const n = code.length;
  let i = 0;
  const push = (cls: string, text: string) => {
    if (!text) return;
    out.push(cls ? `<span class="${cls}">${escapeHtml(text)}</span>` : escapeHtml(text));
  };
  while (i < n) {
    const ch = code[i];
    if (ch === "#") {
      let j = i;
      while (j < n && code[j] !== "\n") j++;
      push("tok-cmt", code.slice(i, j));
      i = j;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const triple = code.slice(i, i + 3) === ch + ch + ch;
      const q = triple ? ch + ch + ch : ch;
      let j = i + q.length;
      while (j < n) {
        if (code[j] === "\\") {
          j += 2;
          continue;
        }
        if (code.slice(j, j + q.length) === q) {
          j += q.length;
          break;
        }
        j++;
      }
      push("tok-str", code.slice(i, j));
      i = j;
      continue;
    }
    if (ch !== undefined && /[0-9]/.test(ch) && (i === 0 || !/[\w]/.test(code[i - 1] || ""))) {
      let j = i;
      while (j < n && /[0-9.]/.test(code[j] || "")) j++;
      push("tok-num", code.slice(i, j));
      i = j;
      continue;
    }
    if (ch !== undefined && /[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < n && /[\w]/.test(code[j] || "")) j++;
      const word = code.slice(i, j);
      let k = j;
      while (k < n && (code[k] === " " || code[k] === "\t")) k++;
      if (KEYWORDS.has(word)) push("tok-kw", word);
      else if (code[k] === "(") push("tok-fn", word);
      else push("tok-name", word);
      i = j;
      continue;
    }
    push("", ch || "");
    i++;
  }
  if (!code.endsWith("\n")) out.push("\n");
  return out.join("");
}

export function lineOf(value: string, index: number) {
  const start = value.lastIndexOf("\n", Math.max(0, index - 1)) + 1;
  const nl = value.indexOf("\n", index);
  const end = nl === -1 ? value.length : nl;
  return value.slice(start, end);
}

export type PersistShape = {
  v: 92;
  cells: Cell[];
  fileName: string;
  savedOnce: boolean;
  dirty: boolean;
  closed: boolean;
};

export function loadPersist(): PersistShape | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem("jide-notebook-v92");
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistShape;
    if (!data || data.v !== 92 || !Array.isArray(data.cells)) return null;
    return data;
  } catch {
    return null;
  }
}

export function savePersist(data: PersistShape) {
  try {
    const slim: PersistShape = {
      ...data,
      cells: data.cells.map((c) => ({ ...c, images: [], maximized: false })),
    };
    localStorage.setItem("jide-notebook-v92", JSON.stringify(slim));
  } catch {
    /* quota */
  }
}
