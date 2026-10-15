#!/usr/bin/env python3
"""Trova i file duplicati sul Mac e ti aiuta a spostarli nel Cestino.

Uso:  python3 duplicati.py [cartella ...]
Senza argomenti scansiona Download, Documenti, Scrivania e Immagini.
Si apre una pagina su http://127.0.0.1:8765 (solo locale).
Nessun file viene mai cancellato definitivamente: vanno nel Cestino.
"""
import hashlib, json, os, secrets, shutil, subprocess, sys, threading, webbrowser
from collections import defaultdict
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = 8765
MIN_SIZE = 1024  # ignora file < 1 KB
SKIP_DIRS = {".git", "node_modules", "Library", ".Trash", "__pycache__", ".venv"}
SKIP_SUFFIX = (".app", ".photoslibrary", ".musiclibrary", ".imovielibrary")
TOKEN = secrets.token_urlsafe(16)

state = {"phase": "idle", "scanned": 0, "groups": [], "error": None}
lock = threading.Lock()


def sha(path, limit=None):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        if limit:
            h.update(f.read(limit))
        else:
            for chunk in iter(lambda: f.read(1 << 20), b""):
                h.update(chunk)
    return h.hexdigest()


def scan(roots):
    try:
        by_size = defaultdict(list)
        with lock:
            state.update(phase="scanning", scanned=0, groups=[], error=None)
        for root in roots:
            for dp, dns, fns in os.walk(root):
                dns[:] = [d for d in dns if d not in SKIP_DIRS and not d.endswith(SKIP_SUFFIX)]
                for fn in fns:
                    p = os.path.join(dp, fn)
                    try:
                        if os.path.islink(p):
                            continue
                        s = os.stat(p)
                        if s.st_size >= MIN_SIZE:
                            by_size[s.st_size].append((p, s.st_mtime))
                    except OSError:
                        continue
                    with lock:
                        state["scanned"] += 1
        with lock:
            state["phase"] = "hashing"
        groups = []
        for size, files in by_size.items():
            if len(files) < 2:
                continue
            quick = defaultdict(list)
            for p, m in files:
                try:
                    quick[sha(p, 65536)].append((p, m))
                except OSError:
                    pass
            for cand in quick.values():
                if len(cand) < 2:
                    continue
                full = defaultdict(list)
                for p, m in cand:
                    try:
                        full[sha(p)].append((p, m))
                    except OSError:
                        pass
                for same in full.values():
                    if len(same) > 1:
                        same.sort(key=lambda x: x[1])
                        groups.append({"size": size, "files": [{"path": p, "mtime": m} for p, m in same]})
        groups.sort(key=lambda g: -g["size"] * (len(g["files"]) - 1))
        with lock:
            state.update(phase="done", groups=groups)
    except Exception as e:  # noqa: BLE001
        with lock:
            state.update(phase="error", error=str(e))


def to_trash(path):
    if sys.platform == "darwin":
        script = 'tell application "Finder" to delete POSIX file "%s"' % path.replace("\\", "\\\\").replace('"', '\\"')
        subprocess.run(["osascript", "-e", script], check=True, capture_output=True)
    else:  # solo per test su altri sistemi
        trash = os.path.expanduser("~/.Trash")
        os.makedirs(trash, exist_ok=True)
        dest = os.path.join(trash, os.path.basename(path))
        while os.path.exists(dest):
            dest += "_" + secrets.token_hex(2)
        shutil.move(path, dest)


def trash_files(paths):
    """Cestina i file, garantendo che in ogni gruppo ne resti almeno uno."""
    paths = set(paths)
    with lock:
        groups = state["groups"]
        known = {f["path"] for g in groups for f in g["files"]}
        if not paths <= known:
            raise ValueError("percorso sconosciuto")
        for g in groups:
            if all(f["path"] in paths for f in g["files"]):
                raise ValueError("Non puoi eliminare tutte le copie di un file: " + g["files"][0]["path"])
    done, errors = [], []
    for p in paths:
        try:
            to_trash(p)
            done.append(p)
        except Exception as e:  # noqa: BLE001
            errors.append("%s: %s" % (p, e))
    with lock:
        for g in state["groups"]:
            g["files"] = [f for f in g["files"] if f["path"] not in done]
        state["groups"] = [g for g in state["groups"] if len(g["files"]) > 1]
    return done, errors


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def send(self, code, body, ctype="application/json"):
        data = body if isinstance(body, bytes) else body.encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype + "; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/":
            self.send(200, PAGE.replace("__TOKEN__", TOKEN), "text/html")
        elif self.path == "/api/state":
            with lock:
                self.send(200, json.dumps(state))
        else:
            self.send(404, "{}")

    def do_POST(self):
        if self.headers.get("X-Token") != TOKEN:
            return self.send(403, json.dumps({"error": "token non valido"}))
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0)) or 2) or b"{}")
        if self.path == "/api/trash":
            try:
                done, errors = trash_files(body.get("paths", []))
                self.send(200, json.dumps({"done": len(done), "errors": errors}))
            except ValueError as e:
                self.send(400, json.dumps({"error": str(e)}))
        elif self.path == "/api/reveal":
            p = body.get("path", "")
            with lock:
                ok = any(f["path"] == p for g in state["groups"] for f in g["files"])
            if ok and sys.platform == "darwin":
                subprocess.run(["open", "-R", p])
            self.send(200, "{}")
        else:
            self.send(404, "{}")


PAGE = r"""<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>File duplicati</title>
<style>
:root{color-scheme:light dark;--bg:#fff;--fg:#1d1d1f;--mut:#6e6e73;--line:#d2d2d7;--acc:#0071e3;--red:#d70015}
@media(prefers-color-scheme:dark){:root{--bg:#1c1c1e;--fg:#f5f5f7;--mut:#98989d;--line:#3a3a3c}}
body{font:15px -apple-system,system-ui,sans-serif;background:var(--bg);color:var(--fg);margin:0;padding:0 16px 90px}
main{max-width:900px;margin:0 auto}h1{font-size:24px;margin:24px 0 4px}p.s{color:var(--mut);margin:0 0 16px}
.g{border:1px solid var(--line);border-radius:10px;margin:12px 0;overflow:hidden}
.gh{padding:8px 12px;border-bottom:1px solid var(--line);color:var(--mut);font-size:13px}
.f{display:flex;gap:10px;align-items:center;padding:7px 12px;border-bottom:1px solid var(--line)}.f:last-child{border:0}
.f span{flex:1;word-break:break-all;font-size:13px}.f small{color:var(--mut);white-space:nowrap}
button{font:inherit;border:1px solid var(--line);background:none;color:var(--fg);border-radius:8px;padding:6px 12px;cursor:pointer}
button.p{background:var(--acc);border-color:var(--acc);color:#fff}button.d{background:var(--red);border-color:var(--red);color:#fff}
button:disabled{opacity:.4;cursor:default}
bar{position:fixed;left:0;right:0;bottom:0;background:var(--bg);border-top:1px solid var(--line);padding:12px 16px;display:flex;gap:10px;justify-content:center;align-items:center}
</style><main><h1>File duplicati</h1><p class="s" id="st">Avvio…</p><div id="out"></div></main>
<bar><button id="auto" disabled>Seleziona automaticamente (tieni il più vecchio)</button>
<button id="clear" disabled>Deseleziona</button><button class="d" id="del" disabled>Sposta nel Cestino</button></bar>
<script>
const T="__TOKEN__",$=id=>document.getElementById(id);let groups=[],sel=new Set();
const fmt=b=>b>1e9?(b/1e9).toFixed(2)+" GB":b>1e6?(b/1e6).toFixed(1)+" MB":(b/1e3).toFixed(0)+" KB";
const post=(u,b)=>fetch(u,{method:"POST",headers:{"X-Token":T},body:JSON.stringify(b)}).then(r=>r.json());
function render(){
  const rec=groups.reduce((a,g)=>a+g.size*(g.files.length-1),0);
  $("st").textContent=groups.length?`${groups.length} gruppi di duplicati · recuperabili fino a ${fmt(rec)} · selezionati: ${sel.size}`:"Nessun duplicato trovato.";
  $("out").innerHTML="";
  groups.forEach(g=>{const d=document.createElement("div");d.className="g";
    d.innerHTML=`<div class="gh">${g.files.length} copie · ${fmt(g.size)} ciascuna</div>`;
    g.files.forEach(f=>{const r=document.createElement("label");r.className="f";
      r.innerHTML=`<input type="checkbox" ${sel.has(f.path)?"checked":""}><span></span><small>${new Date(f.mtime*1000).toLocaleDateString("it-IT")}</small>`;
      r.querySelector("span").textContent=f.path;
      r.querySelector("input").onchange=e=>{e.target.checked?sel.add(f.path):sel.delete(f.path);render()};
      const b=document.createElement("button");b.textContent="Mostra";b.onclick=e=>{e.preventDefault();post("/api/reveal",{path:f.path})};r.append(b);
      d.append(r)});$("out").append(d)});
  $("auto").disabled=$("clear").disabled=!groups.length;$("del").disabled=!sel.size;
}
async function poll(){const s=await (await fetch("/api/state")).json();
  if(s.phase=="scanning"||s.phase=="hashing"){$("st").textContent=(s.phase=="scanning"?"Scansione… ":"Confronto contenuto… ")+s.scanned+" file";setTimeout(poll,700)}
  else if(s.phase=="error")$("st").textContent="Errore: "+s.error;
  else{groups=s.groups;render()}}
$("auto").onclick=()=>{sel=new Set();groups.forEach(g=>g.files.slice(1).forEach(f=>sel.add(f.path)));render()};
$("clear").onclick=()=>{sel=new Set();render()};
$("del").onclick=async()=>{if(!confirm(`Spostare ${sel.size} file nel Cestino?`))return;
  const r=await post("/api/trash",{paths:[...sel]});if(r.error)return alert(r.error);
  if(r.errors&&r.errors.length)alert(r.errors.join("\n"));sel=new Set();poll()};
poll();
</script></html>"""


def main():
    roots = [os.path.expanduser(a) for a in sys.argv[1:]] or [
        os.path.expanduser("~/" + d) for d in ("Downloads", "Documents", "Desktop", "Pictures")]
    roots = [r for r in roots if os.path.isdir(r)]
    if not roots:
        sys.exit("Nessuna cartella valida da scansionare.")
    print("Scansione di:", *roots, sep="\n  ")
    threading.Thread(target=scan, args=(roots,), daemon=True).start()
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), H)
    url = "http://127.0.0.1:%d" % PORT
    print("Apri", url, "(Ctrl+C per uscire)")
    webbrowser.open(url)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
