/**
 * Jupyter IDE v0.9.2 – keep 0.9.1, Jupyter file actions, sticky chrome
 */
let pyodide = null;
let cells = [];
let cellIdCounter = 0;
let isReady = false;
let activeEditor = null;
let activeCell = null;
let ctrlHeld = false;
let shiftHeld = false;
let ctxTarget = null;

const statusEl = document.getElementById("status");
const notebookEl = document.getElementById("notebook");
const hasBridge = typeof AndroidBridge !== "undefined";
let notebookDirty = false;
let notebookPath = "";
try { notebookPath = localStorage.getItem("jide_notebook_path") || ""; } catch (_) {}
let pendingCloseAction = null;
let pendingSaveUri = "";
const LONG_PRESS_MS = 1800;

const FINANCE_PKGS = [
  { name: "numpy", desc: "Numerical arrays" },
  { name: "pandas", desc: "DataFrames / CSV" },
  { name: "matplotlib", desc: "Charts" },
  { name: "yfinance", desc: "Yahoo Finance data" },
  { name: "requests", desc: "HTTP" },
  { name: "plotly", desc: "Interactive charts" },
  { name: "scipy", desc: "Scientific" },
  { name: "scikit-learn", desc: "ML (if available)" },
  { name: "statsmodels", desc: "Stats models" },
  { name: "ta", desc: "Technical analysis" },
];

const DEFAULTS = {
  theme: "dark", codeTheme: "vscode-dark", codeFont: "monospace",
  faFont: "system-ui, sans-serif", customFontFile: "",
  codeSize: 14, outSize: 14, indentGuides: false, lineWrap: false,
  lastFolder: "",
};

const PYTHON_KEYWORDS = [
  "False","None","True","and","as","assert","async","await","break","class","continue",
  "def","del","elif","else","except","finally","for","from","global","if","import",
  "in","is","lambda","nonlocal","not","or","pass","raise","return","try","while",
  "with","yield","print","len","range","enumerate","zip","map","filter","sorted",
  "list","dict","set","tuple","str","int","float","bool","type","isinstance",
  "open","input","sum","min","max","abs","round","any","all","self","Exception"
];

function loadSettings() {
  try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem("jide_settings") || "{}")); }
  catch (_) { return Object.assign({}, DEFAULTS); }
}
function saveSettings(s) { localStorage.setItem("jide_settings", JSON.stringify(s)); }
let settings = loadSettings();

function setStatus(text, type) {
  statusEl.textContent = text;
  statusEl.className = "status " + (type || "");
}

function applySettings() {
  document.body.classList.toggle("theme-light", settings.theme === "light");
  document.body.classList.toggle("indent-guides", !!settings.indentGuides);
  document.documentElement.style.setProperty("--code-size", settings.codeSize + "px");
  document.documentElement.style.setProperty("--out-size", settings.outSize + "px");
  document.documentElement.style.setProperty("--font-mono", settings.codeFont);
  document.documentElement.style.setProperty("--font-fa", settings.faFont === "custom" ? "system-ui, sans-serif" : settings.faFont);
  cells.forEach((c) => {
    if (c.editor) {
      c.editor.setOption("theme", settings.codeTheme);
      c.editor.setOption("lineWrapping", !!settings.lineWrap);
      c.editor.refresh();
    }
  });
}

/* ---------- Autosave (preserve newlines) ---------- */
function flushAllEditors() {
  cells.forEach((c) => {
    if (c.editor) {
      try { c.content = c.editor.getValue(); } catch (_) {}
    }
  });
}

function serializeNotebook() {
  flushAllEditors();
  return {
    v: 6,
    cells: cells.map((c) => ({
      id: c.id, type: c.type, title: c.title || "",
      content: c.content || "",
      editorHeight: c.editorHeight || 160,
      outputHeight: c.outputHeight || 120,
      collapsed: !!c.collapsed,
      outCollapsed: !!c.outCollapsed,
      moveLocked: !!c.moveLocked,
      editLocked: !!c.editLocked,
      titleLocked: !!c.titleLocked,
      splitRatio: c.splitRatio || 0.7,
    })),
  };
}


/** Top comment lines → title: first comment with English/Persian letters */
function titleFromCode(code) {
  if (!code) return "";
  const lines = String(code).split("\n");
  const hasLetter = (s) => /[A-Za-z\u0600-\u06FF]/.test(s);
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    let raw = "";
    if (t.startsWith("#")) raw = t.replace(/^#+\s*/, "");
    else if (t.startsWith("//")) raw = t.replace(/^\/\/\s*/, "");
    else if (t.startsWith("/*")) raw = t.replace(/^\/\*+\s*/, "").replace(/\*+\/$/, "");
    else break; // first non-comment code line
    if (!raw) continue;
    // must contain at least one English or Persian letter (skip ==== separators)
    if (!hasLetter(raw)) continue;
    // keep readable title (allow : - _); strip only path-breaking chars
    let name = raw.replace(/[\\/?*"<>|\x00-\x1f]/g, " ").replace(/\s+/g, " ").trim();
    if (!name || !hasLetter(name)) continue;
    if (name.length > 64) name = name.slice(0, 64).trim();
    return name;
  }
  return "";
}

function applyAutoTitle(cell) {
  if (!cell || cell.type !== "code") return;
  if (cell.titleLocked) return;
  const code = cell.editor ? cell.editor.getValue() : (cell.content || "");
  const auto = titleFromCode(code);
  if (auto) {
    cell.title = auto;
    const el = document.getElementById("cell-" + cell.id);
    const t = el && el.querySelector(".cell-title");
    if (t && !t.classList.contains("editing")) t.textContent = auto;
  }
}

function markDirty() {
  notebookDirty = true;
}

function rememberPath(path) {
  notebookPath = path || "";
  try {
    if (notebookPath) localStorage.setItem("jide_notebook_path", notebookPath);
    else localStorage.removeItem("jide_notebook_path");
  } catch (_) {}
}

function syncDashboardHeight() {
  const dash = document.getElementById("dashboard");
  if (!dash) return 0;
  const h = Math.ceil(dash.getBoundingClientRect().height);
  document.documentElement.style.setProperty("--dashboard-h", h + "px");
  return h;
}

function ensureFloor() {
  if (!notebookEl) return;
  let floor = document.getElementById("notebook-floor");
  if (!floor) {
    floor = document.createElement("div");
    floor.id = "notebook-floor";
    floor.className = "notebook-floor";
  }
  notebookEl.appendChild(floor);
}

function stickCellUnderDashboard(el) {
  if (!el || !notebookEl || el.classList.contains("maximized")) return;
  const dash = document.getElementById("dashboard");
  const line = dash ? dash.getBoundingClientRect().bottom : 0;
  const top = el.getBoundingClientRect().top;
  const delta = top - line;
  if (Math.abs(delta) < 2) return;
  notebookEl.scrollTop += delta;
}

let restoringNotebook = false;

/** Standard Jupyter .ipynb JSON */
function toIpynb() {
  flushAllEditors();
  const nb = {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: { display_name: "Python 3 (Pyodide)", language: "python", name: "python3" },
      language_info: { name: "python", version: "3.12" },
      jupyteride: { version: 7 }
    },
    cells: cells.map((c) => {
      const src = (c.content || "").split("\n").map((line, i, arr) =>
        i < arr.length - 1 ? line + "\n" : line
      );
      if (c.type === "markdown") {
        return { cell_type: "markdown", metadata: { jupyteride_title: c.title || "" }, source: src };
      }
      return {
        cell_type: "code",
        execution_count: null,
        metadata: { jupyteride_title: c.title || "" },
        source: src,
        outputs: []
      };
    })
  };
  return JSON.stringify(nb, null, 2);
}

function loadFromIpynb(text) {
  const nb = JSON.parse(text);
  if (!nb.cells) throw new Error("Not a valid .ipynb");
  cells = [];
  notebookEl.innerHTML = "";
  cellIdCounter = 0;
  nb.cells.forEach((jc) => {
    const type = jc.cell_type === "markdown" ? "markdown" : "code";
    let content = "";
    if (Array.isArray(jc.source)) content = jc.source.join("");
    else content = jc.source || "";
    const title = (jc.metadata && jc.metadata.jupyteride_title) || "";
    addCell(type, content, title);
  });
  notebookDirty = false;
}

let _saveTimer = null;
function saveNotebookLocal(immediate) {
  const doSave = () => {
    try {
      const data = serializeNotebook();
      localStorage.setItem("jide_notebook", JSON.stringify(data));
      if (hasBridge) {
        try {
          AndroidBridge.saveUserFile("notebooks/autosave.json", JSON.stringify(data, null, 2));
        } catch (_) {}
      }
    } catch (e) { console.warn("autosave", e); }
  };
  if (immediate) {
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = null;
    doSave();
  } else {
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(doSave, 400);
  }
}

function restoreNotebook() {
  try {
    const raw = localStorage.getItem("jide_notebook");
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.cells) || !data.cells.length) return false;
    restoringNotebook = true;
    cells = [];
    notebookEl.innerHTML = "";
    cellIdCounter = 0;
    data.cells.forEach((c) => {
      const cell = addCell(c.type || "code", c.content || "", c.title || "");
      cell.editorHeight = c.editorHeight || 160;
      cell.outputHeight = c.outputHeight || 120;
      cell.collapsed = !!c.collapsed;
      cell.outCollapsed = !!c.outCollapsed;
      cell.editLocked = !!c.editLocked;
      cell.titleLocked = !!c.titleLocked;
      cell.splitRatio = c.splitRatio || 0.7;
      if (cell.editor) {
        try { cell.editor.setOption("readOnly", !!cell.editLocked); } catch (_) {}
      }
      renderCell(cell);
    });
    restoringNotebook = false;
    ensureFloor();
    notebookEl.scrollTop = 0;
    notebookDirty = false;
    return true;
  } catch (e) {
    restoringNotebook = false;
    console.warn("restore", e);
    return false;
  }
}

setInterval(() => saveNotebookLocal(true), 120000); // Jupyter-like ~120s
window.addEventListener("beforeunload", () => saveNotebookLocal(true));
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveNotebookLocal(true);
});
document.addEventListener("pause", () => saveNotebookLocal(true));

/* ---------- Fast boot: pure Python only ---------- */
async function ensureOfflineRuntime() {
  if (!hasBridge) return { ok: true, offline: false };
  try {
    if (AndroidBridge.isRuntimeReady()) {
      setStatus("Using local offline runtime…", "busy");
      return { ok: true, offline: true };
    }
    const missing = JSON.parse(AndroidBridge.listMissingRuntime() || "[]");
    if (!missing.length) return { ok: true, offline: true };
    const msg = "Runtime not cached locally (" + missing.length + " files).\n" +
      "Download once (~30–50MB) for offline use?\n\n" +
      "Without this, internet is required every launch.";
    if (!confirm(msg)) return { ok: true, offline: false };
    setStatus("Downloading offline runtime…", "busy");
    // Native blocking download of core files
    const result = JSON.parse(AndroidBridge.cacheFullRuntime() || "{}");
    if (result.ready || result.ok) {
      setStatus("Runtime cached offline", "ready");
      return { ok: true, offline: true };
    }
    setStatus("Partial runtime cache – online fallback", "busy");
    return { ok: true, offline: false };
  } catch (e) {
    console.warn(e);
    return { ok: true, offline: false };
  }
}

async function initPyodide() {
  try {
    await ensureOfflineRuntime();
    setStatus("Loading Python (stdlib only)…", "busy");
    const indexURL = "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/";
    pyodide = await loadPyodide({ indexURL: indexURL });
    await pyodide.runPythonAsync(`
import sys, io, traceback, base64
_namespace = {"__name__": "__main__"}

def _capture_run(source: str):
    stdout = io.StringIO()
    stderr = io.StringIO()
    images = []
    error_line = error_type = error_msg = None
    # lazy matplotlib hook
    try:
        import matplotlib
        matplotlib.use("AGG")
        import matplotlib.pyplot as plt
        from matplotlib.backends.backend_agg import FigureCanvasAgg
        original_show = plt.show
        def capture_show(*a, **k):
            for num in plt.get_fignums():
                fig = plt.figure(num)
                canvas = FigureCanvasAgg(fig)
                canvas.draw()
                buf = io.BytesIO()
                fig.savefig(buf, format="png", bbox_inches="tight", dpi=120)
                buf.seek(0)
                images.append(base64.b64encode(buf.read()).decode("ascii"))
                plt.close(fig)
        plt.show = capture_show
    except Exception:
        original_show = None
        plt = None
    try:
        import contextlib
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            exec(source, _namespace, _namespace)
    except Exception as e:
        tb = traceback.TracebackException.from_exception(e)
        traceback.print_exc(file=stderr)
        error_type = type(e).__name__
        error_msg = str(e)
        frames = list(tb.stack)
        if frames:
            for fr in reversed(frames):
                if fr.filename in ("<string>", "<exec>"):
                    error_line = fr.lineno
                    break
            if error_line is None:
                error_line = frames[-1].lineno
    finally:
        if plt is not None and original_show is not None:
            plt.show = original_show
    return {
        "stdout": stdout.getvalue(), "stderr": stderr.getvalue(),
        "images": images, "error_line": error_line,
        "error_type": error_type, "error_msg": error_msg,
    }
`);
    isReady = true;
    // input() → JS prompt (blocking-style via pyodide)
    try {
      pyodide.runPython(`
import js
def _jide_input(prompt=""):
    try:
        fn = getattr(js, "jideBlockingInput", None)
        if fn is not None:
            v = fn(str(prompt) if prompt is not None else "")
        else:
            v = js.prompt(str(prompt) if prompt is not None else "")
        if v is None:
            return ""
        return str(v)
    except Exception:
        return ""
import builtins
builtins.input = _jide_input
`)
    } catch (e) { console.warn("input bridge", e); }
    const ver = pyodide.runPython("import sys; sys.version.split()[0]");
    setStatus("Ready • Python " + ver + " • packages on demand", "ready");
    /* header subtitle hidden — version only in status */

    if (!restoreNotebook()) {
      addCell("code", "# Fast boot: only stdlib loaded\n# import numpy / pandas when you need them\n\nprint('Hello from Jupyter IDE')\n");
      addCell("markdown", "## Tip\nUse **☰ → Finance checklist** to download market libraries once.");
    }
  } catch (err) {
    console.warn(err);
    setStatus("Failed: " + err.message + " (need network first time for runtime)", "error");
  }
}

function pkgLog(msg) {
  const el = document.getElementById("pkg-log");
  if (el) el.textContent += msg + "\n";
}

async function ensurePackage(name) {
  name = (name || "").trim();
  if (!name || !pyodide) return false;
  const mod = name.split(/[<>=!]/)[0].replace("-", "_");
  try {
    await pyodide.runPythonAsync("import " + mod);
    return true;
  } catch (_) {}

  if (hasBridge && AndroidBridge.hasLocalPackage(name)) {
    setStatus("Loading " + name + " from local…", "busy");
    try {
      await pyodide.loadPackage(name);
      setStatus("Loaded " + name, "ready");
      return true;
    } catch (e) { pkgLog("local fail: " + e.message); }
  }

  if (!confirm('Package "' + name + '" not local.\nDownload and keep?')) {
    setStatus("Skipped " + name, "error");
    return false;
  }
  setStatus("Downloading " + name + "…", "busy");
  try {
    // Prefer official Pyodide package build (real files on CDN)
    try {
      await pyodide.loadPackage(name);
    } catch (_) {
      await pyodide.loadPackage("micropip");
      await pyodide.runPythonAsync(
        "import micropip\nawait micropip.install(" + JSON.stringify(name) + ")"
      );
    }
    // Persist inventory + try to cache CDN package payloads into assets/packages
    if (hasBridge) {
      const meta = JSON.stringify({
        name: name,
        installedAt: new Date().toISOString(),
        source: "pyodide"
      }, null, 2);
      AndroidBridge.saveUserFile("packages/" + name + "/installed.json", meta);
      // Best-effort: pull common pyodide artifact names into local packages/
      const base = (typeof AndroidBridge.getPyodideCdnBase === "function")
        ? AndroidBridge.getPyodideCdnBase()
        : "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/";
      try {
        if (typeof AndroidBridge.downloadToAssets === "function") {
          // pyodide-lock helps; still try name-prefixed files later via manifest
          AndroidBridge.saveUserFile("packages/" + name + "/README.txt",
            "Package " + name + " installed via Pyodide.\n" +
            "Runtime cache: runtime/pyodide\nCDN: " + base + "\n");
        }
      } catch (_) {}
      try {
        AndroidBridge.savePackage(name, "installed", name + "/installed.json", btoa("installed"), "pyodide");
      } catch (_) {}
    }
    setStatus("Installed " + name, "ready");
    return true;
  } catch (e) {
    setStatus("Install failed: " + name, "error");
    pkgLog(String(e));
    return false;
  }
}

function pythonHint(cm) {
  const cur = cm.getCursor();
  const token = cm.getTokenAt(cur);
  let start = token.start, end = cur.ch, word = token.string;
  if (!word || /[^\\w]/.test(token.string)) { word = ""; start = end; }
  else {
    const m = word.match(/[A-Za-z_][A-Za-z0-9_]*$/);
    if (m) { start = end - m[0].length; word = m[0]; }
  }
  const found = new Set(PYTHON_KEYWORDS);
  const re = /[A-Za-z_][A-Za-z0-9_]*/g;
  let m, doc = cm.getValue();
  while ((m = re.exec(doc))) if (m[0].length > 1) found.add(m[0]);
  const list = Array.from(found).filter(w => w.toLowerCase().startsWith(word.toLowerCase()) && w !== word).sort().slice(0, 40);
  return { list, from: CodeMirror.Pos(cur.line, start), to: CodeMirror.Pos(cur.line, end) };
}

function addCell(type, content, title) {
  const id = ++cellIdCounter;
  const cell = {
    id, type: type || "code",
    title: title || (type === "markdown" ? "markdown-" + id : "cell-" + id + ".py"),
    content: content || "", editorHeight: 160, outputHeight: 120,
    collapsed: false, outCollapsed: false, editor: null, outputHtml: "", error: false,
  };
  cells.push(cell);
  renderCell(cell);
  ensureFloor();
  if (!restoringNotebook) {
    requestAnimationFrame(() => {
      const node = document.getElementById("cell-" + cell.id);
      if (node) stickCellUnderDashboard(node);
    });
  }
  markDirty();
  saveNotebookLocal();
  return cell;
}

function bindResize(handle, getH, setH, minH, maxH, onResize) {
  if (!handle) return;
  let startY = 0, startH = 0, dragging = false;
  const start = (y) => { dragging = true; startY = y; startH = getH(); };
  const move = (y) => {
    if (!dragging) return;
    const nh = Math.max(minH, Math.min(maxH, startH + (y - startY)));
    setH(nh);
    if (onResize) onResize(nh);
  };
  const end = () => { dragging = false; saveNotebookLocal(); };
  handle.addEventListener("touchstart", (e) => { start(e.touches[0].clientY); e.preventDefault(); }, { passive: false });
  handle.addEventListener("touchmove", (e) => { move(e.touches[0].clientY); e.preventDefault(); }, { passive: false });
  handle.addEventListener("touchend", end);
  handle.addEventListener("mousedown", (e) => {
    start(e.clientY);
    const mm = (ev) => move(ev.clientY);
    const mu = () => { end(); window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); };
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
  });
}

function snapshotEditor(editor) {
  let selection = "";
  let lineText = "";
  try { selection = editor.getSelection() || ""; } catch (_) {}
  try {
    const cur = editor.getCursor();
    lineText = editor.getLine(cur.line) || "";
  } catch (_) {}
  return { selection, lineText };
}

function stripSuggestionSpace(cm, change) {
  if (!change || (change.origin !== "+input" && change.origin !== "*compose")) return;
  if (!change.text || change.text.length !== 1) return;
  const inserted = change.text[0] || "";
  if (inserted.length < 2 || !/\s$/.test(inserted) || /^\s+$/.test(inserted)) return;
  const endCh = change.from.ch + inserted.length;
  cm.operation(() => {
    cm.replaceRange("", { line: change.from.line, ch: endCh - 1 }, { line: change.from.line, ch: endCh }, "*nospace");
  });
}

function bindMaxSplit(handle, cell, el) {
  if (!handle) return;
  let startY = 0, startRatio = cell.splitRatio || 0.7, dragging = false;
  const apply = (ratio) => {
    cell.splitRatio = ratio;
    el.style.setProperty("--code-fr", String(ratio));
    el.style.setProperty("--out-fr", String(Math.max(0.15, 1 - ratio)));
    if (cell.editor) { try { cell.editor.refresh(); } catch (_) {} }
  };
  const move = (y) => {
    if (!dragging) return;
    const h = Math.max(160, el.getBoundingClientRect().height - 80);
    let ratio = startRatio + (y - startY) / h;
    ratio = Math.max(0.25, Math.min(0.85, ratio));
    apply(ratio);
  };
  const end = () => { if (!dragging) return; dragging = false; saveNotebookLocal(); };
  const start = (y) => { dragging = true; startY = y; startRatio = cell.splitRatio || 0.7; };
  handle.addEventListener("touchstart", (e) => { start(e.touches[0].clientY); e.preventDefault(); }, { passive: false });
  handle.addEventListener("touchmove", (e) => { move(e.touches[0].clientY); e.preventDefault(); }, { passive: false });
  handle.addEventListener("touchend", end);
  handle.addEventListener("mousedown", (e) => {
    start(e.clientY);
    e.preventDefault();
    const mm = (ev) => move(ev.clientY);
    const mu = () => { end(); window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); };
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
  });
}

function renderCell(cell) {
  let el = document.getElementById("cell-" + cell.id);
  if (!el) {
    el = document.createElement("div");
    el.id = "cell-" + cell.id;
    notebookEl.appendChild(el);
  }
  el.className = "cell " + cell.type
    + (cell.moveLocked ? " locked-move" : "")
    + (cell.editLocked ? " locked-edit" : "")
    + (cell.maximized ? " maximized" : "");

  const eh = cell.editorHeight || 160;
  const oh = cell.outputHeight || 120;
  el.innerHTML = `
    <div class="cell-chrome">
      <div class="cell-titlebar">
        <span class="cell-type-badge ${cell.type === "code" ? "" : "md"}">${cell.type === "code" ? "CODE" : "MD"}</span>
        <span class="cell-title" data-action="rename">${escapeHtml(cell.title || "")}</span>
        <button type="button" class="retitle-btn" data-action="retitle" title="Read name from code">↺</button>
        <span class="cell-lock-badge" data-action="lock-hint">${cell.moveLocked ? "🔒" : ""}${cell.editLocked ? "✏️🔒" : ""}</span>
      </div>
      <div class="cell-toolbar">
        <button data-action="undo" title="Undo">↶</button>
        <button data-action="redo" title="Redo">↷</button>
        <button data-action="minimize-cell" title="Minimize cell (code+output)">${(cell.collapsed && cell.outCollapsed) ? "□" : "–"}</button>
        <button data-action="maximize" title="Maximize">${cell.maximized ? "❐" : "⛶"}</button>
        <button data-action="toggle-edit-lock" class="${cell.editLocked ? "lock-on" : ""}" title="Edit lock">✎</button>
        <button data-action="up" title="Move up">↑</button>
        <button data-action="down" title="Move down">↓</button>
        <button data-action="delete" title="Delete">×</button>
        <span class="spacer"></span>
        ${cell.type === "code" ? '<button class="run" data-action="run" title="Run">▶</button>' : '<button data-action="preview" title="Preview">◉</button>'}
      </div>
    </div>
    <div class="editor-wrap ${cell.collapsed ? "collapsed" : ""}" style="height:${eh}px">
      <textarea class="cell-editor" spellcheck="false"></textarea>
    </div>
    <div class="resize-handle" data-resize="editor"><span class="grip"></span><span class="grip-btn">↕</span></div>
    ${cell.type === "markdown" ? '<div class="cell-md-preview"></div>' : ""}
    <div class="output-section">
      <div class="output-header">
        <span>OUTPUT</span>
        <span>
          <button data-action="toggle-out">${cell.outCollapsed ? "▢" : "—"}</button>
          <button data-action="copy-output">Copy</button>
        </span>
      </div>
      <div class="output-wrap ${cell.outCollapsed ? "collapsed" : ""}" style="height:${oh}px">
        <div class="cell-output ${cell.error ? "error" : ""}" tabindex="0"></div>
      </div>
      <div class="resize-handle" data-resize="output"><span class="grip"></span><span class="grip-btn">↕</span></div>
    </div>
  `;

  const textarea = el.querySelector(".cell-editor");
  const wrap = el.querySelector(".editor-wrap");
  const outWrap = el.querySelector(".output-wrap");
  const outputEl = el.querySelector(".cell-output");
  if (cell.outputHtml) outputEl.innerHTML = cell.outputHtml;

  // rename title (long press)
  const titleEl = el.querySelector(".cell-title");
  let titleTimer = null;
  titleEl.addEventListener("touchstart", () => {
    titleTimer = setTimeout(() => startRename(cell, titleEl), 450);
  });
  titleEl.addEventListener("touchend", () => clearTimeout(titleTimer));
  titleEl.addEventListener("touchmove", () => clearTimeout(titleTimer));
  titleEl.addEventListener("dblclick", () => startRename(cell, titleEl));
  // Long-press edit-lock — same duration as the dashboard lock
  const editLockBtn = el.querySelector('[data-action="toggle-edit-lock"]');
  if (editLockBtn) {
    editLockBtn.addEventListener("contextmenu", (e) => e.preventDefault());
    wireLongPress(editLockBtn, LONG_PRESS_MS, () => {
      cell.editLocked = !cell.editLocked;
      if (cell.editor) cell.editor.setOption("readOnly", !!cell.editLocked);
      renderCell(cell);
      markDirty();
      setStatus(cell.editLocked ? "Cell edit locked" : "Cell edit unlocked", "ready");
    });
  }

  if (cell.maximized) {
    const ratio = cell.splitRatio || 0.7;
    el.style.setProperty("--code-fr", String(ratio));
    el.style.setProperty("--out-fr", String(1 - ratio));
  }


  // resize ONLY via center .grip-btn
  const edHandle = el.querySelector('[data-resize="editor"] .grip-btn') || el.querySelector('[data-resize="editor"]');
  const outHandle = el.querySelector('[data-resize="output"] .grip-btn') || el.querySelector('[data-resize="output"]');
  if (cell.maximized) {
    bindMaxSplit(edHandle, cell, el);
  } else {
    bindResize(
      edHandle,
      () => wrap.getBoundingClientRect().height,
      (h) => { wrap.style.height = h + "px"; cell.editorHeight = h; },
      64, 700,
      (h) => { if (cell.editor) { cell.editor.setSize("100%", h + "px"); cell.editor.refresh(); } }
    );
  }
  bindResize(
    outHandle,
    () => outWrap.getBoundingClientRect().height,
    (h) => { outWrap.style.height = h + "px"; cell.outputHeight = h; },
    28, 500, null
  );

  // output select-all isolation
  outputEl.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
      e.preventDefault(); e.stopPropagation();
      const r = document.createRange(); r.selectNodeContents(outputEl);
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    }
  });
  // Long-press on output: select-all that box only + small menu
  let outLp = null;
  outputEl.addEventListener("touchstart", (e) => {
    outLp = setTimeout(() => {
      const r = document.createRange(); r.selectNodeContents(outputEl);
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      ctxTarget = { type: "output", el: outputEl };
      showCtx(e.touches[0].clientX, e.touches[0].clientY);
    }, 480);
  }, { passive: true });
  outputEl.addEventListener("touchend", () => clearTimeout(outLp));
  outputEl.addEventListener("touchmove", () => clearTimeout(outLp));

  if (cell.type === "code" && window.CodeMirror) {
    if (cell.editor) {
      try { cell.editor.toTextArea(); } catch (_) {}
      cell.editor = null;
    }
    const editor = CodeMirror.fromTextArea(textarea, {
      mode: "python",
      theme: settings.codeTheme || "vscode-dark",
      lineNumbers: true,
      inputStyle: "textarea",
      indentUnit: 4, tabSize: 4, indentWithTabs: false,
      electricChars: true, autoCloseBrackets: true, matchBrackets: true,
      lineWrapping: !!settings.lineWrap,
      viewportMargin: 20,
      extraKeys: {
        Tab(cm) {
          if (cm.somethingSelected()) cm.indentSelection("add");
          else if (cm.state.completionActive) return CodeMirror.Pass;
          else cm.replaceSelection("    ", "end");
        },
        "Shift-Tab"(cm) { cm.indentSelection("subtract"); },
        "Ctrl-A": "selectAll", "Cmd-A": "selectAll",
        "Ctrl-Space"(cm) { cm.showHint({ hint: pythonHint, completeSingle: false }); },
      },
    });
    cell.editor = editor;
    editor.setValue(cell.content || "");
    editor.setSize("100%", eh + "px");
    const syncEditor = () => { cell.content = editor.getValue(); applyAutoTitle(cell); markDirty(); saveNotebookLocal(false); };
    editor.on("change", (cm, change) => {
      stripSuggestionSpace(cm, change);
      syncEditor();
    });
    editor.on("cursorActivity", () => { cell.content = editor.getValue(); });
    editor.on("blur", () => { cell.content = editor.getValue(); saveNotebookLocal(true); });
    editor.on("focus", () => {
      activeEditor = editor; activeCell = cell;
      // after keyboard animation, pin cell just under dashboard
      const pin = () => stickCellUnderDashboard(el);
      pin();
      setTimeout(pin, 100);
      setTimeout(pin, 280);
      setTimeout(pin, 500);
      setTimeout(pin, 800);
    });
    editor.on("cursorActivity", () => {
      // keep content flushed
      try { cell.content = editor.getValue(); } catch (_) {}
    });
    if (cell.editLocked) editor.setOption("readOnly", true);

    // long-press small menu (not native huge menu)
    const wrapper = editor.getWrapperElement();
    let lpTimer = null;
    const openEditorMenu = (x, y) => {
      const snap = snapshotEditor(editor);
      ctxTarget = { type: "editor", cell, editor, selection: snap.selection, lineText: snap.lineText };
      showCtx(x, y);
    };
    wrapper.addEventListener("touchstart", (e) => {
      lpTimer = setTimeout(() => {
        const t = e.touches && e.touches[0];
        if (t) openEditorMenu(t.clientX, t.clientY);
      }, 480);
    }, { passive: true });
    wrapper.addEventListener("touchend", () => clearTimeout(lpTimer));
    wrapper.addEventListener("touchmove", () => clearTimeout(lpTimer));
    wrapper.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      openEditorMenu(e.clientX, e.clientY);
    });

    let hintTimer = null;
    editor.on("inputRead", (cm, change) => {
      const ch = (change.text[0] || "");
      if (/[A-Za-z0-9_\\.]/.test(ch)) {
        clearTimeout(hintTimer);
        hintTimer = setTimeout(() => {
          if (!cm.state.completionActive) cm.showHint({ hint: pythonHint, completeSingle: false });
        }, 120);
      }
    });
    requestAnimationFrame(() => {
      try {
        editor.setSize("100%", (cell.editorHeight || 160) + "px");
        editor.refresh();
      } catch (_) {}
    });
  } else {
    cell.editor = null;
    textarea.addEventListener("input", () => {
      cell.content = textarea.value;
      saveNotebookLocal();
    });
  }

  el.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const a = btn.dataset.action;
      activeCell = cell;

      if (a === "toggle-move-lock") {
        cell.moveLocked = !cell.moveLocked;
        renderCell(cell); markDirty();
        setStatus(cell.moveLocked ? "Move locked" : "Move unlocked", "ready");
        return;
      }
      if (a === "toggle-edit-lock") {
        setStatus("Hold the lock — same as the dashboard", "busy");
        return;
      }
      if (a === "retitle") {
        cell.titleLocked = false;
        const code = cell.editor ? cell.editor.getValue() : (cell.content || "");
        const auto = titleFromCode(code);
        if (auto) {
          cell.title = auto;
          const titleNode = el.querySelector(".cell-title");
          if (titleNode) titleNode.textContent = auto;
          setStatus("Name read from code", "ready");
        } else {
          setStatus("No title comment at the top of the code", "busy");
        }
        markDirty();
        saveNotebookLocal(true);
        return;
      }
      if (a === "run") return runCell(cell);
      if (a === "copy-code") return copyText(cell.editor ? cell.editor.getValue() : cell.content);
      if (a === "copy-output") return copyText(outputEl.innerText || "");
      if (a === "paste") {
        await pasteIntoEditor(cell.editor);
        return;
      }
      if (a === "cut") {
        if (cell.editor) {
          const t = cell.editor.getSelection();
          if (t) { await copyText(t); cell.editor.replaceSelection(""); }
        }
        return;
      }
      if (a === "undo" && cell.editor) return cell.editor.undo();
      if (a === "redo" && cell.editor) return cell.editor.redo();
      if (a === "minimize-cell" || a === "toggle-size") {
        const allMin = cell.collapsed && cell.outCollapsed;
        cell.collapsed = !allMin;
        cell.outCollapsed = !allMin;
        if (!cell.collapsed && !cell.editorHeight) cell.editorHeight = 160;
        if (!cell.outCollapsed && !cell.outputHeight) cell.outputHeight = 120;
        renderCell(cell); markDirty(); saveNotebookLocal(true); return;
      }
      if (a === "toggle-out") {
        cell.outCollapsed = !cell.outCollapsed;
        renderCell(cell); saveNotebookLocal(); return;
      }
      if (a === "preview") {
        const p = el.querySelector(".cell-md-preview");
        if (p) p.innerHTML = simpleMarkdown(cell.content);
        return;
      }
      if (a === "delete") {
        openCloseCellDialog(cell, el);
        return;
      }
      if (a === "up") {
        if (window.globalMoveLocked) { setStatus("Move locked from dashboard", "busy"); return; }
        const idx = cells.findIndex((c) => c.id === cell.id);
        if (idx <= 0) return;
        const prev = cells[idx - 1];
        cells[idx - 1] = cell;
        cells[idx] = prev;
        const prevEl = document.getElementById("cell-" + prev.id);
        if (prevEl) notebookEl.insertBefore(el, prevEl);
        markDirty(); saveNotebookLocal(true);
        setStatus("Cell moved up", "ready");
        return;
      }
      if (a === "down") {
        if (window.globalMoveLocked) { setStatus("Move locked from dashboard", "busy"); return; }
        const idx = cells.findIndex((c) => c.id === cell.id);
        if (idx < 0 || idx >= cells.length - 1) return;
        const next = cells[idx + 1];
        cells[idx + 1] = cell;
        cells[idx] = next;
        const nextEl = document.getElementById("cell-" + next.id);
        if (nextEl) notebookEl.insertBefore(nextEl, el);
        markDirty(); saveNotebookLocal(true);
        setStatus("Cell moved down", "ready");
        return;
      }
      if (a === "maximize") {
        cells.forEach((c) => {
          if (c !== cell && c.maximized) {
            c.maximized = false;
            const o = document.getElementById("cell-" + c.id);
            if (o) {
              o.classList.remove("maximized");
              // restore heights on other cells via re-render
              renderCell(c);
            }
          }
        });
        cell.maximized = !cell.maximized;
        if (cell.maximized) {
          cell._preMax = {
            eh: cell.editorHeight, oh: cell.outputHeight,
            collapsed: cell.collapsed, outCollapsed: cell.outCollapsed
          };
          cell.collapsed = false;
          cell.outCollapsed = false;
        } else if (cell._preMax) {
          cell.editorHeight = cell._preMax.eh;
          cell.outputHeight = cell._preMax.oh;
          cell.collapsed = cell._preMax.collapsed;
          cell.outCollapsed = cell._preMax.outCollapsed;
        }
        renderCell(cell);
        if (cell.maximized) {
          const ratio = cell.splitRatio || 0.7;
          const node = document.getElementById("cell-" + cell.id);
          if (node) {
            node.style.setProperty("--code-fr", String(ratio));
            node.style.setProperty("--out-fr", String(1 - ratio));
          }
        }
        markDirty();
        setStatus(cell.maximized ? "Maximized (~70% code / 30% output)" : "Cell restored", "ready");
        return;
      }
    });
  });
}

function startRename(cell, titleEl) {
  titleEl.contentEditable = "true";
  titleEl.classList.add("editing");
  titleEl.focus();
  const done = () => {
    titleEl.contentEditable = "false";
    titleEl.classList.remove("editing");
    const t = titleEl.textContent.trim();
    if (t) {
      cell.title = t;
      cell.titleLocked = true; // user name wins over auto-extract
    }
    markDirty();
    saveNotebookLocal(true);
    setStatus("Title set by user", "ready");
  };
  titleEl.addEventListener("blur", done, { once: true });
  titleEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); titleEl.blur(); }
  });
}

function simpleMarkdown(src) {
  return (src || "").replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/^### (.*)$/gm,"<h3>$1</h3>").replace(/^## (.*)$/gm,"<h2>$1</h2>")
    .replace(/^# (.*)$/gm,"<h1>$1</h1>").replace(/\\*\\*(.*?)\\*\\*/g,"<strong>$1</strong>")
    .replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\n/g,"<br>");
}

function escapeHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

async function copyText(text) {
  text = text == null ? "" : String(text);
  if (hasBridge && typeof AndroidBridge.setClipboardText === "function") {
    try { AndroidBridge.setClipboardText(text); return true; } catch (_) {}
  }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch (_) { return false; }
}

async function readClipboard() {
  if (hasBridge && typeof AndroidBridge.getClipboardText === "function") {
    try {
      const t = AndroidBridge.getClipboardText();
      if (t != null && t !== "") return t;
    } catch (_) {}
  }
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      return await navigator.clipboard.readText();
    }
  } catch (_) {}
  return "";
}

async function pasteIntoEditor(editor) {
  if (!editor) return;
  const t = await readClipboard();
  if (t) {
    editor.replaceSelection(t);
    try { editor.focus(); } catch (_) {}
  } else {
    setStatus("Clipboard empty or blocked", "error");
  }
}

async function runCell(cell) {
  if (!isReady || !pyodide || cell.type !== "code") {
    setStatus("Runtime not ready", "error"); return;
  }
  // Flush editor so last typed chars are never lost (before run)
  flushAllEditors();
  if (cell.editor) {
    try {
      if (cell.editor.save) cell.editor.save();
      cell.content = cell.editor.getValue();
      applyAutoTitle(cell);
    } catch (_) {}
  }
  saveNotebookLocal(true);
  // Also persist .ipynb path if known
  if (notebookPath && hasBridge) {
    try { AndroidBridge.saveUserFile(notebookPath, toIpynb()); } catch (_) {}
  }
  const code = cell.content || "";
  const el = document.getElementById("cell-" + cell.id);
  const out = el.querySelector(".cell-output");
  out.classList.remove("error");
  out.textContent = "Running…";
  setStatus("Running…", "busy");

  const importRe = /^\s*(?:import|from)\s+([a-zA-Z0-9_]+)/gm;
  let im; const needed = new Set();
  while ((im = importRe.exec(code))) {
    const mod = im[1];
    if (!["sys","os","io","math","json","re","time","datetime","collections","itertools","functools","traceback","base64","contextlib"].includes(mod))
      needed.add(mod);
  }
  for (const mod of needed) {
    try { await pyodide.runPythonAsync("import " + mod); }
    catch (_) { await ensurePackage(mod); }
  }

  try {
    const result = pyodide.runPython("_capture_run(" + JSON.stringify(code) + ")").toJs({ dict_converter: Object.fromEntries });
    let html = "";
    if (result.stdout) html += escapeHtml(result.stdout);
    if (result.stderr) { html += (html ? "\n" : "") + escapeHtml(result.stderr); cell.error = true; out.classList.add("error"); }
    if (result.images) result.images.forEach((b64) => { html += '<img src="data:image/png;base64,' + b64 + '" />'; });
    if (result.error_line != null) html += "\n[Line " + result.error_line + "] " + (result.error_type || "") + ": " + (result.error_msg || "");
    out.innerHTML = html || "<span style='color:var(--muted)'>(no output)</span>";
    cell.outputHtml = out.innerHTML;
    setStatus("Done", "ready");
    saveNotebookLocal();
  } catch (e) {
    out.textContent = String(e); out.classList.add("error"); cell.error = true;
    setStatus("Error", "error");
  }
}

/* Context menu */
let _ctxIgnoreUntil = 0;

function showCtx(x, y) {
  const m = document.getElementById("ctx-menu");
  if (!m) return;
  m.classList.remove("hidden");
  _ctxIgnoreUntil = Date.now() + 400; // ignore outside-dismiss briefly
  m.style.left = "0px";
  m.style.top = "0px";
  const rect = m.getBoundingClientRect();
  const mw = rect.width || 240;
  const mh = rect.height || 40;
  let left = x + 8;
  let top = y + 28;
  if (left + mw > window.innerWidth - 6) left = window.innerWidth - mw - 6;
  if (left < 6) left = 6;
  if (top + mh > window.innerHeight - 8) top = Math.max(8, y - mh - 16);
  m.style.left = left + "px";
  m.style.top = top + "px";
}

function hideCtx() {
  const m = document.getElementById("ctx-menu");
  if (m) m.classList.add("hidden");
}

async function handleCtxAction(a) {
  if (!ctxTarget) { hideCtx(); return; }

  // Output box
  if (ctxTarget.type === "output" && ctxTarget.el) {
    const el = ctxTarget.el;
    if (a === "select-all") {
      const r = document.createRange(); r.selectNodeContents(el);
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      _ctxIgnoreUntil = Date.now() + 800;
      setStatus("Output selected — use Copy", "ready");
      return;
    }
    hideCtx();
    if (a === "copy") {
      await copyText(el.innerText || "");
      setStatus("Copied output", "ready");
    }
    return;
  }

  if (ctxTarget.type !== "editor" || !ctxTarget.editor) { hideCtx(); return; }
  const cm = ctxTarget.editor;
  try { cm.focus(); } catch (_) {}
  if (a === "select-all") {
    cm.execCommand("selectAll");
    _ctxIgnoreUntil = Date.now() + 800;
    setStatus("Selected — use Copy", "ready");
    return;
  }
  hideCtx();
  if (a === "copy") {
    const live = cm.getSelection() || "";
    const text = live || ctxTarget.selection || "";
    if (!text) { setStatus("Nothing selected", "busy"); return; }
    await copyText(text);
    setStatus("Copied selection", "ready");
  } else if (a === "copy-line") {
    let line = "";
    try { line = cm.getLine(cm.getCursor().line) || ""; } catch (_) { line = ctxTarget.lineText || ""; }
    await copyText(line);
    setStatus("Copied line", "ready");
  } else if (a === "cut") {
    const t = cm.getSelection() || ctxTarget.selection || "";
    if (t) {
      await copyText(t);
      if (cm.getSelection()) cm.replaceSelection("");
      else if (ctxTarget.selection) {
        /* selection may have collapsed; replace only if it is still the live selection */
      }
      setStatus("Cut selection", "ready");
    } else setStatus("Nothing selected", "busy");
  } else if (a === "paste") {
    await pasteIntoEditor(cm);
  }
}

function wireCtxMenu() {
  const m = document.getElementById("ctx-menu");
  if (!m) return;
  m.querySelectorAll("button").forEach((btn) => {
    const fire = (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleCtxAction(btn.dataset.ctx);
    };
    btn.onclick = fire;
    btn.ontouchend = fire;
  });
}
wireCtxMenu();

function dismissFloatingMenus(e) {
  if (Date.now() < _ctxIgnoreUntil) return;
  const t = e && e.target;
  if (!t || !t.closest) return;
  // Context menu
  if (!t.closest("#ctx-menu")) hideCtx();
  // App hamburger menu — close on ANY outside tap
  if (!t.closest("#app-menu") && !t.closest("#btn-menu")) {
    const am = document.getElementById("app-menu");
    if (am) am.classList.add("hidden");
  }
}
document.addEventListener("click", dismissFloatingMenus, true);
document.addEventListener("touchstart", (e) => {
  if (Date.now() < _ctxIgnoreUntil) return;
  const t = e.target;
  if (t && t.closest && t.closest("#ctx-menu")) return;
  if (t && t.closest && (t.closest("#app-menu") || t.closest("#btn-menu"))) return;
  hideCtx();
  const am = document.getElementById("app-menu");
  if (am) am.classList.add("hidden");
}, { passive: true, capture: true });

function setupKeybar() {
  const bar = document.getElementById("keybar");
  if (!bar || bar.dataset.bound) return;
  bar.dataset.bound = "1";
  bar.addEventListener("click", async (e) => {
    const btn = e.target.closest(".kbtn");
    if (!btn) return;
    e.preventDefault();
    const key = btn.dataset.key;
    const cm = activeEditor;
    if (key === "ctrl") { ctrlHeld = !ctrlHeld; btn.classList.toggle("active", ctrlHeld); return; }
    if (key === "shift") { shiftHeld = !shiftHeld; btn.classList.toggle("active", shiftHeld); return; }
    if (!cm) return;
    cm.focus();
    if (key === "select-all") return cm.execCommand("selectAll");
    if (key === "copy") {
      const t = cm.getSelection() || "";
      if (!t) { setStatus("Nothing selected", "busy"); return; }
      await copyText(t);
      setStatus("Copied selection", "ready");
      return;
    }
    if (key === "cut") {
      const t = cm.getSelection();
      if (t) { await copyText(t); cm.replaceSelection(""); setStatus("Cut selection", "ready"); }
      else setStatus("Nothing selected", "busy");
      return;
    }
    if (key === "paste") { await pasteIntoEditor(cm); return; }
    if (key === "Tab") {
      if (shiftHeld) cm.indentSelection("subtract");
      else if (cm.somethingSelected()) cm.indentSelection("add");
      else cm.replaceSelection("    ", "end");
      return;
    }
    if (key === "Escape") { if (cm.state.completionActive) cm.state.completionActive.close(); return; }
    const map = { ArrowLeft: "goCharLeft", ArrowRight: "goCharRight", ArrowUp: "goLineUp", ArrowDown: "goLineDown", Home: "goLineStart", End: "goLineEnd" };
    if (map[key]) return cm.execCommand(map[key]);
    if (key.length === 1) cm.replaceSelection(key);
  });
  bar.addEventListener("contextmenu", (e) => e.preventDefault());
}

const KEYBAR_PRESET = [
  { key: "ctrl", label: "Ctrl", cls: "modifier", id: "mod-ctrl" },
  { key: "shift", label: "Shift", cls: "modifier", id: "mod-shift" },
  { key: "Tab", label: "Tab" },
  { key: "Escape", label: "Esc" },
  { key: "ArrowLeft", label: "←" },
  { key: "ArrowUp", label: "↑" },
  { key: "ArrowDown", label: "↓" },
  { key: "ArrowRight", label: "→" },
  { key: "Home", label: "Home" },
  { key: "End", label: "End" },
  { key: "select-all", label: "All", cls: "action" },
  { key: "copy", label: "Copy", cls: "action" },
  { key: "cut", label: "Cut", cls: "action" },
  { key: "paste", label: "Paste", cls: "action" },
  { key: "(", label: "(" },
  { key: ")", label: ")" },
  { key: "[", label: "[" },
  { key: "]", label: "]" },
  { key: "{", label: "{" },
  { key: "}", label: "}" },
  { key: ":", label: ":" },
  { key: "=", label: "=" },
  { key: "_", label: "_" },
  { key: "'", label: "'" },
  { key: '"', label: '"' },
];

function keybarItems() {
  const order = Array.isArray(settings.keybarOrder) && settings.keybarOrder.length
    ? settings.keybarOrder : KEYBAR_PRESET.map((k) => k.key);
  const hidden = new Set(settings.keybarHidden || []);
  const byKey = Object.fromEntries(KEYBAR_PRESET.map((k) => [k.key, k]));
  return order.map((key) => byKey[key]).filter((k) => k && !hidden.has(k.key));
}

function renderKeybar() {
  const bar = document.getElementById("keybar");
  if (!bar) return;
  bar.classList.toggle("rows-2", Number(settings.keybarRows) === 2);
  bar.innerHTML = keybarItems().map((k) => {
    const id = k.id ? ` id="${k.id}"` : "";
    const cls = k.cls ? ` ${k.cls}` : "";
    return `<button type="button" data-key="${k.key}" class="kbtn${cls}"${id}>${k.label}</button>`;
  }).join("");
  const ctrl = document.getElementById("mod-ctrl");
  const shift = document.getElementById("mod-shift");
  if (ctrl) ctrl.classList.toggle("active", ctrlHeld);
  if (shift) shift.classList.toggle("active", shiftHeld);
}

function fillKeybarEditor() {
  const box = document.getElementById("keybar-edit-list");
  if (!box) return;
  const order = Array.isArray(settings.keybarOrder) && settings.keybarOrder.length
    ? settings.keybarOrder.slice() : KEYBAR_PRESET.map((k) => k.key);
  const hidden = new Set(settings.keybarHidden || []);
  const byKey = Object.fromEntries(KEYBAR_PRESET.map((k) => [k.key, k]));
  box.innerHTML = "";
  order.forEach((key, idx) => {
    const item = byKey[key];
    if (!item) return;
    const row = document.createElement("div");
    row.className = "keybar-edit-row";
    row.dataset.key = key;
    row.innerHTML = `<input type="checkbox" ${hidden.has(key) ? "" : "checked"} /><span></span><button type="button" data-move="up">↑</button><button type="button" data-move="down">↓</button>`;
    row.querySelector("span").textContent = item.label;
    row.querySelector('[data-move="up"]').onclick = () => {
      if (idx <= 0) return;
      const arr = readKeybarEditorOrder();
      const i = arr.indexOf(key);
      if (i > 0) { const t = arr[i - 1]; arr[i - 1] = arr[i]; arr[i] = t; settings.keybarOrder = arr; settings.keybarHidden = readKeybarHidden(); fillKeybarEditor(); }
    };
    row.querySelector('[data-move="down"]').onclick = () => {
      const arr = readKeybarEditorOrder();
      const i = arr.indexOf(key);
      if (i >= 0 && i < arr.length - 1) { const t = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = t; settings.keybarOrder = arr; settings.keybarHidden = readKeybarHidden(); fillKeybarEditor(); }
    };
    box.appendChild(row);
  });
  const two = document.getElementById("set-keybar-two");
  if (two) two.checked = Number(settings.keybarRows) === 2;
}

function readKeybarEditorOrder() {
  return Array.from(document.querySelectorAll("#keybar-edit-list .keybar-edit-row")).map((r) => r.dataset.key);
}
function readKeybarHidden() {
  return Array.from(document.querySelectorAll("#keybar-edit-list .keybar-edit-row"))
    .filter((r) => !r.querySelector("input").checked)
    .map((r) => r.dataset.key);
}

function setupKeybarPosition() {
  /* merged into setupKeybarVisibility — keep no-op for callers */
}

/* Menu */
const btnOpen = document.getElementById("btn-open-file");
if (btnOpen) btnOpen.onclick = (e) => { e.preventDefault(); e.stopPropagation(); openFilePicker(); };

document.getElementById("btn-menu").onclick = (e) => {
  e.preventDefault();
  e.stopPropagation();
  const am = document.getElementById("app-menu");
  const opening = am.classList.contains("hidden");
  am.classList.toggle("hidden");
  if (opening) {
    // ignore outside-dismiss for a moment so the opening tap doesn't close it
    window._ctxIgnoreUntil = Date.now() + 400;
  }
};
document.querySelectorAll("#app-menu button").forEach((btn) => {
  btn.onclick = () => {
    document.getElementById("app-menu").classList.add("hidden");
    const m = btn.dataset.menu;
    if (m === "settings") openSettings();
    if (m === "packages") openPackages();
    if (m === "browse") openBrowse();
    if (m === "finance") openFinance();
    if (m === "offline") downloadOfflineRuntime();
    if (m === "durable") pickDurableFolder();
    if (m === "file-open") openFilePicker();
    if (m === "file-open-notebook") openFilePicker(".ipynb");
    if (m === "file-save") saveNotebookFile();
    if (m === "file-save-as") saveNotebookAs();
    if (m === "file-close") closeNotebookDocument();
    if (m === "file-save-cell") saveActiveCellFile();
    if (m === "migrate") migrateAssetsFolder();
  };
});

function openSettings() {
  const modal = document.getElementById("settings-modal");
  document.getElementById("set-theme").value = settings.theme;
  document.getElementById("set-code-theme").value = settings.codeTheme;
  document.getElementById("set-code-font").value = settings.codeFont;
  document.getElementById("set-fa-font").value = settings.faFont;
  document.getElementById("set-code-size").value = settings.codeSize;
  document.getElementById("set-out-size").value = settings.outSize;
  document.getElementById("set-indent-guides").checked = !!settings.indentGuides;
  document.getElementById("set-line-wrap").checked = !!settings.lineWrap;
  fillKeybarEditor();
  if (hasBridge) {
    document.getElementById("data-root-hint").textContent = "Assets: " + AndroidBridge.getDataRoot();
  }
  modal.classList.remove("hidden");
}
document.getElementById("settings-close").onclick = () => {
  settings.theme = document.getElementById("set-theme").value;
  settings.codeTheme = document.getElementById("set-code-theme").value;
  settings.codeFont = document.getElementById("set-code-font").value;
  settings.faFont = document.getElementById("set-fa-font").value;
  settings.customFontFile = document.getElementById("set-custom-font-file").value;
  settings.codeSize = +document.getElementById("set-code-size").value;
  settings.outSize = +document.getElementById("set-out-size").value;
  settings.indentGuides = document.getElementById("set-indent-guides").checked;
  settings.lineWrap = document.getElementById("set-line-wrap").checked;
  const two = document.getElementById("set-keybar-two");
  settings.keybarRows = two && two.checked ? 2 : 1;
  const order = readKeybarEditorOrder();
  if (order.length) settings.keybarOrder = order;
  settings.keybarHidden = readKeybarHidden();
  saveSettings(settings); applySettings(); renderKeybar();
  document.getElementById("settings-modal").classList.add("hidden");
};

function openPackages() {
  setStatus("Scanning packages in assets folder…", "busy");
  document.getElementById("pkg-log").textContent = "";
  document.getElementById("package-modal").classList.remove("hidden");
  if (hasBridge) {
    try {
      const list = JSON.parse(AndroidBridge.listLocalPackages() || "[]");
      document.getElementById("pkg-local-list").textContent =
        list.length ? list.map(p => p.name + " " + (p.version || "")).join("\n") : "(empty)";
    } catch (_) {}
  }
}
document.getElementById("pkg-cancel").onclick = () => document.getElementById("package-modal").classList.add("hidden");
document.getElementById("pkg-install").onclick = async () => {
  const n = document.getElementById("pkg-input").value.trim();
  if (n) await ensurePackage(n);
};

function openBrowse() {
  document.getElementById("browse-modal").classList.remove("hidden");
  if (hasBridge) document.getElementById("browse-root-hint").textContent = "Root: " + AndroidBridge.getDataRoot();
  loadBrowse("packages");
}
document.getElementById("browse-close").onclick = () => document.getElementById("browse-modal").classList.add("hidden");
document.querySelectorAll(".browse-tab").forEach((tab) => {
  tab.onclick = () => {
    document.querySelectorAll(".browse-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    loadBrowse(tab.dataset.folder);
  };
});
function loadBrowse(folder) {
  const list = document.getElementById("browse-list");
  if (!hasBridge) { list.textContent = "(Android only)"; return; }
  try {
    const items = JSON.parse(AndroidBridge.listFolder(folder || "packages") || "[]");
    list.textContent = items.length ? items.map(it => (it.name || it) + (it.size ? " (" + it.size + " B)" : "")).join("\n") : "(empty)";
  } catch (e) { list.textContent = String(e); }
}

function openFinance() {
  const box = document.getElementById("finance-list");
  box.innerHTML = "";
  FINANCE_PKGS.forEach((p) => {
    const local = hasBridge && AndroidBridge.hasLocalPackage(p.name);
    const row = document.createElement("div");
    row.className = "finance-item";
    row.innerHTML = '<span class="tick">' + (local ? "✓" : "○") + '</span><span class="name"><b>' + p.name + '</b> — ' + p.desc + '</span>';
    const b = document.createElement("button");
    b.textContent = local ? "Load" : "Download";
    b.onclick = async () => { await ensurePackage(p.name); openFinance(); };
    row.appendChild(b);
    box.appendChild(row);
  });
  document.getElementById("finance-modal").classList.remove("hidden");
}
document.getElementById("finance-close").onclick = () => document.getElementById("finance-modal").classList.add("hidden");

function openFilePicker(accept) {
  if (notebookDirty && !openFilePicker.bypass) {
    pendingCloseAction = () => {
      openFilePicker.bypass = true;
      try { openFilePicker(accept); } finally { openFilePicker.bypass = false; }
    };
    document.getElementById("unsaved-modal").classList.remove("hidden");
    return;
  }
  const input = document.createElement("input");
  input.type = "file";
  input.accept = accept || ".csv,.py,.txt,.json,.tsv,.ipynb,.xlsx";
  input.onchange = async () => {
    const f = input.files[0];
    if (!f) return;
    const text = await f.text();
    if (f.name.endsWith(".ipynb")) {
      try { loadFromIpynb(text); rememberPath("notebooks/" + f.name); setStatus("Opened " + f.name, "ready"); }
      catch (e) { alert("Invalid notebook: " + e.message); }
      return;
    }
    if (f.name.endsWith(".py")) addCell("code", text, f.name);
    else {
      if (pyodide) pyodide.FS.writeFile("/home/" + f.name, text);
      if (hasBridge) try { AndroidBridge.saveUserFile(f.name, text); } catch (_) {}
      addCell("code", "# Loaded: " + f.name + "\nimport pandas as pd\ndf = pd.read_csv(\"/home/" + f.name + "\")\nprint(df.head())\n", f.name);
    }
  };
  input.click();
}


function openCloseCellDialog(cell, el) {
  const modal = document.getElementById("close-cell-modal");
  if (!modal) {
    // fallback
    if (!confirm("Close cell?")) return;
    const idx = cells.findIndex((c) => c.id === cell.id);
    if (idx >= 0) cells.splice(idx, 1);
    el.remove(); markDirty(); saveNotebookLocal(true);
    return;
  }
  const py = document.getElementById("close-save-py");
  const ipynb = document.getElementById("close-save-ipynb");
  const nosave = document.getElementById("close-no-save");
  py.checked = true;
  ipynb.checked = false;
  nosave.checked = false;
  nosave.onchange = () => {
    if (nosave.checked) { py.checked = false; ipynb.checked = false; }
  };
  py.onchange = () => { if (py.checked) nosave.checked = false; };
  ipynb.onchange = () => { if (ipynb.checked) nosave.checked = false; };
  modal.classList.remove("hidden");
  const ok = document.getElementById("close-cell-ok");
  const cancel = document.getElementById("close-cell-cancel");
  const cleanup = () => {
    ok.onclick = null;
    cancel.onclick = null;
    modal.classList.add("hidden");
  };
  cancel.onclick = () => cleanup();
  ok.onclick = () => {
    const doPy = py.checked && !nosave.checked;
    const doNb = ipynb.checked && !nosave.checked;
    if (doPy) {
      flushAllEditors();
      const code = cell.editor ? cell.editor.getValue() : (cell.content || "");
      let name = (cell.title || ("cell-" + cell.id)).replace(/[\\/:*?"<>|]/g, "_");
      if (!name.endsWith(".py")) name += ".py";
      if (hasBridge) {
        const p = AndroidBridge.saveUserFile("notebooks/" + name, code);
        if (p) setStatus("Saved: " + p, "ready");
      }
    }
    if (doNb) {
      try { openSaveDialog(false); } catch (_) {}
    }
    const idx = cells.findIndex((c) => c.id === cell.id);
    if (idx >= 0) cells.splice(idx, 1);
    el.remove();
    markDirty();
    saveNotebookLocal(true);
    setStatus("Cell closed", "ready");
    cleanup();
  };
}

function openSaveDialog(forceAs) {
  saveNotebookLocal(true);
  pendingSaveUri = "";
  const modal = document.getElementById("save-modal");
  const title = document.getElementById("save-modal-title");
  const nameInput = document.getElementById("save-name");
  const pathDisp = document.getElementById("save-path-display");
  const pathInput = document.getElementById("save-path-input");
  const format = document.getElementById("save-format");
  title.textContent = "Save as…";
  if (format) format.value = "ipynb";
  let defaultName = "notebook.ipynb";
  if (notebookPath && notebookPath.indexOf("content:") !== 0) {
    defaultName = notebookPath.split("/").pop() || defaultName;
  }
  if (!/\.ipynb$/i.test(defaultName)) defaultName = defaultName.replace(/\.(json|py|md|html)$/i, "") + ".ipynb";
  if (forceAs && notebookPath) defaultName = defaultName.replace(/\.ipynb$/i, "") + "-copy.ipynb";
  nameInput.value = defaultName;
  if (pathInput) pathInput.value = "notebooks/";
  if (hasBridge && typeof AndroidBridge.getDataRoot === "function") {
    pathDisp.textContent = AndroidBridge.getDataRoot() + "/notebooks/";
  } else {
    pathDisp.textContent = "notebooks/";
  }
  modal.classList.remove("hidden");
  nameInput.focus();
}

const SAVE_FORMATS = {
  ipynb: { ext: ".ipynb", mime: "application/x-ipynb+json" },
  py: { ext: ".py", mime: "text/x-python" },
  md: { ext: ".md", mime: "text/markdown" },
  html: { ext: ".html", mime: "text/html" },
};

function withExt(name, ext) {
  const base = String(name || "notebook").trim().replace(/\.(ipynb|py|md|html|json)$/i, "");
  return (base || "notebook") + ext;
}

function exportNotebook(fmt) {
  flushAllEditors();
  if (fmt === "py") {
    return cells.filter((c) => c.type === "code").map((c) => c.content || "").join("\n\n");
  }
  if (fmt === "md") {
    return cells.map((c) => c.type === "markdown"
      ? (c.content || "")
      : "```python\n" + (c.content || "") + "\n```").join("\n\n");
  }
  if (fmt === "html") {
    const body = cells.map((c) => {
      const esc = escapeHtml(c.content || "");
      return c.type === "markdown" ? "<section>" + esc + "</section>" : "<pre>" + esc + "</pre>";
    }).join("\n");
    return "<!DOCTYPE html><meta charset=\"utf-8\"><title>Notebook</title><body>" + body + "</body>";
  }
  return toIpynb();
}

function downloadBlob(name, data, mime) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type: mime || "text/plain" }));
  a.download = name;
  a.click();
}

function writeNotebookBytes(relOrUri, data) {
  if (!hasBridge) return "";
  const target = String(relOrUri || "");
  if (target.indexOf("content:") === 0 && typeof AndroidBridge.saveToUri === "function") {
    return AndroidBridge.saveToUri(target, data) || "";
  }
  return AndroidBridge.saveUserFile(target, data) || "";
}

function quickSaveNotebook() {
  saveNotebookLocal(true);
  if (!notebookPath) return false;
  const data = toIpynb();
  if (hasBridge) {
    const path = writeNotebookBytes(notebookPath, data);
    if (!path) return false;
    notebookDirty = false;
    setStatus("Saved", "ready");
    return true;
  }
  const name = notebookPath.split("/").pop() || "notebook.ipynb";
  downloadBlob(name, data, "application/x-ipynb+json");
  notebookDirty = false;
  setStatus("Saved " + name, "ready");
  return true;
}

function confirmSaveDialog() {
  const modal = document.getElementById("save-modal");
  const fmt = (document.getElementById("save-format") && document.getElementById("save-format").value) || "ipynb";
  const spec = SAVE_FORMATS[fmt] || SAVE_FORMATS.ipynb;
  let name = withExt(document.getElementById("save-name").value || "notebook", spec.ext);
  name = name.replace(/[\\/]/g, "_");
  let folder = (document.getElementById("save-path-input").value || "notebooks/").replace(/\\/g, "/");
  folder = folder.replace(/^\//, "");
  if (folder && !folder.endsWith("/")) folder += "/";
  const data = exportNotebook(fmt);
  let saved = "";
  if (pendingSaveUri && hasBridge) {
    saved = writeNotebookBytes(pendingSaveUri, data);
  } else if (hasBridge) {
    saved = writeNotebookBytes(folder + name, data);
  } else {
    downloadBlob(name, data, spec.mime);
    saved = folder + name;
  }
  if (!saved) {
    setStatus("Save failed", "error");
    return;
  }
  if (fmt === "ipynb") {
    rememberPath(pendingSaveUri || (folder + name));
    notebookDirty = false;
  }
  modal.classList.add("hidden");
  pendingSaveUri = "";
  setStatus(fmt === "ipynb" ? ("Saved " + name) : ("Exported " + name), "ready");
  if (pendingCloseAction) {
    const next = pendingCloseAction;
    pendingCloseAction = null;
    next(true);
  }
}

function saveNotebookFile() {
  if (notebookPath && quickSaveNotebook()) {
    if (pendingCloseAction) {
      const next = pendingCloseAction;
      pendingCloseAction = null;
      next(true);
    }
    return;
  }
  openSaveDialog(false);
}

function actuallyCloseNotebook() {
  cells = [];
  cellIdCounter = 0;
  activeEditor = null;
  activeCell = null;
  if (notebookEl) {
    notebookEl.innerHTML = "";
    notebookEl.scrollTop = 0;
  }
  ensureFloor();
  rememberPath("");
  notebookDirty = false;
  setStatus("Notebook closed", "ready");
}

function closeNotebookDocument() {
  if (!notebookDirty) { actuallyCloseNotebook(); return; }
  pendingCloseAction = () => actuallyCloseNotebook();
  document.getElementById("unsaved-modal").classList.remove("hidden");
}

window.requestCloseApp = function requestCloseApp() {
  const leave = () => {
    if (hasBridge && AndroidBridge.finishActivity) AndroidBridge.finishActivity();
    else actuallyCloseNotebook();
  };
  if (!notebookDirty) { leave(); return; }
  pendingCloseAction = leave;
  document.getElementById("unsaved-modal").classList.remove("hidden");
};


function saveActiveCellFile() {
  if (!activeCell) { alert("No active cell"); return; }
  const code = activeCell.editor ? activeCell.editor.getValue() : activeCell.content;
  const name = (activeCell.title || "cell.py").replace(/[^\\w.\\-]+/g, "_");
  if (hasBridge) {
    alert("Saved: " + AndroidBridge.saveUserFile("notebooks/" + name, code));
  } else {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
    a.download = name; a.click();
  }
}

document.getElementById("btn-add-code").onclick = () => addCell("code", "");
document.getElementById("btn-add-md").onclick = () => addCell("markdown", "");
document.getElementById("btn-run-all").onclick = async () => {
  flushAllEditors();
  saveNotebookLocal(true);
  setStatus("Running all cells…", "busy");
  for (const c of cells) {
    if (c.type === "code") await runCell(c);
  }
  setStatus("Run all finished", "ready");
};

document.getElementById("btn-add-font").onclick = () => document.getElementById("font-file-input").click();
document.getElementById("set-code-size").oninput = (e) => { document.getElementById("set-code-size-val").textContent = e.target.value; };
document.getElementById("set-out-size").oninput = (e) => { document.getElementById("set-out-size-val").textContent = e.target.value; };

setupKeybar();
renderKeybar();
setupKeybarPosition();
applySettings();
async function downloadOfflineRuntime() {
  if (!hasBridge) { alert("Android only"); return; }
  if (AndroidBridge.isRuntimeReady()) {
    alert("Offline runtime already ready.\n" + AndroidBridge.getRuntimeDir());
    return;
  }
  if (!confirm("Download Pyodide runtime for offline use? (~30–50MB)")) return;
  setStatus("Downloading offline runtime…", "busy");
  try {
    const result = JSON.parse(AndroidBridge.cacheFullRuntime() || "{}");
    alert(result.ready ? "Offline runtime ready." : "Finished with issues. Check network.");
    setStatus(result.ready ? "Offline runtime ready" : "Runtime incomplete", result.ready ? "ready" : "error");
  } catch (e) {
    alert(String(e));
    setStatus("Runtime download failed", "error");
  }
}

function pickDurableFolder() {
  if (!hasBridge) { alert("Android only"); return; }
  AndroidBridge.pickDurableFolder();
}

window.__onDurableFolderSet = function(uri) {
  setStatus("Durable folder: " + uri, "ready");
};
window.__onAssetsMoved = function(path) {
  setStatus("Assets: " + path, "ready");
  const h = document.getElementById("data-root-hint");
  if (h) h.textContent = "Assets: " + path;
};


function saveNotebookAs() {
  openSaveDialog(true);
}

function migrateAssetsFolder() {
  if (!hasBridge) { alert("Android only"); return; }
  if (typeof AndroidBridge.migrateToPublicOrPick === "function") {
    AndroidBridge.migrateToPublicOrPick();
  } else if (typeof AndroidBridge.pickDurableFolder === "function") {
    if (confirm("Choose a folder. App will use it for packages, notebooks, runtime.")) {
      AndroidBridge.pickDurableFolder();
    }
  } else {
    alert("Update the Android shell for folder migrate.");
  }
}



// Save / unsaved modal wiring
(function wireSaveUi() {
  const sm = document.getElementById("save-modal");
  if (!sm) return;
  document.getElementById("save-cancel").onclick = () => {
    sm.classList.add("hidden");
    pendingSaveUri = "";
    pendingCloseAction = null;
  };
  document.getElementById("save-confirm").onclick = () => confirmSaveDialog();
  const formatSel = document.getElementById("save-format");
  if (formatSel) {
    formatSel.onchange = () => {
      const spec = SAVE_FORMATS[formatSel.value] || SAVE_FORMATS.ipynb;
      const nameInput = document.getElementById("save-name");
      if (nameInput) nameInput.value = withExt(nameInput.value, spec.ext);
    };
  }
  document.getElementById("save-browse").onclick = () => {
    const fmt = (formatSel && formatSel.value) || "ipynb";
    const spec = SAVE_FORMATS[fmt] || SAVE_FORMATS.ipynb;
    const name = withExt((document.getElementById("save-name").value || "notebook"), spec.ext);
    if (hasBridge && typeof AndroidBridge.pickSaveLocationWith === "function") {
      AndroidBridge.pickSaveLocationWith(spec.mime, name);
    } else if (hasBridge && typeof AndroidBridge.pickSaveLocation === "function") {
      AndroidBridge.pickSaveLocation();
    } else {
      setStatus("Set the name, folder and format, then Save", "ready");
    }
  };
  const um = document.getElementById("unsaved-modal");
  document.getElementById("unsaved-cancel").onclick = () => {
    um.classList.add("hidden");
    pendingCloseAction = null;
  };
  document.getElementById("unsaved-discard").onclick = () => {
    um.classList.add("hidden");
    notebookDirty = false;
    const next = pendingCloseAction;
    pendingCloseAction = null;
    if (next) next(false);
  };
  document.getElementById("unsaved-save").onclick = () => {
    um.classList.add("hidden");
    if (notebookPath && quickSaveNotebook()) {
      const next = pendingCloseAction;
      pendingCloseAction = null;
      if (next) next(true);
    } else {
      openSaveDialog(false);
    }
  };
})();

// Idle sync assets ↔ install cache
setInterval(() => {
  if (!hasBridge) return;
  try {
    if (typeof AndroidBridge.syncAssetsIncremental === "function") {
      AndroidBridge.syncAssetsIncremental();
    }
  } catch (_) {}
}, 45000);

window.__onSavePathPicked = function(path) {
  if (!path) return;
  pendingSaveUri = path;
  const disp = document.getElementById("save-path-display");
  if (disp) disp.textContent = "Chosen location — the file is written there";
  setStatus("Location chosen", "ready");
};



/* Floating scroll thumb (Easy Reader style) */
(function setupScrollThumb() {
  const thumb = document.getElementById("scroll-thumb");
  const nb = document.getElementById("notebook");
  if (!thumb || !nb) return;
  function placeThumb() {
    const maxScroll = nb.scrollHeight - nb.clientHeight;
    if (maxScroll <= 8) { thumb.style.display = "none"; return; }
    thumb.style.display = "block";
    const rect = nb.getBoundingClientRect();
    const ratio = nb.scrollTop / maxScroll;
    const travel = Math.max(20, rect.height - 56);
    const top = rect.top + 8 + ratio * travel;
    thumb.style.top = top + "px";
  }
  nb.addEventListener("scroll", placeThumb, { passive: true });
  window.addEventListener("resize", placeThumb);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", placeThumb);
  placeThumb();
  let dragging = false, startY = 0, startScroll = 0;
  const onStart = (y) => { dragging = true; startY = y; startScroll = nb.scrollTop; };
  const onMove = (y) => {
    if (!dragging) return;
    const maxScroll = nb.scrollHeight - nb.clientHeight;
    const rect = nb.getBoundingClientRect();
    const travel = Math.max(20, rect.height - 56);
    const dy = y - startY;
    nb.scrollTop = Math.max(0, Math.min(maxScroll, startScroll + (dy / travel) * maxScroll));
  };
  const onEnd = () => { dragging = false; };
  thumb.addEventListener("touchstart", (e) => { thumb.classList.add("dragging"); onStart(e.touches[0].clientY); e.preventDefault(); }, { passive: false });
  thumb.addEventListener("touchmove", (e) => { onMove(e.touches[0].clientY); e.preventDefault(); }, { passive: false });
  thumb.addEventListener("touchend", () => { thumb.classList.remove("dragging"); onEnd(); });
  thumb.addEventListener("mousedown", (e) => {
    onStart(e.clientY);
    const mm = (ev) => onMove(ev.clientY);
    const mu = () => { onEnd(); window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); };
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
  });
})();


// Offer Documents assets once
(function offerAssetsMove() {
  if (!hasBridge) return;
  try {
    const flag = localStorage.getItem("jide_assets_prompted");
    if (flag) return;
    localStorage.setItem("jide_assets_prompted", "1");
    setTimeout(() => {
      const root = (typeof AndroidBridge.getDataRoot === "function") ? AndroidBridge.getDataRoot() : "";
      if (root && root.indexOf("/Documents/") >= 0) {
        setStatus("Assets: " + root, "ready");
        return;
      }
      if (confirm("Move all app assets to Documents/JupyterIDE so you can see and back them up?")) {
        if (typeof AndroidBridge.migrateToPublicOrPick === "function") {
          setStatus("Moving assets to Documents…", "busy");
          AndroidBridge.migrateToPublicOrPick();
        }
      }
    }, 1500);
  } catch (_) {}
})();



/* Keybar: hide until keyboard; slide up from bottom and sit above keyboard */
(function setupKeybarVisibility() {
  const bar = document.getElementById("keybar");
  if (!bar) return;
  function keyboardHeight() {
    const vv = window.visualViewport;
    if (!vv) return 0;
    const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    return kb > 100 ? kb : 0;
  }
  function update() {
    const kb = keyboardHeight();
    if (kb > 0) {
      bar.style.bottom = kb + "px";
      bar.classList.add("show-kb");
      bar.classList.remove("hidden-kb");
      const pad = ((bar.classList.contains("rows-2") ? 96 : 48) + 12 + kb);
      if (notebookEl) notebookEl.style.paddingBottom = pad + "px";
      if (activeCell) {
        const el = document.getElementById("cell-" + activeCell.id);
        if (el) {
          stickCellUnderDashboard(el);
          setTimeout(() => stickCellUnderDashboard(el), 80);
          setTimeout(() => stickCellUnderDashboard(el), 220);
        }
      }
    } else {
      bar.classList.remove("show-kb");
      bar.style.bottom = "0px";
      if (notebookEl) notebookEl.style.paddingBottom = "12px";
    }
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", update);
    window.visualViewport.addEventListener("scroll", update);
  }
  window.addEventListener("resize", update);
  document.addEventListener("focusin", () => setTimeout(update, 50));
  document.addEventListener("focusout", () => setTimeout(update, 180));
  update();
})();

/* Dashboard global locks — composite icons, state via class only */
window.globalMoveLocked = false;
window.globalEditLocked = false;

function syncLockButtons() {
  const bm = document.getElementById("btn-lock-move");
  const be = document.getElementById("btn-lock-edit");
  if (bm) {
    bm.classList.toggle("active-lock", !!window.globalMoveLocked);
    bm.classList.toggle("unlocked", !window.globalMoveLocked);
    bm.setAttribute("aria-pressed", window.globalMoveLocked ? "true" : "false");
    bm.title = window.globalMoveLocked ? "جابه‌جایی همه باز شود" : "جابه‌جایی همه قفل شود";
  }
  if (be) {
    be.classList.toggle("active-lock", !!window.globalEditLocked);
    be.classList.toggle("unlocked", !window.globalEditLocked);
    be.setAttribute("aria-pressed", window.globalEditLocked ? "true" : "false");
    be.title = window.globalEditLocked ? "ویرایش همه باز شود" : "ویرایش همه قفل شود";
  }
}

function setAllEditLocked(locked) {
  window.globalEditLocked = !!locked;
  cells.forEach((c) => {
    c.editLocked = !!locked;
    if (c.editor) {
      try { c.editor.setOption("readOnly", !!locked); } catch (_) {}
    }
  });
  cells.forEach((c) => {
    try { renderCell(c); } catch (_) {}
  });
  syncLockButtons();
  setStatus(locked ? "All cells: edit locked" : "All cells: edit unlocked", "ready");
  try { saveNotebookLocal(true); } catch (_) {}
}

function wireLongPress(el, ms, fn) {
  if (!el || el.dataset.lpWired) return;
  el.dataset.lpWired = "1";
  let t = null;
  const clear = () => { if (t) clearTimeout(t); t = null; };
  const start = (e) => {
    clear();
    t = setTimeout(() => { t = null; fn(e); }, ms);
  };
  el.addEventListener("touchstart", start, { passive: true });
  el.addEventListener("touchend", clear);
  el.addEventListener("touchmove", clear);
  el.addEventListener("touchcancel", clear);
  el.addEventListener("mousedown", start);
  el.addEventListener("mouseup", clear);
  el.addEventListener("mouseleave", clear);
}

function wireDashboardLocks() {
  const bm = document.getElementById("btn-lock-move");
  const be = document.getElementById("btn-lock-edit");
  // Long-press ~2s (standard long-press range 500–2000ms; use 1800)
  if (bm && !bm.dataset.wired) {
    bm.dataset.wired = "1";
    bm.title = "Long-press: lock/unlock move for all cells";
    wireLongPress(bm, LONG_PRESS_MS, () => {
      window.globalMoveLocked = !window.globalMoveLocked;
      syncLockButtons();
      setStatus(window.globalMoveLocked ? "All cells: move locked" : "All cells: move unlocked", "ready");
    });
  }
  if (be && !be.dataset.wired) {
    be.dataset.wired = "1";
    be.title = "Long-press: lock/unlock edit for all cells";
    wireLongPress(be, LONG_PRESS_MS, () => {
      setAllEditLocked(!window.globalEditLocked);
    });
  }
  syncLockButtons();
}


wireDashboardLocks();

document.getElementById("btn-collapse-all")?.addEventListener("click", () => {
  cells.forEach((c) => {
    c.collapsed = true;
    c.outCollapsed = true;
    c.maximized = false;
    try { renderCell(c); } catch (_) {}
  });
  saveNotebookLocal(true);
  setStatus("All cells minimized", "ready");
});



/* Styled input() for Python */
window.__jideInputQueue = [];
function jideShowInput(promptText) {
  return new Promise((resolve) => {
    let backdrop = document.getElementById("input-modal");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "input-modal";
      backdrop.className = "input-backdrop hidden";
      backdrop.innerHTML = `
        <div class="input-sheet">
          <h3>Input</h3>
          <div class="input-prompt" id="input-prompt-text"></div>
          <input id="input-modal-field" type="text" autocomplete="off" spellcheck="false" />
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" id="input-modal-cancel">Cancel</button>
            <button type="button" class="btn btn-primary" id="input-modal-ok">OK</button>
          </div>
        </div>`;
      document.body.appendChild(backdrop);
    }
    const field = document.getElementById("input-modal-field");
    const promptEl = document.getElementById("input-prompt-text");
    promptEl.textContent = promptText || "";
    field.value = "";
    backdrop.classList.remove("hidden");
    setTimeout(() => field.focus(), 50);
    const finish = (val) => {
      backdrop.classList.add("hidden");
      document.getElementById("input-modal-ok").onclick = null;
      document.getElementById("input-modal-cancel").onclick = null;
      field.onkeydown = null;
      resolve(val);
    };
    document.getElementById("input-modal-ok").onclick = () => finish(field.value);
    document.getElementById("input-modal-cancel").onclick = () => finish("");
    field.onkeydown = (e) => {
      if (e.key === "Enter") { e.preventDefault(); finish(field.value); }
      if (e.key === "Escape") { e.preventDefault(); finish(""); }
    };
  });
}
window.jideShowInput = jideShowInput;
window.jideBlockingInput = function(promptText) {
  const msg = promptText && String(promptText).trim() ? String(promptText) : "Input:";
  const v = window.prompt(msg, "");
  return v === null ? "" : v;
};


initPyodide();
syncDashboardHeight();
window.addEventListener("resize", syncDashboardHeight);
ensureFloor();
document.addEventListener("contextmenu", (e) => {
  const t = e.target;
  if (t && t.closest && t.closest("button, .btn, .kbtn, .lock-btn, .grip-btn, .cell-toolbar")) {
    e.preventDefault();
  }
}, true);
