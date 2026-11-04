import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as ArrowUp, a as Square, c as Plus, d as Minus, f as Menu, g as ChevronDown, h as ChevronUp, l as Play, m as Copy, n as UnfoldVertical, o as RefreshCw, p as Lock, r as Undo2, s as Redo2, t as X, u as Pencil } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BQb8mbGG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DEFAULT_KEYS = [
	{
		id: "ctrl",
		label: "Ctrl",
		key: "ctrl"
	},
	{
		id: "shift",
		label: "Shift",
		key: "shift"
	},
	{
		id: "tab",
		label: "Tab",
		key: "Tab"
	},
	{
		id: "esc",
		label: "Esc",
		key: "Escape"
	},
	{
		id: "left",
		label: "←",
		key: "ArrowLeft"
	},
	{
		id: "up",
		label: "↑",
		key: "ArrowUp"
	},
	{
		id: "down",
		label: "↓",
		key: "ArrowDown"
	},
	{
		id: "right",
		label: "→",
		key: "ArrowRight"
	},
	{
		id: "home",
		label: "Home",
		key: "Home"
	},
	{
		id: "end",
		label: "End",
		key: "End"
	},
	{
		id: "all",
		label: "All",
		key: "select-all"
	},
	{
		id: "copy",
		label: "Copy",
		key: "copy"
	},
	{
		id: "cut",
		label: "Cut",
		key: "cut"
	},
	{
		id: "paste",
		label: "Paste",
		key: "paste"
	},
	{
		id: "lp",
		label: "(",
		key: "("
	},
	{
		id: "rp",
		label: ")",
		key: ")"
	},
	{
		id: "lb",
		label: "[",
		key: "["
	},
	{
		id: "rb",
		label: "]",
		key: "]"
	},
	{
		id: "lc",
		label: "{",
		key: "{"
	},
	{
		id: "rc",
		label: "}",
		key: "}"
	},
	{
		id: "colon",
		label: ":",
		key: ":"
	},
	{
		id: "eq",
		label: "=",
		key: "="
	},
	{
		id: "us",
		label: "_",
		key: "_"
	},
	{
		id: "sq",
		label: "'",
		key: "'"
	},
	{
		id: "dq",
		label: "\"",
		key: "\""
	}
];
var FINANCE_PKGS = [
	{
		name: "numpy",
		desc: "آرایه عددی",
		builtin: true
	},
	{
		name: "pandas",
		desc: "جدول و CSV",
		builtin: true
	},
	{
		name: "matplotlib",
		desc: "نمودار",
		builtin: true
	},
	{
		name: "scipy",
		desc: "محاسبه علمی",
		builtin: true
	},
	{
		name: "scikit-learn",
		desc: "یادگیری ماشین",
		builtin: true
	},
	{
		name: "statsmodels",
		desc: "مدل آماری",
		builtin: true
	},
	{
		name: "yfinance",
		desc: "داده بازار"
	},
	{
		name: "plotly",
		desc: "نمودار تعاملی"
	},
	{
		name: "requests",
		desc: "HTTP"
	}
];
var EXT = {
	ipynb: ".ipynb",
	py: ".py",
	md: ".md",
	html: ".html"
};
function ensureExt(name, format) {
	return (name.trim().replace(/[\\/]/g, "_") || "notebook").replace(/\.(ipynb|py|md|html|json)$/i, "") + EXT[format];
}
function titleFromCode(code) {
	if (!code) return "";
	const lines = String(code).split("\n");
	const hasLetter = (s) => /[A-Za-z\u0600-\u06FF]/.test(s);
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
		let name = raw.replace(/[\\/?*"<>|\x00-\x1f]/g, " ").replace(/[^\w\u0600-\u06FF\s.:_-]/g, " ").replace(/\s+/g, " ").trim();
		if (!name || !hasLetter(name)) continue;
		if (name.length > 64) name = name.slice(0, 64).trim();
		return name;
	}
	return "";
}
function freshCell(id, type, content = "", title = "") {
	const auto = type === "code" ? titleFromCode(content) : "";
	return {
		id,
		type,
		title: title || auto || (type === "code" ? `cell-${id}.py` : "یادداشت"),
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
		maxRatio: .7
	};
}
function starterCells() {
	return [freshCell("c1", "code", "# Fast boot: only stdlib loaded\n# import numpy / pandas when you need them\n\nprint('Hello from Jupyter IDE')\n"), freshCell("c2", "markdown", "## نکته\nاز منو **Finance** کتابخانه‌های بازار را یک‌بار نصب کن.\nاجرا با ▶ هر سلول.\n", "نکته")];
}
function toIpynb(cells) {
	return JSON.stringify({
		nbformat: 4,
		nbformat_minor: 5,
		metadata: {
			kernelspec: {
				display_name: "Python 3 (Pyodide)",
				language: "python",
				name: "python3"
			},
			language_info: {
				name: "python",
				version: "3.12"
			},
			jupyteride: { version: "9.2" }
		},
		cells: cells.map((c) => {
			const src = c.content.split("\n").map((line, i, arr) => i < arr.length - 1 ? line + "\n" : line);
			if (c.type === "markdown") return {
				cell_type: "markdown",
				metadata: { jupyteride_title: c.title || "" },
				source: src
			};
			return {
				cell_type: "code",
				metadata: { jupyteride_title: c.title || "" },
				execution_count: null,
				outputs: [],
				source: src
			};
		})
	}, null, 2);
}
function fromIpynb(text) {
	const data = JSON.parse(text);
	if (!data.cells || !Array.isArray(data.cells)) throw new Error("فایل نوت‌بوک معتبر نیست");
	return data.cells.map((jc) => {
		return {
			type: jc.cell_type === "markdown" ? "markdown" : "code",
			content: Array.isArray(jc.source) ? jc.source.join("") : jc.source || "",
			title: jc.metadata?.jupyteride_title || ""
		};
	});
}
function toPy(cells) {
	return cells.filter((c) => c.type === "code").map((c) => `# %% ${c.title || "code"}\n${c.content || ""}`).join("\n\n");
}
function toMd(cells) {
	return cells.map((c) => {
		if (c.type === "markdown") return c.content;
		return "```python\n" + (c.content || "") + "\n```";
	}).join("\n\n");
}
function toHtml(cells, title) {
	const body = cells.map((c) => {
		const esc = escapeHtml(c.content || "");
		if (c.type === "markdown") return `<section class="md"><pre>${esc}</pre></section>`;
		return `<section class="code"><h3>${escapeHtml(c.title || "code")}</h3><pre>${esc}</pre></section>`;
	}).join("\n");
	return `<!DOCTYPE html><html lang="fa"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>body{font-family:sans-serif;background:#12140f;color:#e7ecdf;padding:24px}pre{white-space:pre-wrap;background:#1c2118;padding:12px;border-radius:8px}h3{color:#d6a23a}</style>
</head><body><h1>${escapeHtml(title)}</h1>${body}</body></html>`;
}
function serializeExport(cells, format, title) {
	if (format === "py") return toPy(cells);
	if (format === "md") return toMd(cells);
	if (format === "html") return toHtml(cells, title);
	return toIpynb(cells);
}
function escapeHtml(s) {
	return s.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
}
function simpleMarkdown(src) {
	return escapeHtml(src || "").replace(/^### (.*)$/gm, "<h3>$1</h3>").replace(/^## (.*)$/gm, "<h2>$1</h2>").replace(/^# (.*)$/gm, "<h1>$1</h1>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\n/g, "<br>");
}
var KEYWORDS = new Set(`False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield`.split(" "));
function highlightPython(code) {
	const out = [];
	const n = code.length;
	let i = 0;
	const push = (cls, text) => {
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
		if (ch === "\"" || ch === "'") {
			const q = code.slice(i, i + 3) === ch + ch + ch ? ch + ch + ch : ch;
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
		if (ch !== void 0 && /[0-9]/.test(ch) && (i === 0 || !/[\w]/.test(code[i - 1] || ""))) {
			let j = i;
			while (j < n && /[0-9.]/.test(code[j] || "")) j++;
			push("tok-num", code.slice(i, j));
			i = j;
			continue;
		}
		if (ch !== void 0 && /[A-Za-z_]/.test(ch)) {
			let j = i + 1;
			while (j < n && /[\w]/.test(code[j] || "")) j++;
			const word = code.slice(i, j);
			let k = j;
			while (k < n && (code[k] === " " || code[k] === "	")) k++;
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
function lineOf(value, index) {
	const start = value.lastIndexOf("\n", Math.max(0, index - 1)) + 1;
	const nl = value.indexOf("\n", index);
	const end = nl === -1 ? value.length : nl;
	return value.slice(start, end);
}
function loadPersist() {
	if (typeof localStorage === "undefined") return null;
	try {
		const raw = localStorage.getItem("jide-notebook-v92");
		if (!raw) return null;
		const data = JSON.parse(raw);
		if (!data || data.v !== 92 || !Array.isArray(data.cells)) return null;
		return data;
	} catch {
		return null;
	}
}
function savePersist(data) {
	try {
		const slim = {
			...data,
			cells: data.cells.map((c) => ({
				...c,
				images: [],
				maximized: false
			}))
		};
		localStorage.setItem("jide-notebook-v92", JSON.stringify(slim));
	} catch {}
}
function CodeEditor({ value, readOnly, fontSize, wrap, indentGuides, plain = false, rtl = false, onChange, onFocus, onBlur, onMenu }) {
	const taRef = (0, import_react.useRef)(null);
	const gutRef = (0, import_react.useRef)(null);
	const hlRef = (0, import_react.useRef)(null);
	const caretRef = (0, import_react.useRef)(null);
	const menuAt = (0, import_react.useRef)(0);
	const lineCount = Math.max(1, value.split("\n").length);
	const lh = Math.round(fontSize * 1.55);
	function syncScroll() {
		const ta = taRef.current;
		if (!ta) return;
		if (gutRef.current) gutRef.current.style.transform = `translateY(${-ta.scrollTop}px)`;
		if (hlRef.current) hlRef.current.style.transform = `translate(${-ta.scrollLeft}px, ${-ta.scrollTop}px)`;
	}
	(0, import_react.useEffect)(() => {
		const ta = taRef.current;
		if (!ta || caretRef.current == null) return;
		const c = caretRef.current;
		caretRef.current = null;
		ta.selectionStart = ta.selectionEnd = c;
	}, [value]);
	function openMenu(x, y) {
		const ta = taRef.current;
		if (!ta) return;
		const now = Date.now();
		if (now - menuAt.current < 350) return;
		menuAt.current = now;
		onMenu({
			x,
			y,
			start: ta.selectionStart ?? 0,
			end: ta.selectionEnd ?? 0,
			value: ta.value
		});
	}
	function insertWord(word) {
		const ta = taRef.current;
		if (!ta || readOnly) return;
		const a = ta.selectionStart ?? 0;
		const b = ta.selectionEnd ?? 0;
		const next = ta.value.slice(0, a) + word + ta.value.slice(b);
		caretRef.current = a + word.length;
		onChange(next);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "code-editor" + (indentGuides ? " guides" : "") + (wrap ? " wrap" : "") + (rtl ? " rtl" : ""),
		dir: rtl ? "rtl" : "ltr",
		style: {
			["--fs"]: fontSize + "px",
			["--lh"]: lh + "px"
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "gutter",
			"aria-hidden": "true",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "gutter-nums",
				ref: gutRef,
				children: Array.from({ length: lineCount }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "gutter-n",
					children: i + 1
				}, i))
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "code-layer",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "hl",
				ref: hlRef,
				dangerouslySetInnerHTML: { __html: (plain ? escapeHtml(value) + (value.endsWith("\n") ? "" : "\n") : highlightPython(value)) || "\n" }
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				ref: taRef,
				className: "code-input",
				spellCheck: false,
				autoCorrect: "off",
				autoCapitalize: "off",
				autoComplete: "off",
				wrap: wrap ? "soft" : "off",
				readOnly,
				value,
				"aria-label": "کد سلول",
				onScroll: syncScroll,
				onFocus: (e) => onFocus(e.currentTarget),
				onBlur,
				onChange: (e) => onChange(e.target.value),
				onContextMenu: (e) => {
					e.preventDefault();
					e.stopPropagation();
					openMenu(e.clientX, e.clientY);
				},
				onTouchStart: (e) => {
					const t = e.touches[0];
					if (!t) return;
					const x = t.clientX;
					const y = t.clientY;
					const sx = x;
					const sy = y;
					const timer = window.setTimeout(() => openMenu(x, y), 600);
					const move = (ev) => {
						const m = ev.touches[0];
						if (!m) return;
						if (Math.abs(m.clientX - sx) > 10 || Math.abs(m.clientY - sy) > 10) window.clearTimeout(timer);
					};
					const end = () => {
						window.clearTimeout(timer);
						window.removeEventListener("touchmove", move);
						window.removeEventListener("touchend", end);
					};
					window.addEventListener("touchmove", move, { passive: true });
					window.addEventListener("touchend", end);
				},
				onBeforeInput: (e) => {
					const ne = e.nativeEvent;
					if (!(ne instanceof InputEvent)) return;
					if (ne.inputType !== "insertReplacementText" && ne.inputType !== "insertCompositionText") return;
					const data = ne.data ?? "";
					if (!/[\s\u00a0]$/.test(data)) return;
					const word = data.replace(/[\s\u00a0]+$/g, "");
					if (!word || word === data) return;
					e.preventDefault();
					insertWord(word);
				},
				onKeyDown: (e) => {
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
				}
			})]
		})]
	});
}
var INDEX = "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/";
var BOOT = `
import sys, io, traceback, base64, json
_namespace = {"__name__": "__main__"}

def _jide_input(prompt=""):
    import js
    message = "" if prompt is None else str(prompt)
    try:
        from pyodide.ffi import run_sync
        fn = getattr(js, "jideAsk", None)
        if fn is not None:
            return str(run_sync(fn(message)))
    except Exception:
        pass
    try:
        v = js.prompt(message)
        if v is None:
            return ""
        return str(v)
    except Exception:
        return ""

import builtins
builtins.input = _jide_input

def _capture_run(source):
    stdout = io.StringIO()
    stderr = io.StringIO()
    images = []
    error_line = None
    error_type = None
    error_msg = None
    plt = None
    original_show = None
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
        plt = None
    try:
        import contextlib
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            exec(source, _namespace, _namespace)
    except Exception as e:
        traceback.print_exc(file=stderr)
        error_type = type(e).__name__
        error_msg = str(e)
        tb = traceback.TracebackException.from_exception(e)
        frames = list(tb.stack)
        for fr in reversed(frames):
            if fr.filename in ("<string>", "<exec>"):
                error_line = fr.lineno
                break
        if error_line is None and frames:
            error_line = frames[-1].lineno
    finally:
        if plt is not None and original_show is not None:
            plt.show = original_show
    return json.dumps({
        "stdout": stdout.getvalue(),
        "stderr": stderr.getvalue(),
        "images": images,
        "error_line": error_line,
        "error_type": error_type,
        "error_msg": error_msg,
    })

def _reset_ns():
    global _namespace
    _namespace = {"__name__": "__main__"}
    builtins.input = _jide_input
`;
var py = null;
var loading = null;
function loadScript(src) {
	return new Promise((resolve, reject) => {
		const existing = document.querySelector(`script[src="${src}"]`);
		if (existing) {
			if (window.loadPyodide) resolve();
			else existing.addEventListener("load", () => resolve());
			return;
		}
		const s = document.createElement("script");
		s.src = src;
		s.async = true;
		s.onload = () => resolve();
		s.onerror = () => reject(/* @__PURE__ */ new Error("بارگذاری پایتون ناموفق بود"));
		document.head.appendChild(s);
	});
}
async function getPy() {
	if (py) return py;
	if (!loading) loading = (async () => {
		await loadScript(INDEX + "pyodide.js");
		if (!window.loadPyodide) throw new Error("Pyodide در دسترس نیست");
		const instance = await window.loadPyodide({ indexURL: INDEX });
		await instance.runPythonAsync(BOOT);
		py = instance;
		return instance;
	})().catch((err) => {
		loading = null;
		throw err;
	});
	return loading;
}
var BUILTIN = [
	"numpy",
	"pandas",
	"matplotlib",
	"scipy",
	"scikit-learn",
	"statsmodels"
];
async function runPython(source) {
	const api = await getPy();
	const needed = BUILTIN.filter((name) => source.includes(name));
	if (needed.length) try {
		await api.loadPackage(needed);
	} catch {}
	const raw = await api.runPythonAsync(`_capture_run(${JSON.stringify(source)})`);
	return JSON.parse(String(raw));
}
async function restartKernel() {
	await (await getPy()).runPythonAsync("_reset_ns()");
}
async function installPackage(name) {
	const api = await getPy();
	if (BUILTIN.includes(name)) {
		await api.loadPackage(name);
		return;
	}
	await api.loadPackage("micropip");
	const micropip = api.pyimport("micropip");
	try {
		await micropip.install(name);
	} finally {
		micropip.destroy?.();
	}
}
async function pythonVersion() {
	const v = await (await getPy()).runPythonAsync("import sys; sys.version.split()[0]");
	return String(v);
}
var DEFAULT_SETTINGS = {
	theme: "dark",
	codeTheme: "ide",
	fontSize: 15,
	outSize: 13,
	wrap: false,
	guides: false,
	twoRows: false,
	keys: DEFAULT_KEYS
};
function loadSettings() {
	try {
		const raw = localStorage.getItem("jide-settings-v92");
		if (!raw) return DEFAULT_SETTINGS;
		const parsed = JSON.parse(raw);
		return {
			...DEFAULT_SETTINGS,
			...parsed,
			keys: Array.isArray(parsed.keys) && parsed.keys.length ? parsed.keys : DEFAULT_KEYS
		};
	} catch {
		return DEFAULT_SETTINGS;
	}
}
async function writeHandle(handle, data) {
	const writable = await handle.createWritable();
	await writable.write(data);
	await writable.close();
}
function download(name, data, format) {
	const type = format === "html" ? "text/html" : format === "py" ? "text/x-python" : format === "md" ? "text/markdown" : "application/x-ipynb+json";
	const a = document.createElement("a");
	a.href = URL.createObjectURL(new Blob([data], { type }));
	a.download = name;
	a.click();
	URL.revokeObjectURL(a.href);
}
function pickerTypes(format) {
	if (format === "py") return {
		description: "Python",
		accept: { "text/x-python": [".py"] }
	};
	if (format === "md") return {
		description: "Markdown",
		accept: { "text/markdown": [".md"] }
	};
	if (format === "html") return {
		description: "HTML",
		accept: { "text/html": [".html"] }
	};
	return {
		description: "Jupyter Notebook",
		accept: { "application/x-ipynb+json": [".ipynb"] }
	};
}
async function copyText(text) {
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
function NotebookApp() {
	const [cells, setCells] = (0, import_react.useState)(() => starterCells());
	const [closed, setClosed] = (0, import_react.useState)(false);
	const [dirty, setDirty] = (0, import_react.useState)(false);
	const [fileName, setFileName] = (0, import_react.useState)("");
	const [savedOnce, setSavedOnce] = (0, import_react.useState)(false);
	const [status, setStatus] = (0, import_react.useState)("9.2 · آماده");
	const [settings, setSettings] = (0, import_react.useState)(DEFAULT_SETTINGS);
	const [menuOpen, setMenuOpen] = (0, import_react.useState)(false);
	const [moveLock, setMoveLock] = (0, import_react.useState)(false);
	const [editLock, setEditLock] = (0, import_react.useState)(false);
	const [saveBox, setSaveBox] = (0, import_react.useState)(null);
	const [guard, setGuard] = (0, import_react.useState)(null);
	const [closeCell, setCloseCell] = (0, import_react.useState)(null);
	const [ctx, setCtx] = (0, import_react.useState)(null);
	const [renaming, setRenaming] = (0, import_react.useState)(null);
	const [settingsOpen, setSettingsOpen] = (0, import_react.useState)(false);
	const [pkgOpen, setPkgOpen] = (0, import_react.useState)(false);
	const [financeOpen, setFinanceOpen] = (0, import_react.useState)(false);
	const [pkgName, setPkgName] = (0, import_react.useState)("");
	const [pkgLog, setPkgLog] = (0, import_react.useState)("");
	const [loaded, setLoaded] = (0, import_react.useState)([]);
	const [ask, setAsk] = (0, import_react.useState)(null);
	const [askValue, setAskValue] = (0, import_react.useState)("");
	const [dashH, setDashH] = (0, import_react.useState)(92);
	const [running, setRunning] = (0, import_react.useState)(null);
	const idRef = (0, import_react.useRef)(3);
	const handleRef = (0, import_react.useRef)(null);
	const cellsRef = (0, import_react.useRef)(cells);
	const activeTa = (0, import_react.useRef)(null);
	const activeId = (0, import_react.useRef)(null);
	const nbRef = (0, import_react.useRef)(null);
	const dashRef = (0, import_react.useRef)(null);
	const shellRef = (0, import_react.useRef)(null);
	const clipRef = (0, import_react.useRef)("");
	const ctrlRef = (0, import_react.useRef)(false);
	const shiftRef = (0, import_react.useRef)(false);
	const hist = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	const skipHist = (0, import_react.useRef)(false);
	const booted = (0, import_react.useRef)(false);
	const [mods, setMods] = (0, import_react.useState)({
		ctrl: false,
		shift: false
	});
	cellsRef.current = cells;
	(0, import_react.useEffect)(() => {
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
			saved.cells.forEach((c) => hist.current.set(c.id, {
				stack: [c.content],
				i: 0
			}));
		}
		booted.current = true;
	}, []);
	(0, import_react.useEffect)(() => {
		if (!booted.current) return;
		const t = window.setTimeout(() => {
			savePersist({
				v: 92,
				cells,
				fileName,
				savedOnce,
				dirty,
				closed
			});
		}, 350);
		return () => window.clearTimeout(t);
	}, [
		cells,
		fileName,
		savedOnce,
		dirty,
		closed
	]);
	(0, import_react.useEffect)(() => {
		localStorage.setItem("jide-settings-v92", JSON.stringify(settings));
		document.documentElement.style.setProperty("--code-size", settings.fontSize + "px");
		document.documentElement.style.setProperty("--out-size", settings.outSize + "px");
	}, [settings]);
	(0, import_react.useEffect)(() => {
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
	}, [
		closed,
		status,
		fileName
	]);
	(0, import_react.useEffect)(() => {
		window.jideAsk = (prompt) => new Promise((resolve) => {
			setAskValue("");
			setAsk({
				prompt,
				resolve
			});
		});
		return () => {
			delete window.jideAsk;
		};
	}, []);
	function stickCell(id) {
		const nb = nbRef.current;
		const el = document.getElementById("cell-" + id);
		if (!nb || !el || el.classList.contains("is-max")) return;
		const delta = el.getBoundingClientRect().top - nb.getBoundingClientRect().top;
		if (Math.abs(delta) > 2) nb.scrollTop += delta;
	}
	(0, import_react.useEffect)(() => {
		const vv = window.visualViewport;
		let timer = 0;
		const apply = () => {
			const shell = shellRef.current;
			if (!shell || !vv) return;
			shell.style.height = vv.height + "px";
			const id = activeId.current;
			if (id && window.innerHeight - vv.height > 80) {
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
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
				e.preventDefault();
				onSave();
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
	function patch(id, partial, mark = true) {
		setCells((prev) => prev.map((c) => c.id === id ? {
			...c,
			...partial
		} : c));
		if (mark) setDirty(true);
	}
	function pushHist(id, value) {
		if (skipHist.current) return;
		let h = hist.current.get(id);
		if (!h) {
			hist.current.set(id, {
				stack: [value],
				i: 0
			});
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
	function onEdit(cell, value) {
		pushHist(cell.id, value);
		const partial = { content: value };
		if (cell.type === "code" && !cell.titleLocked) {
			const auto = titleFromCode(value);
			if (auto) partial.title = auto;
		}
		patch(cell.id, partial, true);
	}
	function undo(id) {
		const h = hist.current.get(id);
		if (!h || h.i <= 0) return;
		h.i -= 1;
		skipHist.current = true;
		patch(id, { content: h.stack[h.i] || "" });
		skipHist.current = false;
	}
	function redo(id) {
		const h = hist.current.get(id);
		if (!h || h.i >= h.stack.length - 1) return;
		h.i += 1;
		skipHist.current = true;
		patch(id, { content: h.stack[h.i] || "" });
		skipHist.current = false;
	}
	function addCell(type, content = "", title = "") {
		const id = nextId();
		const cell = freshCell(id, type, content, title);
		hist.current.set(id, {
			stack: [cell.content],
			i: 0
		});
		setCells((prev) => [...prev, cell]);
		setClosed(false);
		setDirty(true);
		setStatus(type === "code" ? "سلول کد اضافه شد" : "سلول متن اضافه شد");
		window.setTimeout(() => stickCell(id), 30);
	}
	function move(id, dir) {
		if (moveLock) {
			setStatus("جابه‌جایی از داشبورد قفل است");
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
	function removeCell(id) {
		setCells((prev) => prev.filter((c) => c.id !== id));
		setDirty(true);
		setStatus("سلول بسته شد");
	}
	async function runCell(cell) {
		if (cell.type !== "code") return;
		setRunning(cell.id);
		setStatus("در حال اجرای پایتون…");
		try {
			const result = await runPython(cell.content);
			const err = result.error_type ? `${result.error_type}: ${result.error_msg || ""}` : null;
			patch(cell.id, {
				stdout: result.stdout,
				stderr: result.stderr,
				images: result.images,
				error: err,
				outCollapsed: false
			}, false);
			const ver = await pythonVersion().catch(() => "");
			setStatus(err ? "خطا در سلول" : "اجرا شد" + (ver ? " · Python " + ver : ""));
		} catch (e) {
			patch(cell.id, {
				error: e instanceof Error ? e.message : String(e),
				stdout: "",
				stderr: ""
			}, false);
			setStatus("پایتون اجرا نشد");
		} finally {
			setRunning(null);
		}
	}
	async function runAll() {
		setMenuOpen(false);
		for (const c of cellsRef.current) if (c.type === "code") await runCell(c);
		setStatus("اجرای همه تمام شد");
	}
	function notebookData() {
		return toIpynb(cellsRef.current);
	}
	async function silentSave() {
		if (!savedOnce) return false;
		const data = notebookData();
		const name = ensureExt(fileName || "notebook.ipynb", "ipynb");
		const handle = handleRef.current;
		if (handle) try {
			if ((handle.requestPermission ? await handle.requestPermission({ mode: "readwrite" }) : "granted") !== "granted") return false;
			await writeHandle(handle, data);
			setDirty(false);
			setStatus("ذخیره شد: " + name);
			return true;
		} catch {
			return false;
		}
		download(name, data, "ipynb");
		setDirty(false);
		setStatus("ذخیره شد: " + name);
		return true;
	}
	function openSave(partial) {
		const current = fileName || "notebook.ipynb";
		setSaveBox({
			name: partial.name || current,
			format: partial.format || "ipynb",
			after: partial.after ?? null,
			bind: partial.bind !== false
		});
	}
	async function onSave() {
		setMenuOpen(false);
		if (closed) {
			setStatus("نوت‌بوکی باز نیست");
			return;
		}
		if (savedOnce && (fileName.endsWith(".ipynb") || !fileName)) {
			if (await silentSave()) {
				if (guard) finishAfter(guard);
				return;
			}
		}
		openSave({
			name: fileName || "notebook.ipynb",
			format: "ipynb",
			after: guard,
			bind: true
		});
	}
	function finishAfter(action) {
		setGuard(null);
		if (action === "close") finishClose();
		if (action === "open") pickOpen();
		if (action === "new") finishNew();
	}
	function finishClose() {
		setCells([]);
		setClosed(true);
		setDirty(false);
		setSavedOnce(false);
		setFileName("");
		handleRef.current = null;
		setStatus("نوت‌بوک بسته شد");
	}
	function finishNew() {
		const id = "c" + (idRef.current + 1);
		idRef.current += 1;
		const cell = freshCell(id, "code", "# نوت‌بوک تازه\nprint('ready')\n");
		hist.current = /* @__PURE__ */ new Map([[id, {
			stack: [cell.content],
			i: 0
		}]]);
		setCells([cell]);
		setClosed(false);
		setDirty(false);
		setSavedOnce(false);
		setFileName("");
		handleRef.current = null;
		setStatus("نوت‌بوک تازه");
	}
	function request(action) {
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
		const data = saveBox.bind === false && saveBox.format === "py" && activeId.current ? cellsRef.current.find((c) => c.id === activeId.current)?.content || "" : serializeExport(cellsRef.current, saveBox.format, name.replace(/\.[^.]+$/, ""));
		const picker = window.showSaveFilePicker;
		try {
			if (picker) {
				const handle = await picker({
					suggestedName: name,
					types: [pickerTypes(saveBox.format)]
				});
				await writeHandle(handle, data);
				if (saveBox.bind && saveBox.format === "ipynb") {
					handleRef.current = handle;
					setFileName(handle.name || name);
					setSavedOnce(true);
					setDirty(false);
				}
				setStatus(saveBox.format === "ipynb" && saveBox.bind ? "ذخیره شد: " + (handle.name || name) : "خروجی ذخیره شد: " + name);
			} else {
				download(name, data, saveBox.format);
				if (saveBox.bind && saveBox.format === "ipynb") {
					setFileName(name);
					setSavedOnce(true);
					setDirty(false);
					handleRef.current = null;
				}
				setStatus("دانلود شد: " + name);
			}
			const after = saveBox.after;
			setSaveBox(null);
			if (after) finishAfter(after);
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError") {
				setStatus("ذخیره لغو شد");
				return;
			}
			download(name, data, saveBox.format);
			if (saveBox.bind && saveBox.format === "ipynb") {
				setFileName(name);
				setSavedOnce(true);
				setDirty(false);
				handleRef.current = null;
			}
			setStatus("دانلود شد: " + name);
			const after = saveBox.after;
			setSaveBox(null);
			if (after) finishAfter(after);
		}
	}
	function applyTextFile(name, text, handle) {
		if (name.endsWith(".ipynb") || text.trim().startsWith("{")) try {
			const next = fromIpynb(text).map((r) => {
				const id = nextId();
				const cell = freshCell(id, r.type, r.content, r.title);
				if (r.title) cell.titleLocked = true;
				hist.current.set(id, {
					stack: [cell.content],
					i: 0
				});
				return cell;
			});
			hist.current = new Map(next.map((c) => [c.id, {
				stack: [c.content],
				i: 0
			}]));
			setCells(next.length ? next : [freshCell(nextId(), "code", "")]);
			setClosed(false);
			setDirty(false);
			setSavedOnce(true);
			setFileName(name);
			handleRef.current = handle;
			setStatus("باز شد: " + name);
			return;
		} catch {
			if (name.endsWith(".ipynb")) {
				setStatus("فایل نوت‌بوک خراب است");
				return;
			}
		}
		if (name.endsWith(".py") || name.endsWith(".txt") || name.endsWith(".md")) {
			addCell(name.endsWith(".md") ? "markdown" : "code", text, name);
			setStatus("وارد شد: " + name);
			return;
		}
		const preview = text.length > 4e3 ? text.slice(0, 4e3) : text;
		addCell("code", `# Loaded: ${name}\ndata = ${JSON.stringify(preview)}\nprint("\\n".join(data.splitlines()[:12]))\n`, name);
		setStatus("وارد شد: " + name);
	}
	async function pickOpen() {
		const opener = window.showOpenFilePicker;
		if (opener) try {
			const [handle] = await opener({ types: [{
				description: "Notebook",
				accept: {
					"application/x-ipynb+json": [".ipynb"],
					"text/x-python": [".py"],
					"text/plain": [
						".txt",
						".md",
						".csv"
					]
				}
			}] });
			if (!handle) return;
			const file = await handle.getFile();
			applyTextFile(file.name, await file.text(), file.name.endsWith(".ipynb") ? handle : null);
			return;
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError") return;
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
			setStatus("سلول فعالی نیست");
			return;
		}
		openSave({
			name: ensureExt(cell.title || "cell.py", "py"),
			format: "py",
			after: null,
			bind: false
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
			setStatus("سلول ذخیره شد: " + name);
		}
		if (!closeCell.nosave && closeCell.nb) {
			if (!await silentSave() && !savedOnce) {
				setCloseCell(null);
				openSave({
					name: fileName || "notebook.ipynb",
					format: "ipynb",
					after: null,
					bind: true
				});
				setStatus("اول نوت‌بوک را ذخیره کن");
				return;
			}
		}
		removeCell(cell.id);
		setCloseCell(null);
	}
	function toggleGlobalEdit() {
		setEditLock((v) => {
			const next = !v;
			setCells((prev) => prev.map((c) => ({
				...c,
				editLocked: next
			})));
			setStatus(next ? "ویرایش همه قفل شد" : "ویرایش همه باز شد");
			return next;
		});
	}
	function rereadTitle(cell) {
		const auto = titleFromCode(cell.content);
		if (!auto) {
			setStatus("در کامنت‌های بالای کد نامی نیست");
			return;
		}
		patch(cell.id, {
			title: auto,
			titleLocked: false
		});
		setStatus("نام از کد: " + auto);
	}
	function activeLocked() {
		const id = activeId.current;
		const cell = cellsRef.current.find((c) => c.id === id);
		return !cell || cell.editLocked || editLock;
	}
	function insertIntoActive(text) {
		const ta = activeTa.current;
		if (!ta || !activeId.current) {
			setStatus("اول داخل کد بزن");
			return;
		}
		if (activeLocked()) {
			setStatus("ویرایش قفل است");
			return;
		}
		ta.focus();
		if (!document.execCommand("insertText", false, text)) {
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
	function fireKey(key) {
		const ta = activeTa.current;
		if (key === "ctrl") {
			ctrlRef.current = !ctrlRef.current;
			setMods({
				ctrl: ctrlRef.current,
				shift: shiftRef.current
			});
			return;
		}
		if (key === "shift") {
			shiftRef.current = !shiftRef.current;
			setMods({
				ctrl: ctrlRef.current,
				shift: shiftRef.current
			});
			return;
		}
		if (!ta || !activeId.current) {
			setStatus("اول داخل کد بزن");
			return;
		}
		ta.focus();
		const ctrl = ctrlRef.current;
		if (key === "select-all" || ctrl && key.toLowerCase() === "a") {
			ta.selectionStart = 0;
			ta.selectionEnd = ta.value.length;
			setStatus("همهٔ این سلول انتخاب شد");
			return;
		}
		if (key === "copy" || ctrl && key.toLowerCase() === "c") {
			const text = ta.value.slice(ta.selectionStart ?? 0, ta.selectionEnd ?? 0);
			if (!text) setStatus("چیزی انتخاب نشده");
			else {
				clipRef.current = text;
				copyText(text);
				setStatus("کپی شد");
			}
			return;
		}
		if (key === "cut" || ctrl && key.toLowerCase() === "x") {
			const a = ta.selectionStart ?? 0;
			const b = ta.selectionEnd ?? 0;
			const text = ta.value.slice(a, b);
			if (!text) setStatus("چیزی انتخاب نشده");
			else if (!activeLocked()) {
				clipRef.current = text;
				copyText(text);
				const id = activeId.current;
				const cell = cellsRef.current.find((c) => c.id === id);
				if (cell) onEdit(cell, ta.value.slice(0, a) + ta.value.slice(b));
				setStatus("بریده شد");
			}
			return;
		}
		if (key === "paste" || ctrl && key.toLowerCase() === "v") {
			(async () => {
				let text = clipRef.current;
				try {
					const sys = await navigator.clipboard.readText();
					if (sys) text = sys;
				} catch {}
				if (!text) {
					setStatus("کلیپ‌بورد خالی است");
					return;
				}
				insertIntoActive(text);
				setStatus("چسبانده شد");
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
	async function doInstall(name) {
		const n = name.trim();
		if (!n) return;
		setPkgLog((l) => l + "\nنصب " + n + " …");
		setStatus("نصب " + n);
		try {
			await installPackage(n);
			setLoaded((prev) => prev.includes(n) ? prev : [...prev, n]);
			setPkgLog((l) => l + "\nآماده: " + n);
			setStatus("نصب شد: " + n);
		} catch (e) {
			setPkgLog((l) => l + "\nخطا: " + (e instanceof Error ? e.message : String(e)));
			setStatus("نصب ناموفق: " + n);
		}
	}
	function applyCtxCopy(text, label) {
		if (!text) {
			setStatus("چیزی انتخاب نشده");
			setCtx(null);
			return;
		}
		clipRef.current = text;
		copyText(text);
		setStatus(label);
		setCtx(null);
	}
	function ctxCopy() {
		if (!ctx) return;
		const a = Math.min(ctx.start, ctx.end);
		const b = Math.max(ctx.start, ctx.end);
		applyCtxCopy(ctx.value.slice(a, b), "همان انتخاب کپی شد");
	}
	function ctxLine() {
		if (!ctx) return;
		applyCtxCopy(lineOf(ctx.value, Math.min(ctx.start, ctx.end)), "همان خط کپی شد");
	}
	function ctxCut() {
		if (!ctx) return;
		const cell = cellsRef.current.find((c) => c.id === ctx.cellId);
		if (!cell || cell.editLocked || editLock) {
			setStatus("ویرایش قفل است");
			setCtx(null);
			return;
		}
		const a = Math.min(ctx.start, ctx.end);
		const b = Math.max(ctx.start, ctx.end);
		const text = ctx.value.slice(a, b);
		if (!text) {
			setStatus("چیزی انتخاب نشده");
			setCtx(null);
			return;
		}
		clipRef.current = text;
		copyText(text);
		onEdit(cell, ctx.value.slice(0, a) + ctx.value.slice(b));
		setStatus("بریده شد");
		setCtx(null);
	}
	async function ctxPaste() {
		if (!ctx) return;
		const cell = cellsRef.current.find((c) => c.id === ctx.cellId);
		if (!cell || cell.editLocked || editLock) {
			setStatus("ویرایش قفل است");
			setCtx(null);
			return;
		}
		let text = clipRef.current;
		try {
			const sys = await navigator.clipboard.readText();
			if (sys) text = sys;
		} catch {}
		if (!text) {
			setStatus("کلیپ‌بورد خالی است");
			setCtx(null);
			return;
		}
		const a = Math.min(ctx.start, ctx.end);
		const b = Math.max(ctx.start, ctx.end);
		onEdit(cell, ctx.value.slice(0, a) + text + ctx.value.slice(b));
		setStatus("چسبانده شد");
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
		setStatus("همهٔ این سلول انتخاب شد");
		setCtx(null);
	}
	function moveKey(index, dir) {
		setSettings((s) => {
			const keys = s.keys.slice();
			const j = index + dir;
			if (j < 0 || j >= keys.length) return s;
			const a = keys[index];
			const b = keys[j];
			if (!a || !b) return s;
			keys[index] = b;
			keys[j] = a;
			return {
				...s,
				keys
			};
		});
	}
	const maximized = cells.some((c) => c.maximized);
	const ctxStyle = ctx ? {
		left: Math.max(8, Math.min(ctx.x, (typeof window !== "undefined" ? window.innerWidth : 360) - 180)),
		top: Math.max(dashH + 8, Math.min(ctx.y, (typeof window !== "undefined" ? window.innerHeight : 640) - 220))
	} : void 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: shellRef,
		className: "shell theme-" + settings.theme + " code-" + settings.codeTheme + (maximized ? " is-max" : "") + (settings.twoRows ? " keys-two" : ""),
		onPointerDown: () => setCtx(null),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "dash",
				ref: dashRef,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "dash-top",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "brand",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "logo",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "brand-name",
								children: "Jupyter IDE"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "brand-file",
								children: [closed ? "بدون نوت‌بوک" : fileName || "بدون نام", dirty && !closed ? " •" : ""]
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "dash-actions",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LongPress, {
									className: "icon-btn" + (moveLock ? " is-on" : ""),
									title: "نگه دار: قفل جابه‌جایی همه",
									onLong: () => {
										setMoveLock((v) => !v);
										setStatus(!moveLock ? "جابه‌جایی همه قفل شد" : "جابه‌جایی همه باز شد");
									},
									onShort: () => setStatus("برای قفل جابه‌جایی نگه دار"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { size: 15 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { size: 11 })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LongPress, {
									className: "icon-btn" + (editLock ? " is-on" : ""),
									title: "نگه دار: قفل ویرایش همه",
									onLong: toggleGlobalEdit,
									onShort: () => setStatus("برای قفل ویرایش نگه دار"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { size: 15 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { size: 11 })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "icon-btn",
									title: "کوچک کردن همه",
									onClick: () => {
										setCells((prev) => prev.map((c) => ({
											...c,
											collapsed: true,
											outCollapsed: true,
											maximized: false
										})));
										setStatus("همه کوچک شدند");
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { size: 16 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "text-btn",
									onClick: () => addCell("code"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 }), " کد"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "text-btn",
									onClick: () => addCell("markdown"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 }), " متن"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "text-btn primary",
									onClick: () => void runAll(),
									title: "اجرای همه",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { size: 14 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "icon-btn menu-btn",
									title: "منو",
									onPointerDown: (e) => e.stopPropagation(),
									onClick: () => setMenuOpen((v) => !v),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { size: 18 })
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "status-line" + (dirty ? " dirty" : ""),
						children: status
					}),
					menuOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "app-menu",
						onPointerDown: (e) => e.stopPropagation(),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => request("new"),
								children: "New notebook"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => request("open"),
								children: "Open…"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => void onSave(),
								children: "Save"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setMenuOpen(false);
									if (closed) return setStatus("نوت‌بوکی باز نیست");
									openSave({
										name: fileName ? fileName.replace(/\.[^.]+$/, "") + "-copy.ipynb" : "notebook.ipynb",
										format: "ipynb",
										after: null,
										bind: true
									});
								},
								children: "Save As…"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => request("close"),
								children: "Close"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => void saveActiveCell(),
								children: "Save active cell"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("hr", {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setMenuOpen(false);
									setPkgOpen(true);
								},
								children: "Packages"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setMenuOpen(false);
									setFinanceOpen(true);
								},
								children: "Finance checklist"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setMenuOpen(false);
									restartKernel().then(() => setStatus("هسته از نو راه افتاد")).catch(() => setStatus("هسته هنوز بالا نیست"));
								},
								children: "Restart kernel"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setMenuOpen(false);
									setSettingsOpen(true);
								},
								children: "Settings"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "notebook",
				ref: nbRef,
				children: [
					closed && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "empty-floor",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "نوت‌بوکی باز نیست" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "کف برنامه این‌جاست. یک نوت‌بوک تازه بساز یا از منو باز کن." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "text-btn primary",
								onClick: () => finishNew(),
								children: "نوت‌بوک تازه"
							})
						]
					}),
					!closed && cells.map((cell) => {
						const locked = editLock || cell.editLocked;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							id: "cell-" + cell.id,
							className: "cell" + (cell.maximized ? " is-max" : "") + (locked ? " is-locked" : ""),
							style: cell.maximized ? {
								top: dashH,
								["--ratio"]: String(cell.maxRatio)
							} : void 0,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "cell-chrome",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "cell-titlebar",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "badge" + (cell.type === "markdown" ? " md" : ""),
												children: cell.type === "code" ? "CODE" : "MD"
											}),
											renaming === cell.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												className: "title-input",
												autoFocus: true,
												defaultValue: cell.title,
												onBlur: (e) => {
													const t = e.target.value.trim();
													if (t && t !== cell.title) patch(cell.id, {
														title: t,
														titleLocked: true
													});
													setRenaming(null);
													setStatus(t ? "نام را خودت گذاشتی" : "نام عوض نشد");
												},
												onKeyDown: (e) => {
													if (e.key === "Enter") e.currentTarget.blur();
												}
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LongPress, {
												className: "cell-title",
												title: "نگه دار برای عوض کردن نام",
												ms: 450,
												onLong: () => setRenaming(cell.id),
												onShort: () => void 0,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: cell.title })
											}),
											cell.editLocked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { size: 12 }),
											cell.type === "code" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "tiny",
												title: "نام را دوباره از متن کد بخوان",
												onClick: () => rereadTitle(cell),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { size: 12 })
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "cell-tools",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "icon-btn",
												title: "Undo",
												onClick: () => undo(cell.id),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Undo2, { size: 15 })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "icon-btn",
												title: "Redo",
												onClick: () => redo(cell.id),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Redo2, { size: 15 })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "icon-btn",
												title: "کوچک",
												onClick: () => {
													const min = cell.collapsed && cell.outCollapsed;
													patch(cell.id, {
														collapsed: !min,
														outCollapsed: !min,
														maximized: false
													});
												},
												children: cell.collapsed && cell.outCollapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { size: 14 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { size: 15 })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "icon-btn",
												title: "بزرگ، بعد دستگیره را بکش",
												onClick: () => {
													setCells((prev) => prev.map((c) => ({
														...c,
														maximized: c.id === cell.id ? !c.maximized : false
													})));
													setStatus(cell.maximized ? "برگشت به اندازهٔ عادی" : "بزرگ شد — دستگیره را بکش");
												},
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UnfoldVertical, { size: 15 })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LongPress, {
												className: "icon-btn" + (cell.editLocked ? " is-on" : ""),
												title: "نگه دار: قفل ویرایش این سلول",
												onLong: () => {
													if (editLock) {
														setStatus("اول قفل داشبورد را بردار");
														return;
													}
													patch(cell.id, { editLocked: !cell.editLocked });
													setStatus(!cell.editLocked ? "ویرایش این سلول قفل شد" : "ویرایش این سلول باز شد");
												},
												onShort: () => setStatus("برای قفل ویرایش سلول نگه دار"),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { size: 14 })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "icon-btn",
												title: "بالا",
												onClick: () => move(cell.id, -1),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { size: 16 })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "icon-btn",
												title: "پایین",
												onClick: () => move(cell.id, 1),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 16 })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "icon-btn",
												title: "بستن سلول",
												onClick: () => setCloseCell({
													id: cell.id,
													py: cell.type === "code",
													nb: false,
													nosave: false
												}),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "grow" }),
											cell.type === "code" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												className: "text-btn primary",
												disabled: running === cell.id,
												onClick: () => void runCell(cell),
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { size: 14 }),
													" ",
													running === cell.id ? "…" : "اجرا"
												]
											}) : null
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "editor-wrap" + (cell.collapsed ? " collapsed" : ""),
									style: cell.maximized ? void 0 : { height: cell.editorHeight },
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CodeEditor, {
										value: cell.content,
										readOnly: locked,
										fontSize: settings.fontSize,
										wrap: settings.wrap,
										indentGuides: settings.guides,
										plain: cell.type === "markdown",
										onChange: (v) => onEdit(cell, v),
										onFocus: (el) => {
											activeTa.current = el;
											activeId.current = cell.id;
											if (!cell.maximized) stickCell(cell.id);
										},
										onBlur: () => {
											if (cell.type === "code" && !cell.titleLocked) {
												const auto = titleFromCode(cell.content);
												if (auto && auto !== cell.title) patch(cell.id, { title: auto });
											}
										},
										onMenu: (info) => {
											activeId.current = cell.id;
											setCtx({
												...info,
												cellId: cell.id
											});
										}
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "resize",
									onPointerDown: (e) => {
										e.preventDefault();
										e.stopPropagation();
										const startY = e.clientY;
										const startH = cell.editorHeight;
										const startR = cell.maxRatio;
										const moveEv = (ev) => {
											const dy = ev.clientY - startY;
											if (cell.maximized) {
												const usable = Math.max(180, window.innerHeight - dashH - 96);
												const ratio = Math.min(.85, Math.max(.25, startR + dy / usable));
												patch(cell.id, { maxRatio: ratio }, false);
											} else patch(cell.id, { editorHeight: Math.max(72, Math.min(920, startH + dy)) }, false);
										};
										const up = () => {
											window.removeEventListener("pointermove", moveEv);
											window.removeEventListener("pointerup", up);
										};
										window.addEventListener("pointermove", moveEv);
										window.addEventListener("pointerup", up);
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
								}),
								cell.type === "markdown" && !cell.collapsed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "md-preview",
									style: { fontSize: settings.outSize },
									dangerouslySetInnerHTML: { __html: simpleMarkdown(cell.content) }
								}),
								cell.type === "code" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
									className: "output" + (cell.outCollapsed ? " collapsed" : ""),
									style: cell.maximized ? void 0 : { height: cell.outputHeight },
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "output-bar",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "خروجی" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "tiny",
											onClick: () => {
												const text = [
													cell.stdout,
													cell.stderr,
													cell.error
												].filter(Boolean).join("\n");
												clipRef.current = text;
												copyText(text);
												setStatus(text ? "خروجی کپی شد" : "خروجی خالی است");
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { size: 12 })
										})]
									}), !cell.outCollapsed && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "output-body",
										style: { fontSize: settings.outSize },
										children: [
											cell.error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
												className: "err",
												children: cell.error
											}),
											cell.stderr && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
												className: "warn",
												children: cell.stderr
											}),
											cell.stdout && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { children: cell.stdout }),
											cell.images.map((img, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												alt: "",
												src: "data:image/png;base64," + img
											}, i)),
											!cell.stdout && !cell.stderr && !cell.error && cell.images.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "muted",
												children: "هنوز خروجی ندارد"
											})
										]
									})]
								}),
								cell.type === "code" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "resize out",
									onPointerDown: (e) => {
										if (cell.maximized) return;
										e.preventDefault();
										const startY = e.clientY;
										const startH = cell.outputHeight;
										const moveEv = (ev) => {
											patch(cell.id, { outputHeight: Math.max(48, Math.min(720, startH + (ev.clientY - startY))) }, false);
										};
										const up = () => {
											window.removeEventListener("pointermove", moveEv);
											window.removeEventListener("pointerup", up);
										};
										window.addEventListener("pointermove", moveEv);
										window.addEventListener("pointerup", up);
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
								})
							]
						}, cell.id);
					}),
					!closed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "floor",
						children: "پایان نوت‌بوک"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "keybar" + (settings.twoRows ? " two" : ""),
				onPointerDown: (e) => e.stopPropagation(),
				children: settings.keys.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "key" + (k.key === "ctrl" && mods.ctrl ? " on" : "") + (k.key === "shift" && mods.shift ? " on" : ""),
					onPointerDown: (e) => e.preventDefault(),
					onClick: () => fireKey(k.key),
					children: k.label
				}, k.id))
			}),
			ctx && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ctx",
				style: ctxStyle,
				onPointerDown: (e) => e.stopPropagation(),
				onContextMenu: (e) => e.preventDefault(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: ctxCopy,
						children: "Copy"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: ctxLine,
						children: "Copy line"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: ctxCut,
						children: "Cut"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => void ctxPaste(),
						children: "Paste"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: ctxAll,
						children: "Select all"
					})
				]
			}),
			saveBox && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				title: saveBox.bind ? "Save As" : "Save cell",
				onClose: () => setSaveBox(null),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["نام فایل", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: saveBox.name,
						onChange: (e) => setSaveBox({
							...saveBox,
							name: e.target.value
						}),
						autoFocus: true
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["فرمت", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: saveBox.format,
						onChange: (e) => {
							const format = e.target.value;
							setSaveBox({
								...saveBox,
								format,
								name: ensureExt(saveBox.name, format)
							});
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "ipynb",
								children: "Notebook (.ipynb)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "py",
								children: "Python (.py)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "md",
								children: "Markdown (.md)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "html",
								children: "HTML (.html)"
							})
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hint",
						children: "مسیر را در پنجرهٔ بعدی انتخاب می‌کنی. Save معمولی، اگر این فایل قبلاً ذخیره شده باشد، بدون پرسش همان‌جا می‌نویسد. لغو این پنجره نوت‌بوک را نمی‌بندد."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "row-actions",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-btn",
							onClick: () => setSaveBox(null),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-btn primary",
							onClick: () => void confirmSave(),
							children: "انتخاب مسیر و ذخیره"
						})]
					})
				]
			}),
			guard && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				title: "تغییرات ذخیره نشده",
				onClose: () => setGuard(null),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "hint",
					children: "این نوت‌بوک تغییراتی دارد که در فایل ننوشته‌ای."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "row-actions",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-btn",
							onClick: () => setGuard(null),
							children: "Cancel"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-btn",
							onClick: () => {
								const action = guard;
								setGuard(null);
								setDirty(false);
								finishAfter(action);
							},
							children: "Don't save"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-btn primary",
							onClick: () => void onSave(),
							children: "Save"
						})
					]
				})]
			}),
			closeCell && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				title: "بستن سلول",
				onClose: () => setCloseCell(null),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hint",
						children: "قبل از بستن ذخیره شود؟"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "check",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: closeCell.py,
							onChange: (e) => setCloseCell({
								...closeCell,
								py: e.target.checked,
								nosave: e.target.checked ? false : closeCell.nosave
							})
						}), "ذخیرهٔ سلول به صورت .py"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "check",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: closeCell.nb,
							onChange: (e) => setCloseCell({
								...closeCell,
								nb: e.target.checked,
								nosave: e.target.checked ? false : closeCell.nosave
							})
						}), "ذخیرهٔ نوت‌بوک .ipynb"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "check",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: closeCell.nosave,
							onChange: (e) => setCloseCell({
								...closeCell,
								nosave: e.target.checked,
								py: e.target.checked ? false : closeCell.py,
								nb: e.target.checked ? false : closeCell.nb
							})
						}), "بستن بدون ذخیره"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "row-actions",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-btn",
							onClick: () => setCloseCell(null),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-btn primary",
							onClick: () => void confirmCloseCell(),
							children: "OK"
						})]
					})
				]
			}),
			ask && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				title: "ورودی پایتون",
				onClose: () => {
					ask.resolve("");
					setAsk(null);
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hint",
						children: ask.prompt || "input()"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						autoFocus: true,
						value: askValue,
						onChange: (e) => setAskValue(e.target.value),
						onKeyDown: (e) => {
							if (e.key === "Enter") {
								ask.resolve(askValue);
								setAsk(null);
							}
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "row-actions",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-btn",
							onClick: () => {
								ask.resolve("");
								setAsk(null);
							},
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-btn primary",
							onClick: () => {
								ask.resolve(askValue);
								setAsk(null);
							},
							children: "OK"
						})]
					})
				]
			}),
			pkgOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				title: "Packages",
				onClose: () => setPkgOpen(false),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hint",
						children: "اول کتابخانهٔ استاندارد است. بقیه را فقط وقتی لازم شد نصب کن."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: pkgName,
						placeholder: "مثلاً yfinance",
						onChange: (e) => setPkgName(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "row-actions",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-btn",
							onClick: () => setPkgOpen(false),
							children: "بستن"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-btn primary",
							onClick: () => void doInstall(pkgName),
							children: "نصب"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "log",
						children: pkgLog || (loaded.length ? loaded.join("\n") : "هنوز چیزی نصب نشده")
					})
				]
			}),
			financeOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				title: "Finance",
				onClose: () => setFinanceOpen(false),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "finance",
					children: FINANCE_PKGS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: p.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: p.desc })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-btn",
						onClick: () => void doInstall(p.name),
						children: loaded.includes(p.name) ? "دوباره" : "نصب"
					})] }, p.name))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "row-actions",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-btn primary",
						onClick: () => setFinanceOpen(false),
						children: "بستن"
					})
				})]
			}),
			settingsOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				title: "تنظیمات",
				onClose: () => setSettingsOpen(false),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["پوسته", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: settings.theme,
						onChange: (e) => setSettings({
							...settings,
							theme: e.target.value
						}),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "dark",
							children: "تیره"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "light",
							children: "روشن"
						})]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["رنگ کد", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: settings.codeTheme,
						onChange: (e) => setSettings({
							...settings,
							codeTheme: e.target.value
						}),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "ide",
								children: "Jupyter IDE"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "monokai",
								children: "Monokai"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "dracula",
								children: "Dracula"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "github",
								children: "GitHub"
							})
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
						"اندازهٔ کد ",
						settings.fontSize,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: 12,
							max: 20,
							value: settings.fontSize,
							onChange: (e) => setSettings({
								...settings,
								fontSize: Number(e.target.value)
							})
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
						"اندازهٔ خروجی ",
						settings.outSize,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: 11,
							max: 18,
							value: settings.outSize,
							onChange: (e) => setSettings({
								...settings,
								outSize: Number(e.target.value)
							})
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "check",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: settings.wrap,
							onChange: (e) => setSettings({
								...settings,
								wrap: e.target.checked
							})
						}), "شکستن خط"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "check",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: settings.guides,
							onChange: (e) => setSettings({
								...settings,
								guides: e.target.checked
							})
						}), "خط راهنمای تورفتگی"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "check",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: settings.twoRows,
							onChange: (e) => setSettings({
								...settings,
								twoRows: e.target.checked
							})
						}), "نوار دکمه‌ها پهن‌تر، دو ردیف"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hint",
						children: "جابه‌جایی دکمه‌های برنامه‌نویسی"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "key-edit",
						children: settings.keys.map((k, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: k.label }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "tiny",
								onClick: () => moveKey(i, -1),
								"aria-label": "بالا",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { size: 14 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "tiny",
								onClick: () => moveKey(i, 1),
								"aria-label": "پایین",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 14 })
							})
						] }, k.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "row-actions",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-btn",
							onClick: () => setSettings({
								...settings,
								keys: DEFAULT_KEYS,
								twoRows: false
							}),
							children: "بازگردانی دکمه‌ها"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-btn primary",
							onClick: () => setSettingsOpen(false),
							children: "تمام"
						})]
					})
				]
			})
		]
	});
}
function Modal({ title, children, onClose }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "modal-back",
		onMouseDown: (e) => {
			if (e.target === e.currentTarget) onClose();
		},
		onPointerDown: (e) => e.stopPropagation(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "modal-card",
			role: "dialog",
			"aria-label": title,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: title }), children]
		})
	});
}
function LongPress({ children, className, title, onLong, onShort, ms = 1800 }) {
	const timer = (0, import_react.useRef)(null);
	const fired = (0, import_react.useRef)(false);
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className,
		title,
		onContextMenu: (e) => {
			e.preventDefault();
			e.stopPropagation();
		},
		onTouchStart: start,
		onTouchEnd: clear,
		onTouchMove: clear,
		onTouchCancel: clear,
		onMouseDown: start,
		onMouseUp: clear,
		onMouseLeave: clear,
		onClick: () => {
			if (fired.current) {
				fired.current = false;
				return;
			}
			onShort();
		},
		children
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotebookApp, {});
}
//#endregion
export { Home as component };
