import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Copy,
  Lock,
  Menu,
  Minus,
  Pencil,
  Play,
  Plus,
  Redo2,
  RefreshCw,
  Square,
  Undo2,
  UnfoldVertical,
  X,
} from "lucide-react";
import { CodeEditor, type EditorMenuInfo } from "./CodeEditor";
import {
  DEFAULT_KEYS,
  FINANCE_PKGS,
  type Cell,
  type FileFormat,
  type KeyDef,
  type PersistShape,
  ensureExt,
  extOf,
  freshCell,
  fromIpynb,
  lineOf,
  loadPersist,
  savePersist,
  serializeExport,
  simpleMarkdown,
  starterCells,
  titleFromCode,
  toIpynb,
} from "./logic";
import { installPackage, pythonVersion, restartKernel, runPython } from "./python";

type Settings = {
  theme: "dark" | "light";
  codeTheme: "ide" | "monokai" | "dracula" | "github" | "vscode-dark" | "vscode-light";
  fontSize: number;
  outSize: number;
  codeFont: string;
  outFont: string;
  wrap: boolean;
  guides: boolean;
  twoRows: boolean;
  keys: KeyDef[];
};

type After = null | "close" | "open" | "new";
type SaveState = { name: string; format: FileFormat; after: After; bind: boolean };
type MenuState = EditorMenuInfo & { cellId: string };
type FileHandle = {
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }>;
  queryPermission?: (o: { mode: string }) => Promise<PermissionState>;
  requestPermission?: (o: { mode: string }) => Promise<PermissionState>;
};

const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  codeTheme: "vscode-dark",
  fontSize: 15,
  outSize: 13,
  codeFont: "ui-monospace, monospace",
  outFont: "ui-monospace, monospace",
  wrap: false,
  guides: false,
  twoRows: false,
  keys: DEFAULT_KEYS,
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem("jide-settings-v92");
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      keys: Array.isArray(parsed.keys) && parsed.keys.length ? parsed.keys : DEFAULT_KEYS,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function writeHandle(handle: FileHandle, data: string) {
  const writable = await handle.createWritable();
  await writable.write(data);
  await writable.close();
}

function download(name: string, data: string, format: FileFormat) {
  const type =
    format === "html" ? "text/html" : format === "py" ? "text/x-python" : format === "md" ? "text/markdown" : "application/x-ipynb+json";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function pickerTypes(format: FileFormat) {
  if (format === "py") return { description: "Python", accept: { "text/x-python": [".py"] } };
  if (format === "md") return { description: "Markdown", accept: { "text/markdown": [".md"] } };
  if (format === "html") return { description: "HTML", accept: { "text/html": [".html"] } };
  return { description: "Jupyter Notebook", accept: { "application/x-ipynb+json": [".ipynb"] } };
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export function NotebookApp() {
  const [cells, setCells] = useState<Cell[]>(() => starterCells());
  const [closed, setClosed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [fileName, setFileName] = useState("");
  const [savedOnce, setSavedOnce] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveLock, setMoveLock] = useState(false);
  const [editLock, setEditLock] = useState(false);
  const [saveBox, setSaveBox] = useState<SaveState | null>(null);
  const [guard, setGuard] = useState<After>(null);
  const [closeCell, setCloseCell] = useState<{ id: string; py: boolean; nb: boolean; nosave: boolean } | null>(null);
  const [ctx, setCtx] = useState<MenuState | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pkgOpen, setPkgOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [pkgName, setPkgName] = useState("");
  const [pkgLog, setPkgLog] = useState("");
  const [loaded, setLoaded] = useState<string[]>([]);
  const [ask, setAsk] = useState<{ prompt: string; resolve: (v: string) => void } | null>(null);
  const [askValue, setAskValue] = useState("");
  const [dashH, setDashH] = useState(92);
  const [running, setRunning] = useState<string | null>(null);

  const idRef = useRef(3);
  const handleRef = useRef<FileHandle | null>(null);
  const cellsRef = useRef(cells);
  const activeTa = useRef<HTMLTextAreaElement | null>(null);
  const activeId = useRef<string | null>(null);
  const nbRef = useRef<HTMLElement | null>(null);
  const dashRef = useRef<HTMLElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const clipRef = useRef("");
  const ctrlRef = useRef(false);
  const shiftRef = useRef(false);
  const hist = useRef(new Map<string, { stack: string[]; i: number }>());
  const skipHist = useRef(false);
  const booted = useRef(false);
  const [mods, setMods] = useState({ ctrl: false, shift: false });

  cellsRef.current = cells;

  useEffect(() => {
    const saved = loadPersist();
    const s = loadSettings();
    setSettings(s);
    if (saved) {
      setCells(saved.cells.length ? saved.cells : []);
      setClosed(!!saved.closed || saved.cells.length === 0);
      setDirty(!!saved.dirty);
      setFileName(saved.fileName || "");
      setSavedOnce(!!saved.savedOnce);
      const max = saved.cells.reduce((m, c) => {
        const n = parseInt(c.id.replace(/\D/g, ""), 10);
        return Number.isFinite(n) ? Math.max(m, n) : m;
      }, 2);
      idRef.current = max + 1;
      saved.cells.forEach((c) => hist.current.set(c.id, { stack: [c.content], i: 0 }));
    }
    booted.current = true;
  }, []);

  useEffect(() => {
    if (!booted.current) return;
    const t = window.setTimeout(() => {
      const data: PersistShape = { v: 92, cells, fileName, savedOnce, dirty, closed };
      savePersist(data);
    }, 350);
    return () => window.clearTimeout(t);
  }, [cells, fileName, savedOnce, dirty, closed]);

  useEffect(() => {
    localStorage.setItem("jide-settings-v92", JSON.stringify(settings));
    document.documentElement.style.setProperty("--code-size", settings.fontSize + "px");
    document.documentElement.style.setProperty("--out-size", settings.outSize + "px");
    document.documentElement.style.setProperty("--font-code", settings.codeFont || "ui-monospace, monospace");
    document.documentElement.style.setProperty("--font-out", settings.outFont || settings.codeFont || "ui-monospace, monospace");
    document.documentElement.style.setProperty("--font-mono", settings.codeFont || "ui-monospace, monospace");
  }, [settings]);

  useEffect(() => {
    const el = dashRef.current;
    if (!el) return;
    const apply = () => {
      const h = el.offsetHeight;
      setDashH(h);
      document.documentElement.style.setProperty("--dash-h", h + "px");
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [closed, status, fileName]);

  useEffect(() => {
    window.jideAsk = (prompt: string) =>
      new Promise((resolve) => {
        setAskValue("");
        setAsk({ prompt, resolve });
      });
    return () => {
      delete window.jideAsk;
    };
  }, []);

  function stickCell(id: string) {
    const nb = nbRef.current;
    const el = document.getElementById("cell-" + id);
    if (!nb || !el || el.classList.contains("is-max")) return;
    const delta = el.getBoundingClientRect().top - nb.getBoundingClientRect().top;
    if (Math.abs(delta) > 2) nb.scrollTop += delta;
  }

  useEffect(() => {
    const vv = window.visualViewport;
    let timer = 0;
    const apply = () => {
      const shell = shellRef.current;
      if (!shell) return;
      if (!vv) {
        shell.style.position = "";
        shell.style.top = "";
        shell.style.left = "";
        shell.style.right = "";
        shell.style.height = "";
        shell.classList.remove("kb-open");
        return;
      }
      // Keyboard inset from bottom of layout viewport
      const inset = Math.round(window.innerHeight - vv.height - (vv.offsetTop || 0));
      const kbOpen = inset > 90;
      if (kbOpen) {
        // Pin shell to visual viewport so keybar (last flex child) sits flush on keyboard
        shell.classList.add("kb-open");
        shell.style.position = "fixed";
        shell.style.left = "0";
        shell.style.right = "0";
        shell.style.top = (vv.offsetTop || 0) + "px";
        shell.style.height = vv.height + "px";
      } else {
        shell.classList.remove("kb-open");
        shell.style.position = "";
        shell.style.top = "";
        shell.style.left = "";
        shell.style.right = "";
        shell.style.height = "";
      }
      // Sync --key-h from real keybar height
      const bar = shell.querySelector(".keybar") as HTMLElement | null;
      if (bar) {
        document.documentElement.style.setProperty("--key-h", bar.offsetHeight + "px");
      }
      const id = activeId.current;
      if (id && kbOpen) {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => stickCell(id), 40);
      }
    };
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    window.addEventListener("resize", apply);
    apply();
    return () => {
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void onSave();
      }
      if (e.key === "Escape") {
        setCtx(null);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function nextId() {
    idRef.current += 1;
    return "c" + idRef.current;
  }

  function patch(id: string, partial: Partial<Cell>, mark = true) {
    setCells((prev) => prev.map((c) => (c.id === id ? { ...c, ...partial } : c)));
    if (mark) setDirty(true);
  }

  function pushHist(id: string, value: string) {
    if (skipHist.current) return;
    let h = hist.current.get(id);
    if (!h) {
      hist.current.set(id, { stack: [value], i: 0 });
      return;
    }
    if (h.stack[h.i] === value) return;
    h.stack = h.stack.slice(0, h.i + 1);
    h.stack.push(value);
    if (h.stack.length > 80) {
      h.stack.shift();
      h.i = h.stack.length - 1;
    }
    h.i = h.stack.length - 1;
  }

  function onEdit(cell: Cell, value: string) {
    pushHist(cell.id, value);
    const partial: Partial<Cell> = { content: value };
    if (cell.type === "code" && !cell.titleLocked) {
      const auto = titleFromCode(value);
      if (auto) partial.title = auto;
    }
    patch(cell.id, partial, true);
  }

  function undo(id: string) {
    const h = hist.current.get(id);
    if (!h || h.i <= 0) return;
    h.i -= 1;
    skipHist.current = true;
    patch(id, { content: h.stack[h.i] || "" });
    skipHist.current = false;
  }

  function redo(id: string) {
    const h = hist.current.get(id);
    if (!h || h.i >= h.stack.length - 1) return;
    h.i += 1;
    skipHist.current = true;
    patch(id, { content: h.stack[h.i] || "" });
    skipHist.current = false;
  }

  function addCell(type: Cell["type"], content = "", title = "") {
    const id = nextId();
    const cell = freshCell(id, type, content, title);
    hist.current.set(id, { stack: [cell.content], i: 0 });
    setCells((prev) => [...prev, cell]);
    setClosed(false);
    setDirty(true);
    setStatus(type === "code" ? "Code cell added" : "Markdown cell added");
    window.setTimeout(() => stickCell(id), 30);
  }

  function move(id: string, dir: -1 | 1) {
    if (moveLock) {
      setStatus("Move lock is on");
      return;
    }
    setCells((prev) => {
      const i = prev.findIndex((c) => c.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      const a = next[i];
      const b = next[j];
      if (!a || !b) return prev;
      next[i] = b;
      next[j] = a;
      return next;
    });
    setDirty(true);
  }

  function removeCell(id: string) {
    setCells((prev) => prev.filter((c) => c.id !== id));
    setDirty(true);
    setStatus("Cell closed");
  }

  async function runCell(cell: Cell) {
    if (cell.type !== "code") return;
    setRunning(cell.id);
    setStatus("Running Python…");
    try {
      const result = await runPython(cell.content);
      const err = result.error_type ? `${result.error_type}: ${result.error_msg || ""}` : null;
      patch(
        cell.id,
        { stdout: result.stdout, stderr: result.stderr, images: result.images, error: err, outCollapsed: false },
        false,
      );
      const ver = await pythonVersion().catch(() => "");
      setStatus(err ? "Cell error" : "Ran" + (ver ? " · Python " + ver : ""));
    } catch (e) {
      patch(cell.id, { error: e instanceof Error ? e.message : String(e), stdout: "", stderr: "" }, false);
      setStatus("Python failed");
    } finally {
      setRunning(null);
    }
  }

  async function runAll() {
    setMenuOpen(false);
    for (const c of cellsRef.current) {
      if (c.type === "code") await runCell(c);
    }
    setStatus("Finished running all");
  }

  function notebookData() {
    return toIpynb(cellsRef.current);
  }

  async function silentSave() {
    if (!savedOnce) return false;
    const data = notebookData();
    const name = ensureExt(fileName || "notebook.ipynb", "ipynb");
    const handle = handleRef.current;
    if (handle) {
      try {
        const perm = handle.requestPermission ? await handle.requestPermission({ mode: "readwrite" }) : "granted";
        if (perm !== "granted") return false;
        await writeHandle(handle, data);
        setDirty(false);
        setStatus("Saved: " + name);
        return true;
      } catch {
        return false;
      }
    }
    download(name, data, "ipynb");
    setDirty(false);
    setStatus("Saved: " + name);
    return true;
  }

  function openSave(partial: Partial<SaveState>) {
    const current = fileName || "notebook.ipynb";
    setSaveBox({
      name: partial.name || current,
      format: partial.format || "ipynb",
      after: partial.after ?? null,
      bind: partial.bind !== false,
    });
  }

  async function onSave() {
    setMenuOpen(false);
    if (closed) {
      setStatus("No notebook open");
      return;
    }
    if (savedOnce && (fileName.endsWith(".ipynb") || !fileName)) {
      const ok = await silentSave();
      if (ok) {
        if (guard) finishAfter(guard);
        return;
      }
    }
    openSave({ name: fileName || "notebook.ipynb", format: "ipynb", after: guard, bind: true });
  }

  function finishAfter(action: After) {
    setGuard(null);
    if (action === "close") finishClose();
    if (action === "open") void pickOpen();
    if (action === "new") finishNew();
  }

  function finishClose() {
    setCells([]);
    setClosed(true);
    setDirty(false);
    setSavedOnce(false);
    setFileName("");
    handleRef.current = null;
    setStatus("Notebook closed");
  }

  function finishNew() {
    const id = "c" + (idRef.current + 1);
    idRef.current += 1;
    const cell = freshCell(id, "code", "# New notebook\nprint('ready')\n");
    hist.current = new Map([[id, { stack: [cell.content], i: 0 }]]);
    setCells([cell]);
    setClosed(false);
    setDirty(false);
    setSavedOnce(false);
    setFileName("");
    handleRef.current = null;
    setStatus("New notebook");
  }

  function request(action: After) {
    setMenuOpen(false);
    if (closed || !dirty) {
      finishAfter(action);
      return;
    }
    setGuard(action);
  }

  async function confirmSave() {
    if (!saveBox) return;
    const name = ensureExt(saveBox.name, saveBox.format);
    const data =
      saveBox.bind === false && saveBox.format === "py" && activeId.current
        ? cellsRef.current.find((c) => c.id === activeId.current)?.content || ""
        : serializeExport(cellsRef.current, saveBox.format, name.replace(/\.[^.]+$/, ""));
    const picker = (window as Window & { showSaveFilePicker?: (o: unknown) => Promise<FileHandle> }).showSaveFilePicker;
    try {
      if (picker) {
        const handle = await picker({ suggestedName: name, types: [pickerTypes(saveBox.format)] });
        await writeHandle(handle, data);
        if (saveBox.bind && saveBox.format === "ipynb") {
          handleRef.current = handle;
          setFileName(handle.name || name);
          setSavedOnce(true);
          setDirty(false);
        }
        setStatus(saveBox.format === "ipynb" && saveBox.bind ? "Saved: " + (handle.name || name) : "Exported: " + name);
      } else {
        download(name, data, saveBox.format);
        if (saveBox.bind && saveBox.format === "ipynb") {
          setFileName(name);
          setSavedOnce(true);
          setDirty(false);
          handleRef.current = null;
        }
        setStatus("Downloaded: " + name);
      }
      const after = saveBox.after;
      setSaveBox(null);
      if (after) finishAfter(after);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setStatus("Save cancelled");
        return;
      }
      download(name, data, saveBox.format);
      if (saveBox.bind && saveBox.format === "ipynb") {
        setFileName(name);
        setSavedOnce(true);
        setDirty(false);
        handleRef.current = null;
      }
      setStatus("Downloaded: " + name);
      const after = saveBox.after;
      setSaveBox(null);
      if (after) finishAfter(after);
    }
  }

  function applyTextFile(name: string, text: string, handle: FileHandle | null) {
    if (name.endsWith(".ipynb") || text.trim().startsWith("{")) {
      try {
        const rows = fromIpynb(text);
        const next = rows.map((r) => {
          const id = nextId();
          const cell = freshCell(id, r.type, r.content, r.title);
          if (r.title) cell.titleLocked = true;
          hist.current.set(id, { stack: [cell.content], i: 0 });
          return cell;
        });
        hist.current = new Map(next.map((c) => [c.id, { stack: [c.content], i: 0 }]));
        setCells(next.length ? next : [freshCell(nextId(), "code", "")]);
        setClosed(false);
        setDirty(false);
        setSavedOnce(true);
        setFileName(name);
        handleRef.current = handle;
        setStatus("Opened: " + name);
        return;
      } catch {
        if (name.endsWith(".ipynb")) {
          setStatus("Notebook file is broken");
          return;
        }
      }
    }
    if (name.endsWith(".py") || name.endsWith(".txt") || name.endsWith(".md")) {
      addCell(name.endsWith(".md") ? "markdown" : "code", text, name);
      setStatus("Imported: " + name);
      return;
    }
    const preview = text.length > 4000 ? text.slice(0, 4000) : text;
    addCell("code", `# Loaded: ${name}\ndata = ${JSON.stringify(preview)}\nprint("\\n".join(data.splitlines()[:12]))\n`, name);
    setStatus("Imported: " + name);
  }

  async function pickOpen() {
    const opener = (window as Window & { showOpenFilePicker?: (o: unknown) => Promise<FileHandle[]> }).showOpenFilePicker;
    if (opener) {
      try {
        const [handle] = await opener({
          types: [
            {
              description: "Notebook",
              accept: {
                "application/x-ipynb+json": [".ipynb"],
                "text/x-python": [".py"],
                "text/plain": [".txt", ".md", ".csv"],
              },
            },
          ],
        });
        if (!handle) return;
        const file = await handle.getFile();
        applyTextFile(file.name, await file.text(), file.name.endsWith(".ipynb") ? handle : null);
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".ipynb,.py,.md,.txt,.csv,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      applyTextFile(file.name, await file.text(), null);
    };
    input.click();
  }

  async function saveActiveCell() {
    setMenuOpen(false);
    const id = activeId.current;
    const cell = cellsRef.current.find((c) => c.id === id);
    if (!cell) {
      setStatus("No active cell");
      return;
    }
    openSave({
      name: ensureExt(cell.title || "cell.py", "py"),
      format: "py",
      after: null,
      bind: false,
    });
  }

  async function confirmCloseCell() {
    if (!closeCell) return;
    const cell = cellsRef.current.find((c) => c.id === closeCell.id);
    if (!cell) {
      setCloseCell(null);
      return;
    }
    if (!closeCell.nosave && closeCell.py) {
      const name = ensureExt(cell.title || "cell.py", "py");
      download(name, cell.content, "py");
      setStatus("Cell saved: " + name);
    }
    if (!closeCell.nosave && closeCell.nb) {
      if (!(await silentSave()) && !savedOnce) {
        setCloseCell(null);
        openSave({ name: fileName || "notebook.ipynb", format: "ipynb", after: null, bind: true });
        setStatus("Save the notebook first");
        return;
      }
    }
    removeCell(cell.id);
    setCloseCell(null);
  }

  function toggleGlobalEdit() {
    setEditLock((v) => {
      const next = !v;
      setCells((prev) => prev.map((c) => ({ ...c, editLocked: next })));
      setStatus(next ? "All editing locked" : "All editing unlocked");
      return next;
    });
  }

  function rereadTitle(cell: Cell) {
    const auto = titleFromCode(cell.content);
    if (!auto) {
      setStatus("No name in the top comments");
      return;
    }
    patch(cell.id, { title: auto, titleLocked: false });
    setStatus("Name from code: " + auto);
  }

  function activeLocked() {
    const id = activeId.current;
    const cell = cellsRef.current.find((c) => c.id === id);
    return !cell || cell.editLocked || editLock;
  }

  function insertIntoActive(text: string) {
    const ta = activeTa.current;
    if (!ta || !activeId.current) {
      setStatus("Tap inside the code first");
      return;
    }
    if (activeLocked()) {
      setStatus("Editing is locked");
      return;
    }
    ta.focus();
    const ok = document.execCommand("insertText", false, text);
    if (!ok) {
      const a = ta.selectionStart ?? 0;
      const b = ta.selectionEnd ?? 0;
      const next = ta.value.slice(0, a) + text + ta.value.slice(b);
      const id = activeId.current;
      const cell = cellsRef.current.find((c) => c.id === id);
      if (cell) onEdit(cell, next);
      window.setTimeout(() => {
        ta.focus();
        ta.selectionStart = ta.selectionEnd = a + text.length;
      }, 0);
    }
  }

  function fireKey(key: string) {
    const ta = activeTa.current;
    if (key === "ctrl") {
      ctrlRef.current = !ctrlRef.current;
      setMods({ ctrl: ctrlRef.current, shift: shiftRef.current });
      return;
    }
    if (key === "shift") {
      shiftRef.current = !shiftRef.current;
      setMods({ ctrl: ctrlRef.current, shift: shiftRef.current });
      return;
    }
    if (!ta || !activeId.current) {
      setStatus("Tap inside the code first");
      return;
    }
    ta.focus();
    const ctrl = ctrlRef.current;
    if (key === "select-all" || (ctrl && key.toLowerCase() === "a")) {
      ta.selectionStart = 0;
      ta.selectionEnd = ta.value.length;
      setStatus("Whole cell selected");
      return;
    }
    if (key === "copy" || (ctrl && key.toLowerCase() === "c")) {
      const text = ta.value.slice(ta.selectionStart ?? 0, ta.selectionEnd ?? 0);
      if (!text) setStatus("Nothing selected");
      else {
        clipRef.current = text;
        void copyText(text);
        setStatus("Copied");
      }
      return;
    }
    if (key === "cut" || (ctrl && key.toLowerCase() === "x")) {
      const a = ta.selectionStart ?? 0;
      const b = ta.selectionEnd ?? 0;
      const text = ta.value.slice(a, b);
      if (!text) setStatus("Nothing selected");
      else if (!activeLocked()) {
        clipRef.current = text;
        void copyText(text);
        const id = activeId.current;
        const cell = cellsRef.current.find((c) => c.id === id);
        if (cell) onEdit(cell, ta.value.slice(0, a) + ta.value.slice(b));
        setStatus("Cut");
      }
      return;
    }
    if (key === "paste" || (ctrl && key.toLowerCase() === "v")) {
      void (async () => {
        let text = clipRef.current;
        try {
          const sys = await navigator.clipboard.readText();
          if (sys) text = sys;
        } catch {
          /* keep internal */
        }
        if (!text) {
          setStatus("Clipboard is empty");
          return;
        }
        insertIntoActive(text);
        setStatus("Pasted");
      })();
      return;
    }
    if (key === "Escape") {
      ta.blur();
      return;
    }
    if (key === "Tab") {
      insertIntoActive("    ");
      return;
    }
    if (key.startsWith("Arrow") || key === "Home" || key === "End") {
      const len = ta.value.length;
      let pos = ta.selectionStart ?? 0;
      if (key === "ArrowLeft") pos = Math.max(0, pos - 1);
      if (key === "ArrowRight") pos = Math.min(len, pos + 1);
      if (key === "Home") pos = ta.value.lastIndexOf("\n", Math.max(0, pos - 1)) + 1;
      if (key === "End") {
        const nl = ta.value.indexOf("\n", pos);
        pos = nl === -1 ? len : nl;
      }
      if (key === "ArrowUp" || key === "ArrowDown") {
        const lines = ta.value.split("\n");
        let remain = pos;
        let line = 0;
        for (; line < lines.length; line++) {
          const size = (lines[line]?.length ?? 0) + 1;
          if (remain < size) break;
          remain -= size;
        }
        const nextLine = line + (key === "ArrowUp" ? -1 : 1);
        if (nextLine < 0 || nextLine >= lines.length) return;
        let base = 0;
        for (let i = 0; i < nextLine; i++) base += (lines[i]?.length ?? 0) + 1;
        pos = base + Math.min(remain, lines[nextLine]?.length ?? 0);
      }
      ta.selectionStart = ta.selectionEnd = pos;
      return;
    }
    if (key.length === 1) insertIntoActive(shiftRef.current ? key.toUpperCase() : key);
  }

  async function doInstall(name: string) {
    const n = name.trim();
    if (!n) return;
    setPkgLog((l) => l + "\nInstalling " + n + " …");
    setStatus("Installing " + n);
    try {
      await installPackage(n);
      setLoaded((prev) => (prev.includes(n) ? prev : [...prev, n]));
      setPkgLog((l) => l + "\nReady: " + n);
      setStatus("Installed: " + n);
    } catch (e) {
      setPkgLog((l) => l + "\nError: " + (e instanceof Error ? e.message : String(e)));
      setStatus("Install failed: " + n);
    }
  }

  function applyCtxCopy(text: string, label: string) {
    if (!text) {
      setStatus("Nothing selected");
      setCtx(null);
      return;
    }
    clipRef.current = text;
    void copyText(text);
    setStatus(label);
    setCtx(null);
  }

  function ctxCopy() {
    if (!ctx) return;
    const a = Math.min(ctx.start, ctx.end);
    const b = Math.max(ctx.start, ctx.end);
    applyCtxCopy(ctx.value.slice(a, b), "Selection copied");
  }

  function ctxLine() {
    if (!ctx) return;
    applyCtxCopy(lineOf(ctx.value, Math.min(ctx.start, ctx.end)), "Line copied");
  }

  function ctxCut() {
    if (!ctx) return;
    const cell = cellsRef.current.find((c) => c.id === ctx.cellId);
    if (!cell || cell.editLocked || editLock) {
      setStatus("Editing is locked");
      setCtx(null);
      return;
    }
    const a = Math.min(ctx.start, ctx.end);
    const b = Math.max(ctx.start, ctx.end);
    const text = ctx.value.slice(a, b);
    if (!text) {
      setStatus("Nothing selected");
      setCtx(null);
      return;
    }
    clipRef.current = text;
    void copyText(text);
    onEdit(cell, ctx.value.slice(0, a) + ctx.value.slice(b));
    setStatus("Cut");
    setCtx(null);
  }

  async function ctxPaste() {
    if (!ctx) return;
    const cell = cellsRef.current.find((c) => c.id === ctx.cellId);
    if (!cell || cell.editLocked || editLock) {
      setStatus("Editing is locked");
      setCtx(null);
      return;
    }
    let text = clipRef.current;
    try {
      const sys = await navigator.clipboard.readText();
      if (sys) text = sys;
    } catch {
      /* internal clip */
    }
    if (!text) {
      setStatus("Clipboard is empty");
      setCtx(null);
      return;
    }
    const a = Math.min(ctx.start, ctx.end);
    const b = Math.max(ctx.start, ctx.end);
    onEdit(cell, ctx.value.slice(0, a) + text + ctx.value.slice(b));
    setStatus("Pasted");
    setCtx(null);
  }

  function ctxAll() {
    if (!ctx) return;
    const ta = activeTa.current;
    if (ta) {
      ta.focus();
      ta.selectionStart = 0;
      ta.selectionEnd = ta.value.length;
    }
    setStatus("Whole cell selected");
    setCtx(null);
  }

  function moveKey(index: number, dir: -1 | 1) {
    setSettings((s) => {
      const keys = s.keys.slice();
      const j = index + dir;
      if (j < 0 || j >= keys.length) return s;
      const a = keys[index];
      const b = keys[j];
      if (!a || !b) return s;
      keys[index] = b;
      keys[j] = a;
      return { ...s, keys };
    });
  }

  const maximized = cells.some((c) => c.maximized);
  const ctxStyle = ctx
    ? {
        left: Math.max(8, Math.min(ctx.x, (typeof window !== "undefined" ? window.innerWidth : 360) - 180)),
        top: Math.max(dashH + 8, Math.min(ctx.y, (typeof window !== "undefined" ? window.innerHeight : 640) - 220)),
      }
    : undefined;

  return (
    <div
      ref={shellRef}
      className={
        "shell theme-" +
        settings.theme +
        " code-" +
        settings.codeTheme +
        (maximized ? " is-max" : "") +
        (settings.twoRows ? " keys-two" : "")
      }
      onPointerDown={() => setCtx(null)}
    >
      <header className="dash" ref={dashRef}>
        <div className="dash-top">
          <div className="brand">
            <span className="logo" aria-hidden="true">◉</span>
            <div>
              <div className="brand-name">Jupyter IDE</div>
              <div className="brand-file">
                {closed ? "No notebook" : fileName || "Untitled"}
                {dirty && !closed ? " •" : ""}
              </div>
            </div>
          </div>
          <div className="dash-actions">
            <LongPress
              className={"icon-btn" + (moveLock ? " is-on" : "")}
              title="Long-press: lock moving all cells"
              onLong={() => {
                setMoveLock((v) => !v);
                setStatus(!moveLock ? "Moving locked" : "Moving unlocked");
              }}
              onShort={() => setStatus("Hold to lock moving")}
            >
              <Lock size={15} />
              <ArrowUp size={11} />
            </LongPress>
            <LongPress
              className={"icon-btn" + (editLock ? " is-on" : "")}
              title="Long-press: lock editing all cells"
              onLong={toggleGlobalEdit}
              onShort={() => setStatus("Hold to lock editing")}
            >
              <Lock size={15} />
              <Pencil size={11} />
            </LongPress>
            <button
              type="button"
              className="icon-btn"
              title="Minimize all"
              onClick={() => {
                setCells((prev) => prev.map((c) => ({ ...c, collapsed: true, outCollapsed: true, maximized: false })));
                setStatus("All minimized");
              }}
            >
              <Minus size={16} />
            </button>
            <button type="button" className="text-btn" onClick={() => addCell("code")}>
              <Plus size={14} /> Code
            </button>
            <button type="button" className="text-btn" onClick={() => addCell("markdown")}>
              <Plus size={14} /> MD
            </button>
            <button type="button" className="text-btn primary" onClick={() => void runAll()} title="Run all">
              <Play size={14} />
            </button>
            <button
              type="button"
              className="icon-btn menu-btn"
              title="Menu"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
        <div className={"status-line" + (dirty ? " dirty" : "")}>{status}</div>
        {menuOpen && (
          <div className="app-menu" onPointerDown={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => request("new")}>
              New notebook
            </button>
            <button type="button" onClick={() => request("open")}>
              Open…
            </button>
            <button type="button" onClick={() => void onSave()}>
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                if (closed) return setStatus("No notebook open");
                openSave({
                  name: fileName ? fileName.replace(/\.[^.]+$/, "") + "-copy.ipynb" : "notebook.ipynb",
                  format: "ipynb",
                  after: null,
                  bind: true,
                });
              }}
            >
              Save As…
            </button>
            <button type="button" onClick={() => request("close")}>
              Close
            </button>
            <button type="button" onClick={() => void saveActiveCell()}>
              Save active cell
            </button>
            <hr />
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setPkgOpen(true);
              }}
            >
              Packages
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setFinanceOpen(true);
              }}
            >
              Finance checklist
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                void restartKernel()
                  .then(() => setStatus("Kernel restarted"))
                  .catch(() => setStatus("Kernel is not up yet"));
              }}
            >
              Restart kernel
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setSettingsOpen(true);
              }}
            >
              Settings
            </button>
          </div>
        )}
      </header>

      <main className="notebook" ref={nbRef}>
        {closed && (
          <div className="empty-floor">
            <h2>No notebook open</h2>
            <p>The notebook floor is empty. Create a notebook or open one from the menu.</p>
            <button type="button" className="text-btn primary" onClick={() => finishNew()}>
              New notebook
            </button>
          </div>
        )}
        {!closed &&
          cells.map((cell) => {
            const locked = editLock || cell.editLocked;
            return (
              <article
                key={cell.id}
                id={"cell-" + cell.id}
                className={"cell" + (cell.type === "markdown" ? " md" : "") + (cell.maximized ? " is-max" : "") + (locked ? " is-locked" : "")}
                style={
                  cell.maximized
                    ? { top: dashH, ["--ratio" as string]: String(cell.maxRatio) }
                    : undefined
                }
              >
                <div className="cell-chrome">
                  <div className="cell-titlebar">
                    <span className={"badge" + (cell.type === "markdown" ? " md" : "")}>{cell.type === "code" ? "CODE" : "MD"}</span>
                    {renaming === cell.id ? (
                      <input
                        className="title-input"
                        autoFocus
                        defaultValue={cell.title}
                        onBlur={(e) => {
                          const t = e.target.value.trim();
                          if (t && t !== cell.title) patch(cell.id, { title: t, titleLocked: true });
                          setRenaming(null);
                          setStatus(t ? "Name set by you" : "Name unchanged");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                      />
                    ) : (
                      <LongPress
                        className="cell-title"
                        title="Hold to rename"
                        ms={450}
                        onLong={() => setRenaming(cell.id)}
                        onShort={() => undefined}
                      >
                        <span>{cell.title}</span>
                      </LongPress>
                    )}
                    {cell.editLocked && <Lock size={12} />}
                    {cell.type === "code" && (
                      <button type="button" className="tiny" title="Read the name from the code again" onClick={() => rereadTitle(cell)}>
                        <RefreshCw size={12} />
                      </button>
                    )}
                  </div>
                  <div className="cell-tools">
                    <button type="button" className="icon-btn" title="Undo" onClick={() => undo(cell.id)}>
                      <Undo2 size={15} />
                    </button>
                    <button type="button" className="icon-btn" title="Redo" onClick={() => redo(cell.id)}>
                      <Redo2 size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      title="Minimize"
                      onClick={() => {
                        const min = cell.collapsed && cell.outCollapsed;
                        patch(cell.id, { collapsed: !min, outCollapsed: !min, maximized: false });
                      }}
                    >
                      {cell.collapsed && cell.outCollapsed ? <Square size={14} /> : <Minus size={15} />}
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      title="Maximize, then drag the handle"
                      onClick={() => {
                        setCells((prev) =>
                          prev.map((c) => ({ ...c, maximized: c.id === cell.id ? !c.maximized : false })),
                        );
                        setStatus(cell.maximized ? "Back to normal size" : "Maximized — drag the handle");
                      }}
                    >
                      <UnfoldVertical size={15} />
                    </button>
                    <LongPress
                      className={"icon-btn" + (cell.editLocked ? " is-on" : "")}
                      title="Long-press: lock this cell"
                      onLong={() => {
                        if (editLock) {
                          setStatus("Unlock the dashboard lock first");
                          return;
                        }
                        patch(cell.id, { editLocked: !cell.editLocked });
                        setStatus(!cell.editLocked ? "This cell is locked" : "This cell is unlocked");
                      }}
                      onShort={() => setStatus("Hold to lock this cell")}
                    >
                      <Pencil size={14} />
                    </LongPress>
                    <button type="button" className="icon-btn" title="Up" onClick={() => move(cell.id, -1)}>
                      <ChevronUp size={16} />
                    </button>
                    <button type="button" className="icon-btn" title="Down" onClick={() => move(cell.id, 1)}>
                      <ChevronDown size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      title="Close cell"
                      onClick={() => setCloseCell({ id: cell.id, py: cell.type === "code", nb: false, nosave: false })}
                    >
                      <X size={16} />
                    </button>
                    <span className="grow" />
                    {cell.type === "code" ? (
                      <button type="button" className="text-btn primary" disabled={running === cell.id} onClick={() => void runCell(cell)}>
                        <Play size={14} /> {running === cell.id ? "…" : "Run"}
                      </button>
                    ) : null}
                  </div>
                </div>
                <div
                  className={"editor-wrap" + (cell.collapsed ? " collapsed" : "")}
                  style={cell.maximized ? undefined : { height: cell.editorHeight }}
                >
                  <CodeEditor
                    value={cell.content}
                    readOnly={locked}
                    fontSize={settings.fontSize}
                    wrap={settings.wrap}
                    indentGuides={settings.guides}
                    plain={cell.type === "markdown"}
                    onChange={(v) => onEdit(cell, v)}
                    onFocus={(el) => {
                      activeTa.current = el;
                      activeId.current = cell.id;
                      if (!cell.maximized) stickCell(cell.id);
                    }}
                    onBlur={() => {
                      if (cell.type === "code" && !cell.titleLocked) {
                        const auto = titleFromCode(cell.content);
                        if (auto && auto !== cell.title) patch(cell.id, { title: auto });
                      }
                    }}
                    onMenu={(info) => {
                      activeId.current = cell.id;
                      setCtx({ ...info, cellId: cell.id });
                    }}
                  />
                </div>
                <div
                  className="resize"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const startY = e.clientY;
                    const startH = cell.editorHeight;
                    const startR = cell.maxRatio;
                    const moveEv = (ev: PointerEvent) => {
                      const dy = ev.clientY - startY;
                      if (cell.maximized) {
                        const usable = Math.max(180, window.innerHeight - dashH - 96);
                        const ratio = Math.min(0.85, Math.max(0.25, startR + dy / usable));
                        patch(cell.id, { maxRatio: ratio }, false);
                      } else {
                        patch(cell.id, { editorHeight: Math.max(72, Math.min(920, startH + dy)) }, false);
                      }
                    };
                    const up = () => {
                      window.removeEventListener("pointermove", moveEv);
                      window.removeEventListener("pointerup", up);
                    };
                    window.addEventListener("pointermove", moveEv);
                    window.addEventListener("pointerup", up);
                  }}
                >
                  <span />
                </div>
                {cell.type === "markdown" && !cell.collapsed && (
                  <div className="md-preview" style={{ fontSize: settings.outSize }} dangerouslySetInnerHTML={{ __html: simpleMarkdown(cell.content) }} />
                )}
                {cell.type === "code" && (
                  <section className={"output" + (cell.outCollapsed ? " collapsed" : "")} style={cell.maximized ? undefined : { height: cell.outputHeight }}>
                    <div className="output-bar">
                      <span>OUTPUT</span>
                      <button
                        type="button"
                        className="tiny"
                        onClick={() => {
                          const text = [cell.stdout, cell.stderr, cell.error].filter(Boolean).join("\n");
                          clipRef.current = text;
                          void copyText(text);
                          setStatus(text ? "Output copied" : "Output is empty");
                        }}
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                    {!cell.outCollapsed && (
                      <div className="output-body" style={{ fontSize: settings.outSize }}>
                        {cell.error && <pre className="err">{cell.error}</pre>}
                        {cell.stderr && <pre className="warn">{cell.stderr}</pre>}
                        {cell.stdout && <pre>{cell.stdout}</pre>}
                        {cell.images.map((img, i) => (
                          <img key={i} alt="" src={"data:image/png;base64," + img} />
                        ))}
                        {!cell.stdout && !cell.stderr && !cell.error && cell.images.length === 0 && <p className="muted">No output yet</p>}
                      </div>
                    )}
                  </section>
                )}
                {cell.type === "code" && (
                  <div
                    className="resize out"
                    onPointerDown={(e) => {
                      if (cell.maximized) return;
                      e.preventDefault();
                      const startY = e.clientY;
                      const startH = cell.outputHeight;
                      const moveEv = (ev: PointerEvent) => {
                        patch(cell.id, { outputHeight: Math.max(48, Math.min(720, startH + (ev.clientY - startY))) }, false);
                      };
                      const up = () => {
                        window.removeEventListener("pointermove", moveEv);
                        window.removeEventListener("pointerup", up);
                      };
                      window.addEventListener("pointermove", moveEv);
                      window.addEventListener("pointerup", up);
                    }}
                  >
                    <span />
                  </div>
                )}
              </article>
            );
          })}
        {!closed && <div className="floor"></div>}
      </main>

      <div className={"keybar" + (settings.twoRows ? " two" : "")} onPointerDown={(e) => e.stopPropagation()}>
        {settings.keys.map((k) => (
          <button
            key={k.id}
            type="button"
            className={
              "key" +
              (k.key === "ctrl" && mods.ctrl ? " on" : "") +
              (k.key === "shift" && mods.shift ? " on" : "")
            }
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => fireKey(k.key)}
          >
            {k.label}
          </button>
        ))}
      </div>

      {ctx && (
        <div className="ctx" style={ctxStyle} onPointerDown={(e) => e.stopPropagation()} onContextMenu={(e) => e.preventDefault()}>
          <button type="button" onClick={ctxCopy}>
            Copy
          </button>
          <button type="button" onClick={ctxLine}>
            Copy line
          </button>
          <button type="button" onClick={ctxCut}>
            Cut
          </button>
          <button type="button" onClick={() => void ctxPaste()}>
            Paste
          </button>
          <button type="button" onClick={ctxAll}>
            Select all
          </button>
        </div>
      )}

      {saveBox && (
        <Modal title={saveBox.bind ? "Save As" : "Save cell"} onClose={() => setSaveBox(null)}>
          <label>
            File name
            <input
              value={saveBox.name}
              onChange={(e) => setSaveBox({ ...saveBox, name: e.target.value })}
              autoFocus
            />
          </label>
          <label>
            Format
            <select
              value={saveBox.format}
              onChange={(e) => {
                const format = e.target.value as FileFormat;
                setSaveBox({ ...saveBox, format, name: ensureExt(saveBox.name, format) });
              }}
            >
              <option value="ipynb">Notebook (.ipynb)</option>
              <option value="py">Python (.py)</option>
              <option value="md">Markdown (.md)</option>
              <option value="html">HTML (.html)</option>
            </select>
          </label>
          <p className="hint">
            Choose the folder in the next window. Save writes the current file with no prompt. Cancel does not close the notebook.
          </p>
          <div className="row-actions">
            <button type="button" className="text-btn" onClick={() => setSaveBox(null)}>
              Cancel
            </button>
            <button type="button" className="text-btn primary" onClick={() => void confirmSave()}>
              Choose location and save
            </button>
          </div>
        </Modal>
      )}

      {guard && (
        <Modal title="Unsaved changes" onClose={() => setGuard(null)}>
          <p className="hint">This notebook has changes that are not saved.</p>
          <div className="row-actions">
            <button type="button" className="text-btn" onClick={() => setGuard(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                const action = guard;
                setGuard(null);
                setDirty(false);
                finishAfter(action);
              }}
            >
              Don't save
            </button>
            <button type="button" className="text-btn primary" onClick={() => void onSave()}>
              Save
            </button>
          </div>
        </Modal>
      )}

      {closeCell && (
        <Modal title="Close cell" onClose={() => setCloseCell(null)}>
          <p className="hint">Save before closing?</p>
          <label className="check">
            <input
              type="checkbox"
              checked={closeCell.py}
              onChange={(e) => setCloseCell({ ...closeCell, py: e.target.checked, nosave: e.target.checked ? false : closeCell.nosave })}
            />
            Save cell as .py
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={closeCell.nb}
              onChange={(e) => setCloseCell({ ...closeCell, nb: e.target.checked, nosave: e.target.checked ? false : closeCell.nosave })}
            />
            Save notebook .ipynb
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={closeCell.nosave}
              onChange={(e) =>
                setCloseCell({
                  ...closeCell,
                  nosave: e.target.checked,
                  py: e.target.checked ? false : closeCell.py,
                  nb: e.target.checked ? false : closeCell.nb,
                })
              }
            />
            Close without saving
          </label>
          <div className="row-actions">
            <button type="button" className="text-btn" onClick={() => setCloseCell(null)}>
              Cancel
            </button>
            <button type="button" className="text-btn primary" onClick={() => void confirmCloseCell()}>
              OK
            </button>
          </div>
        </Modal>
      )}

      {ask && (
        <Modal
          title="Python input"
          onClose={() => {
            ask.resolve("");
            setAsk(null);
          }}
        >
          <p className="hint">{ask.prompt || "input()"}</p>
          <input
            autoFocus
            value={askValue}
            onChange={(e) => setAskValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                ask.resolve(askValue);
                setAsk(null);
              }
            }}
          />
          <div className="row-actions">
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                ask.resolve("");
                setAsk(null);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="text-btn primary"
              onClick={() => {
                ask.resolve(askValue);
                setAsk(null);
              }}
            >
              OK
            </button>
          </div>
        </Modal>
      )}

      {pkgOpen && (
        <Modal title="Packages" onClose={() => setPkgOpen(false)}>
          <p className="hint">Stdlib only at first. Install the rest when you need them.</p>
          <input value={pkgName} placeholder="e.g. yfinance" onChange={(e) => setPkgName(e.target.value)} />
          <div className="row-actions">
            <button type="button" className="text-btn" onClick={() => setPkgOpen(false)}>
              Close
            </button>
            <button type="button" className="text-btn primary" onClick={() => void doInstall(pkgName)}>
              Install
            </button>
          </div>
          <pre className="log">{pkgLog || (loaded.length ? loaded.join("\n") : "Nothing installed yet")}</pre>
        </Modal>
      )}

      {financeOpen && (
        <Modal title="Finance" onClose={() => setFinanceOpen(false)}>
          <ul className="finance">
            {FINANCE_PKGS.map((p) => (
              <li key={p.name}>
                <span>
                  <b>{p.name}</b>
                  <small>{p.desc}</small>
                </span>
                <button type="button" className="text-btn" onClick={() => void doInstall(p.name)}>
                  {loaded.includes(p.name) ? "Reload" : "Install"}
                </button>
              </li>
            ))}
          </ul>
          <div className="row-actions">
            <button type="button" className="text-btn primary" onClick={() => setFinanceOpen(false)}>
              Close
            </button>
          </div>
        </Modal>
      )}

      {settingsOpen && (
        <Modal title="Settings" onClose={() => setSettingsOpen(false)}>
          <label>
            Theme
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value as Settings["theme"] })}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </label>
          <label>
            Code colors
            <select
              value={settings.codeTheme}
              onChange={(e) => setSettings({ ...settings, codeTheme: e.target.value as Settings["codeTheme"] })}
            >
              <option value="vscode-dark">VS Code Dark+</option>
              <option value="vscode-light">VS Code Light+</option>
              <option value="ide">Jupyter IDE</option>
              <option value="monokai">Monokai</option>
              <option value="dracula">Dracula</option>
              <option value="github">GitHub</option>
            </select>
          </label>
          <label>
            Code font
            <select
              value={settings.codeFont}
              onChange={(e) => setSettings({ ...settings, codeFont: e.target.value })}
            >
              <option value="ui-monospace, monospace">System mono</option>
              <option value="monospace">monospace</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="'Roboto Mono', monospace">Roboto Mono</option>
              <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
              <option value="'Fira Code', monospace">Fira Code</option>
              <option value="'Cascadia Code', monospace">Cascadia Code</option>
            </select>
          </label>
          <label>
            Output font
            <select
              value={settings.outFont}
              onChange={(e) => setSettings({ ...settings, outFont: e.target.value })}
            >
              <option value="ui-monospace, monospace">System mono</option>
              <option value="monospace">monospace</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="'Roboto Mono', monospace">Roboto Mono</option>
              <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
              <option value="'Fira Code', monospace">Fira Code</option>
            </select>
          </label>
          <label>
            Code size {settings.fontSize}
            <input
              type="range"
              min={12}
              max={20}
              value={settings.fontSize}
              onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })}
            />
          </label>
          <label>
            Output size {settings.outSize}
            <input
              type="range"
              min={11}
              max={18}
              value={settings.outSize}
              onChange={(e) => setSettings({ ...settings, outSize: Number(e.target.value) })}
            />
          </label>
          <label className="check">
            <input type="checkbox" checked={settings.wrap} onChange={(e) => setSettings({ ...settings, wrap: e.target.checked })} />
            Wrap lines
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={settings.guides}
              onChange={(e) => setSettings({ ...settings, guides: e.target.checked })}
            />
            Indent guides
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={settings.twoRows}
              onChange={(e) => setSettings({ ...settings, twoRows: e.target.checked })}
            />
            Wider bar, two rows
          </label>
          <p className="hint">Reorder the programming keys</p>
          <ul className="key-edit">
            {settings.keys.map((k, i) => (
              <li key={k.id}>
                <span>{k.label}</span>
                <button type="button" className="tiny" onClick={() => moveKey(i, -1)} aria-label="Up">
                  <ChevronUp size={14} />
                </button>
                <button type="button" className="tiny" onClick={() => moveKey(i, 1)} aria-label="Down">
                  <ChevronDown size={14} />
                </button>
              </li>
            ))}
          </ul>
          <div className="row-actions">
            <button type="button" className="text-btn" onClick={() => setSettings({ ...settings, keys: DEFAULT_KEYS, twoRows: false })}>
              Reset keys
            </button>
            <button type="button" className="text-btn primary" onClick={() => setSettingsOpen(false)}>
              Done
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="modal-back"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="modal-card" role="dialog" aria-label={title}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function LongPress({
  children,
  className,
  title,
  onLong,
  onShort,
  ms = 1800,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  onLong: () => void;
  onShort: () => void;
  ms?: number;
}) {
  const timer = useRef<number | null>(null);
  const fired = useRef(false);
  const clear = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };
  const start = () => {
    clear();
    fired.current = false;
    timer.current = window.setTimeout(() => {
      fired.current = true;
      timer.current = null;
      onLong();
    }, ms);
  };
  return (
    <button
      type="button"
      className={className}
      title={title}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onTouchStart={start}
      onTouchEnd={clear}
      onTouchMove={clear}
      onTouchCancel={clear}
      onMouseDown={start}
      onMouseUp={clear}
      onMouseLeave={clear}
      onClick={() => {
        if (fired.current) {
          fired.current = false;
          return;
        }
        onShort();
      }}
    >
      {children}
    </button>
  );
}
