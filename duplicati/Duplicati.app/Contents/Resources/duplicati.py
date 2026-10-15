#!/usr/bin/env python3
"""Trova i file duplicati sul Mac e ti aiuta a spostarli nel Cestino.

Uso:  python3 duplicati.py [cartella ...]
Senza argomenti scansiona Download, Documenti, Scrivania e Immagini.
Si apre una pagina su http://127.0.0.1:8765 (solo locale).
Nessun file viene mai cancellato definitivamente: vanno nel Cestino.
"""
import hashlib, json, mimetypes, os, re, secrets, shutil, stat, subprocess, sys, threading, webbrowser
from collections import defaultdict
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

VERSION = "2.0"
PORT = 8765
MIN_SIZE = 1024  # ignora file < 1 KB
MAX_PREVIEW = 15 << 20  # miniature solo per immagini < 15 MB
SKIP_DIRS = {".git", "node_modules", "Library", ".Trash", "__pycache__", ".venv"}
SKIP_SUFFIX = (".app", ".photoslibrary", ".musiclibrary", ".imovielibrary")
CATEGORIES = {
    "images": "jpg jpeg png gif heic heif tif tiff bmp webp raw cr2 nef arw dng",
    "video": "mp4 mov m4v avi mkv wmv mpg mpeg",
    "audio": "mp3 m4a aac wav flac aiff ogg",
    "docs": "pdf doc docx xls xlsx ppt pptx pages numbers key txt rtf md csv",
    "archives": "zip dmg iso rar 7z tar gz",
}
CATEGORIES = {k: set(v.split()) for k, v in CATEGORIES.items()}
EXTRA_MIME = {".heic": "image/heic", ".heif": "image/heif"}
TOKEN = secrets.token_urlsafe(16)

HOME = os.path.expanduser("~")
PRESETS = [HOME] + [os.path.join(HOME, d) for d in ("Downloads", "Documents", "Desktop", "Pictures", "Movies", "Music")]
if os.path.isdir("/Volumes"):
    PRESETS += [os.path.join("/Volumes", v) for v in sorted(os.listdir("/Volumes"))
                if os.path.ismount(os.path.join("/Volumes", v)) and not os.path.islink(os.path.join("/Volumes", v))]
PRESETS = [p for p in PRESETS if os.path.isdir(p)]
DEFAULT_ROOTS = [p for p in PRESETS if p != HOME and p.startswith(HOME) and os.path.basename(p) in
                 ("Downloads", "Documents", "Desktop", "Pictures")]

state = {"version": VERSION, "phase": "idle", "scanned": 0, "hashed": 0, "total": 0, "groups": [], "error": None,
         "roots": [], "denied": 0, "min_size": MIN_SIZE, "kind": "all", "excludes": [], "presets": PRESETS,
         "mode": "content", "placeholders": 0, "cloud_files": 0}
known = set()  # percorsi presenti nei risultati (per validare le richieste)
lock = threading.Lock()
cancel = threading.Event()


def sha(path, limit=None):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        if limit:
            h.update(f.read(limit))
        else:
            for chunk in iter(lambda: f.read(1 << 20), b""):
                h.update(chunk)
    return h.hexdigest()


def is_excluded(path, excludes):
    return any(path == e or path.startswith(e + os.sep) for e in excludes)


CONFLICT = re.compile(r"( \d+| \(\d+\)| copy( \d+)?| copia( \d+)?)$", re.I)


def name_key(fn):
    """Nome normalizzato: ignora maiuscole e suffissi tipo ' 2', ' (1)', ' copy' prima dell'estensione."""
    stem, ext = os.path.splitext(fn)
    return CONFLICT.sub("", stem).strip().lower(), ext.lower()


def scan(roots, min_size, kind="all", excludes=(), mode="content"):
    cancel.clear()
    exts = CATEGORIES.get(kind)
    try:
        with lock:
            state.update(phase="scanning", scanned=0, hashed=0, total=0, groups=[], error=None, roots=roots,
                         denied=0, min_size=min_size, kind=kind, excludes=list(excludes), mode=mode,
                         placeholders=0, cloud_files=0)
            known.clear()

        def denied(_err):
            with lock:
                state["denied"] += 1

        by_size = defaultdict(list)
        seen = set()  # (dev, inode): stesso file raggiunto due volte o hard link
        count = placeholders = clouds = 0
        for root in roots:
            for dp, dns, fns in os.walk(root, onerror=denied):
                if cancel.is_set():
                    break
                dns[:] = [d for d in dns if d not in SKIP_DIRS and not d.endswith(SKIP_SUFFIX)
                          and not is_excluded(os.path.join(dp, d), excludes)]
                for fn in fns:
                    if fn.endswith(".icloud"):  # segnaposto vecchio stile: la dimensione reale non è nota
                        placeholders += 1
                        continue
                    if exts is not None and os.path.splitext(fn)[1].lower().lstrip(".") not in exts:
                        continue
                    p = os.path.join(dp, fn)
                    try:
                        s = os.lstat(p)
                        if not stat.S_ISREG(s.st_mode):
                            continue
                        if s.st_size < min_size or (s.st_dev, s.st_ino) in seen:
                            continue
                        seen.add((s.st_dev, s.st_ino))
                        # file solo su iCloud: la dimensione si legge senza scaricarlo, il contenuto no
                        cloud = bool(getattr(s, "st_flags", 0) & 0x40000000)
                        clouds += cloud
                        by_size[s.st_size].append((p, s.st_mtime, cloud))
                    except OSError:
                        continue
                    count += 1
                    if count % 200 == 0:
                        with lock:
                            state["scanned"] = count
        with lock:
            state.update(scanned=count, placeholders=placeholders, cloud_files=clouds)
        cands = {sz: f for sz, f in by_size.items() if len(f) > 1}
        with lock:
            state.update(phase="hashing", total=sum(len(f) for f in cands.values()))
        groups = []

        def add(size, files, match):
            files = sorted(files, key=lambda x: x[1])
            groups.append({"size": size, "match": match,
                           "files": [{"path": p, "mtime": m, "cloud": c} for p, m, c in files]})

        def by_name(files):
            d = defaultdict(list)
            for f in files:
                d[name_key(os.path.basename(f[0]))].append(f)
            return [v for v in d.values() if len(v) > 1]

        for size, files in cands.items():
            if cancel.is_set():
                break
            if mode == "name":
                for g in by_name(files):
                    add(size, g, "name")
            else:
                rest = files
                if any(f[2] for f in files):  # con file solo su iCloud: nome + dimensione
                    used = set()
                    for g in by_name(files):
                        if any(f[2] for f in g):
                            add(size, g, "name")
                            used.update(f[0] for f in g)
                    rest = [f for f in files if f[0] not in used and not f[2]]
                quick = defaultdict(list)
                for p, m, c in rest:
                    try:
                        quick[sha(p, 65536)].append((p, m, c))
                    except OSError:
                        pass
                for cand in quick.values():
                    if len(cand) < 2:
                        continue
                    full = defaultdict(list)
                    for p, m, c in cand:
                        try:
                            full[sha(p)].append((p, m, c))
                        except OSError:
                            pass
                    for same in full.values():
                        if len(same) > 1:
                            add(size, same, "content")
            with lock:
                state["hashed"] += len(files)
        if cancel.is_set():
            with lock:
                state.update(phase="cancelled", groups=[])
            return
        groups.sort(key=lambda g: -g["size"] * (len(g["files"]) - 1))
        with lock:
            known.update(f["path"] for g in groups for f in g["files"])
            state.update(phase="done", groups=groups)
    except Exception as e:  # noqa: BLE001
        with lock:
            state.update(phase="error", error=str(e))


def _esc(p):
    return p.replace("\\", "\\\\").replace('"', '\\"')


def _mac_delete(paths):
    items = ", ".join('POSIX file "%s"' % _esc(p) for p in paths)
    script = 'tell application "Finder" to delete {%s}' % items
    subprocess.run(["osascript", "-e", script], check=True, capture_output=True, timeout=180)


def to_trash_many(paths):
    """Sposta nel Cestino a blocchi (molto più veloce di un file alla volta)."""
    done, errors = [], []
    for i in range(0, len(paths), 40):
        chunk = paths[i:i + 40]
        if sys.platform == "darwin":
            try:
                _mac_delete(chunk)
                done += chunk
                continue
            except Exception:  # noqa: BLE001
                pass  # il blocco è fallito: riprova file per file
        for p in chunk:
            if not os.path.exists(p):  # già cestinato dal tentativo a blocco
                done.append(p)
                continue
            try:
                if sys.platform == "darwin":
                    _mac_delete([p])
                else:  # solo per test su altri sistemi
                    trash = os.path.expanduser("~/.Trash")
                    os.makedirs(trash, exist_ok=True)
                    dest = os.path.join(trash, os.path.basename(p))
                    while os.path.exists(dest):
                        dest += "_" + secrets.token_hex(2)
                    shutil.move(p, dest)
                done.append(p)
            except Exception as e:  # noqa: BLE001
                errors.append("%s: %s" % (p, e))
    return done, errors


def trash_files(paths):
    """Cestina i file, garantendo che in ogni gruppo ne resti almeno uno."""
    paths = set(paths)
    with lock:
        groups = state["groups"]
        if not paths <= known:
            raise ValueError("percorso sconosciuto")
        for g in groups:
            if all(f["path"] in paths for f in g["files"]):
                raise ValueError("Non puoi eliminare tutte le copie di un file: " + g["files"][0]["path"])
    done, errors = to_trash_many(sorted(paths))
    with lock:
        gone = set(done)
        for g in state["groups"]:
            g["files"] = [f for f in g["files"] if f["path"] not in gone]
        state["groups"] = [g for g in state["groups"] if len(g["files"]) > 1]
        known.clear()
        known.update(f["path"] for g in state["groups"] for f in g["files"])
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

    def send_image(self, path):
        ext = os.path.splitext(path)[1].lower()
        ctype = EXTRA_MIME.get(ext) or mimetypes.guess_type(path)[0] or ""
        try:
            if not ctype.startswith("image/") or os.path.getsize(path) > MAX_PREVIEW:
                return self.send(404, "{}")
            with open(path, "rb") as f:
                data = f.read()
        except OSError:
            return self.send(404, "{}")
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "private, max-age=3600")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/":
            self.send(200, PAGE.replace("__TOKEN__", TOKEN), "text/html")
        elif u.path == "/api/state":
            with lock:
                self.send(200, json.dumps(state))
        elif u.path == "/api/file":
            q = parse_qs(u.query)
            p = q.get("path", [""])[0]
            with lock:
                ok = q.get("t", [""])[0] == TOKEN and p in known
            self.send_image(p) if ok else self.send(403, "{}")
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
        elif self.path == "/api/scan":
            roots = [os.path.abspath(os.path.expanduser(r)) for r in body.get("roots", [])]
            roots = [r for r in roots if os.path.isdir(r)]
            if not roots:
                return self.send(400, json.dumps({"error": "Nessuna cartella valida"}))
            excludes = [os.path.abspath(os.path.expanduser(e)) for e in body.get("excludes", []) if e.strip()]
            kind = body.get("kind", "all")
            kind = kind if kind in CATEGORIES else "all"
            mode = "name" if body.get("mode") == "name" else "content"
            try:
                min_size = max(1, int(body.get("min_size", MIN_SIZE)))
            except (TypeError, ValueError):
                min_size = MIN_SIZE
            with lock:
                if state["phase"] in ("scanning", "hashing"):
                    return self.send(409, json.dumps({"error": "Scansione già in corso"}))
                state["phase"] = "scanning"
            threading.Thread(target=scan, args=(roots, min_size, kind, excludes, mode), daemon=True).start()
            self.send(200, "{}")
        elif self.path == "/api/cancel":
            cancel.set()
            self.send(200, "{}")
        elif self.path == "/api/reveal":
            p = body.get("path", "")
            with lock:
                ok = p in known
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
main{max-width:920px;margin:0 auto}h1{font-size:24px;margin:24px 0 4px}p.s{color:var(--mut);margin:8px 0}
details{margin:10px 0}summary{cursor:pointer;font-weight:600}#cfg label{display:block;font-size:13px;padding:2px 0}
.row{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin:8px 0;font-size:13px}
input[type=text],select{font:inherit;padding:5px 8px;border:1px solid var(--line);border-radius:8px;background:none;color:var(--fg)}
.row input[type=text]{flex:1;min-width:220px}
.g{border:1px solid var(--line);border-radius:10px;margin:12px 0;overflow:hidden}.g.warn{border-color:var(--red)}
.gh{padding:8px 12px;border-bottom:1px solid var(--line);color:var(--mut);font-size:13px}.g.warn .gh{color:var(--red)}
.f{display:flex;gap:10px;align-items:center;padding:7px 12px;border-bottom:1px solid var(--line)}.f:last-child{border:0}
.f span{flex:1;word-break:break-all;font-size:13px}.f small{color:var(--mut);white-space:nowrap}
.f img{width:44px;height:44px;object-fit:cover;border-radius:6px;cursor:zoom-in}.f img.big{width:260px;height:260px;object-fit:contain;cursor:zoom-out}
button{font:inherit;border:1px solid var(--line);background:none;color:var(--fg);border-radius:8px;padding:6px 12px;cursor:pointer}
button.p{background:var(--acc);border-color:var(--acc);color:#fff}button.d{background:var(--red);border-color:var(--red);color:#fff}
button:disabled{opacity:.4;cursor:default}progress{width:100%;height:8px}
#bottom{position:fixed;left:0;right:0;bottom:0;background:var(--bg);border-top:1px solid var(--line);padding:12px 16px;display:flex;gap:10px;justify-content:center;align-items:center;flex-wrap:wrap}
</style><main><h1>File duplicati</h1>
<details id="cfgbox" open><summary>Dove cercare</summary><div id="cfg"></div>
<div class="row"><input type="text" id="custom" placeholder="Altro percorso, es. ~/Library/Mobile Documents/com~apple~CloudDocs"></div>
<div class="row"><input type="text" id="excl" placeholder="Escludi cartelle (percorsi separati da virgola)"></div>
<div class="row"><label>Tipo <select id="kind"><option value="all">Tutti i file</option><option value="images">Immagini</option><option value="video">Video</option><option value="audio">Audio</option><option value="docs">Documenti</option><option value="archives">Archivi e immagini disco</option></select></label>
<label>Confronto <select id="mode"><option value="content">Contenuto (preciso)</option><option value="name">Solo nome e dimensione (veloce)</option></select></label>
<label>Dimensione minima <select id="minsz"><option value="1024">1 KB</option><option value="102400">100 KB</option><option value="1048576">1 MB</option><option value="10485760">10 MB</option></select></label>
<button class="p" id="go">Scansiona</button><button id="stop" hidden>Annulla</button></div></details>
<p class="s" id="st">Avvio…</p><progress id="pg" hidden></progress>
<div class="row" id="viewbar" hidden>
<label>Ordina <select id="sort"><option value="space">Spazio recuperabile</option><option value="copies">Numero di copie</option><option value="name">Nome</option></select></label>
<label>Tieni <select id="keep"><option value="old">il più vecchio</option><option value="new">il più recente</option><option value="short">il percorso più corto</option><option value="pref">quello nella cartella preferita</option></select></label>
<input type="text" id="pref" placeholder="Cartella preferita (per 'Tieni quello nella cartella preferita')">
<button id="auto">Seleziona automaticamente</button></div>
<div id="out"></div><p><button id="more" hidden></button></p></main>
<div id="bottom"><span id="selinfo" class="s"></span><button id="clear" disabled>Deseleziona</button><button class="d" id="del" disabled>Sposta nel Cestino</button></div>
<script>
const T="__TOKEN__",$=id=>document.getElementById(id),PAGE=100,IMG=/\.(jpe?g|png|gif|webp|bmp|tiff?|heic|heif)$/i;
let groups=[],sel=new Set(),shown=PAGE,cfgDone=false,polling=false;
const fmt=b=>b>1e9?(b/1e9).toFixed(2)+" GB":b>1e6?(b/1e6).toFixed(1)+" MB":(b/1e3).toFixed(0)+" KB";
const post=(u,b)=>fetch(u,{method:"POST",headers:{"X-Token":T},body:JSON.stringify(b||{})}).then(r=>r.json());
const h=(tag,props,...kids)=>{const e=document.createElement(tag);Object.assign(e,props||{});kids.forEach(k=>e.append(k));return e};
const load=()=>{try{return JSON.parse(localStorage.getItem("dup")||"{}")}catch(e){return {}}};
const save=()=>{try{localStorage.setItem("dup",JSON.stringify({roots:checkedRoots(),excl:$("excl").value,kind:$("kind").value,mode:$("mode").value,minsz:$("minsz").value,keep:$("keep").value,pref:$("pref").value,sort:$("sort").value}))}catch(e){}};
const checkedRoots=()=>[...document.querySelectorAll("#cfg input:checked")].map(i=>i.value);
function cfg(s){if(cfgDone)return;cfgDone=true;const v=load(),roots=v.roots||s.roots;
  s.presets.forEach(p=>{const c=h("input",{type:"checkbox",value:p,checked:roots.includes(p)});$("cfg").append(h("label",{},c," "+p))});
  const ms=String(v.minsz||s.min_size);if(![...$("minsz").options].some(o=>o.value==ms))$("minsz").append(h("option",{value:ms,textContent:fmt(+ms)}));$("minsz").value=ms;$("kind").value=v.kind||s.kind||"all";$("mode").value=v.mode||"content";$("excl").value=v.excl||"";
  $("keep").value=v.keep||"old";$("pref").value=v.pref||"";$("sort").value=v.sort||"space"}
const keepIdx=g=>{const f=g.files;let k=0;const keep=$("keep").value;
  if(keep=="new")k=f.length-1;
  else if(keep=="short")f.forEach((x,i)=>{if(x.path.length<f[k].path.length)k=i});
  else if(keep=="pref"){const p=$("pref").value.trim().replace(/^~/,"");const i=p?f.findIndex(x=>x.path.startsWith(p)):-1;k=i>=0?i:0}
  return k};
function sorted(){const g=[...groups],s=$("sort").value;
  if(s=="copies")g.sort((a,b)=>b.files.length-a.files.length||b.size-a.size);
  else if(s=="name")g.sort((a,b)=>a.files[0].path.localeCompare(b.files[0].path));
  else g.sort((a,b)=>b.size*(b.files.length-1)-a.size*(a.files.length-1));return g}
function render(){
  const rec=groups.reduce((a,g)=>a+g.size*(g.files.length-1),0),sizes={};groups.forEach(g=>g.files.forEach(f=>sizes[f.path]=g.size));
  $("st").textContent=groups.length?`${groups.length} gruppi di duplicati · recuperabili fino a ${fmt(rec)}`:"Nessun duplicato trovato.";
  $("viewbar").hidden=!groups.length;$("out").innerHTML="";const view=sorted();
  view.slice(0,shown).forEach(g=>{const d=h("div",{className:"g"+(g.files.every(f=>sel.has(f.path))?" warn":"")});
    d.append(h("div",{className:"gh"},`${g.files.length} copie · ${fmt(g.size)} ciascuna`+(g.match=="name"?" · stesso nome e dimensione (contenuto non verificato)":"")+(g.files.every(f=>sel.has(f.path))?" · attenzione: le hai selezionate tutte, una copia deve restare":"")));
    g.files.forEach(f=>{const cb=h("input",{type:"checkbox",checked:sel.has(f.path)});
      cb.onchange=()=>{cb.checked?sel.add(f.path):sel.delete(f.path);render()};
      const r=h("label",{className:"f"},cb);
      if(IMG.test(f.path)){const im=h("img",{loading:"lazy",src:"/api/file?t="+T+"&path="+encodeURIComponent(f.path)});
        im.onerror=()=>im.remove();im.onclick=e=>{e.preventDefault();im.classList.toggle("big")};r.append(im)}
      r.append(h("span",{textContent:(f.cloud?"☁ ":"")+f.path}),h("small",{textContent:new Date(f.mtime*1000).toLocaleDateString("it-IT")}));
      const b=h("button",{textContent:"Mostra"});b.onclick=e=>{e.preventDefault();post("/api/reveal",{path:f.path})};r.append(b);d.append(r)});
    $("out").append(d)});
  $("more").hidden=view.length<=shown;$("more").textContent=`Mostra altri ${Math.min(PAGE,view.length-shown)} gruppi (${view.length-shown} rimanenti)`;
  const free=[...sel].reduce((a,p)=>a+(sizes[p]||0),0);
  $("selinfo").textContent=sel.size?`${sel.size} file selezionati · ${fmt(free)} liberabili`:"Nessun file selezionato";
  $("clear").disabled=!sel.size;$("del").disabled=!sel.size}
async function poll(){if(polling)return;polling=true;
  try{for(;;){const s=await (await fetch("/api/state")).json();cfg(s);
    const busy=s.phase=="scanning"||s.phase=="hashing"||s.phase=="idle";$("go").disabled=busy;$("stop").hidden=!busy;
    const note=(s.placeholders?` · ${s.placeholders} segnaposto iCloud vecchio stile saltati`:"")+(s.denied?` · ${s.denied} cartelle non accessibili (Impostazioni → Privacy e sicurezza → Accesso completo al disco)`:"");
    if(busy){$("pg").hidden=false;
      if(s.phase=="hashing"){$("pg").max=s.total||1;$("pg").value=s.hashed;$("st").textContent=`Confronto contenuto… ${s.hashed} / ${s.total} file`+note}
      else{$("pg").removeAttribute("value");$("st").textContent=`Scansione… ${s.scanned} file`+note}
      await new Promise(r=>setTimeout(r,700));continue}
    $("pg").hidden=true;
    if(s.phase=="error")$("st").textContent="Errore: "+s.error;
    else if(s.phase=="cancelled")$("st").textContent="Scansione annullata.";
    else{groups=s.groups;render();$("st").textContent+=note}
    break}}finally{polling=false}}
$("go").onclick=async()=>{const roots=checkedRoots(),c=$("custom").value.trim();if(c)roots.push(c);
  if(!roots.length)return alert("Scegli almeno una cartella");save();sel=new Set();shown=PAGE;
  const r=await post("/api/scan",{roots,min_size:+$("minsz").value,kind:$("kind").value,mode:$("mode").value,excludes:$("excl").value.split(",").map(x=>x.trim()).filter(Boolean)});
  if(r.error)return alert(r.error);$("cfgbox").open=false;poll()};
$("stop").onclick=()=>post("/api/cancel");
$("auto").onclick=()=>{save();sel=new Set();groups.forEach(g=>{const k=keepIdx(g);g.files.forEach((f,i)=>{if(i!=k)sel.add(f.path)})});render()};
$("clear").onclick=()=>{sel=new Set();render()};
$("more").onclick=()=>{shown+=PAGE;render()};
["sort","keep","pref"].forEach(i=>$(i).onchange=()=>{save();render()});
$("del").onclick=async()=>{if(!confirm(`Spostare ${sel.size} file nel Cestino?`))return;
  const r=await post("/api/trash",{paths:[...sel]});if(r.error)return alert(r.error);
  if(r.errors&&r.errors.length)alert(r.errors.join("\n"));sel=new Set();poll()};
poll();
</script></html>"""


def main():
    roots = [os.path.abspath(os.path.expanduser(a)) for a in sys.argv[1:]] or DEFAULT_ROOTS
    roots = [r for r in roots if os.path.isdir(r)]
    if not roots:
        sys.exit("Nessuna cartella valida da scansionare.")
    url = "http://127.0.0.1:%d" % PORT
    try:
        srv = ThreadingHTTPServer(("127.0.0.1", PORT), H)
    except OSError:  # già in esecuzione: riapri solo la pagina
        webbrowser.open(url)
        return
    print("Scansione di:", *roots, sep="\n  ")
    state["phase"] = "scanning"
    threading.Thread(target=scan, args=(roots, MIN_SIZE), daemon=True).start()
    print("Apri", url, "(Ctrl+C per uscire)")
    webbrowser.open(url)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
