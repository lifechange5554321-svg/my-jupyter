type PyProxy = { install: (name: string) => Promise<void>; destroy?: () => void };

export type PyodideApi = {
  runPythonAsync: (code: string) => Promise<unknown>;
  loadPackage: (names: string | string[]) => Promise<void>;
  pyimport: (name: string) => PyProxy;
};

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideApi>;
    jideAsk?: (prompt: string) => Promise<string>;
  }
}

const INDEX = "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/";

const BOOT = `
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

let py: PyodideApi | null = null;
let loading: Promise<PyodideApi> | null = null;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
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
    s.onerror = () => reject(new Error("Python failed to load"));
    document.head.appendChild(s);
  });
}

export async function getPy() {
  if (py) return py;
  if (!loading) {
    loading = (async () => {
      await loadScript(INDEX + "pyodide.js");
      if (!window.loadPyodide) throw new Error("Pyodide is not available");
      const instance = await window.loadPyodide({ indexURL: INDEX });
      await instance.runPythonAsync(BOOT);
      py = instance;
      return instance;
    })().catch((err) => {
      loading = null;
      throw err;
    });
  }
  return loading;
}

export type RunResult = {
  stdout: string;
  stderr: string;
  images: string[];
  error_line: number | null;
  error_type: string | null;
  error_msg: string | null;
};

const BUILTIN = ["numpy", "pandas", "matplotlib", "scipy", "scikit-learn", "statsmodels"];

export async function runPython(source: string): Promise<RunResult> {
  const api = await getPy();
  const needed = BUILTIN.filter((name) => source.includes(name));
  if (needed.length) {
    try {
      await api.loadPackage(needed);
    } catch {
      /* cell import will report it */
    }
  }
  const raw = await api.runPythonAsync(`_capture_run(${JSON.stringify(source)})`);
  return JSON.parse(String(raw)) as RunResult;
}

export async function restartKernel() {
  const api = await getPy();
  await api.runPythonAsync("_reset_ns()");
}

export async function installPackage(name: string) {
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

export async function pythonVersion() {
  const api = await getPy();
  const v = await api.runPythonAsync("import sys; sys.version.split()[0]");
  return String(v);
}
