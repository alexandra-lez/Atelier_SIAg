/* Stockage synchronisé : mode démonstration (onglets d'un même navigateur) ou Firebase Firestore. */

window.makeStore = (() => {
  const rid = (n = 8) => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31]).join("");

  function deepMerge(base, patch, DEL) {
    const out = Object.assign({}, base || {});
    for (const k of Object.keys(patch)) {
      const v = patch[k];
      if (v === DEL) delete out[k];
      else if (v && typeof v === "object" && !Array.isArray(v)) out[k] = deepMerge(out[k] && typeof out[k] === "object" && !Array.isArray(out[k]) ? out[k] : {}, v, DEL);
      else out[k] = v;
    }
    return out;
  }

  function demoStore() {
    const KEY = "atelier-iag-demo-v2";
    const DEL = { __del: true };
    let me;
    try { me = sessionStorage.getItem("atelier-me"); if (!me) { me = "u" + rid(10); sessionStorage.setItem("atelier-me", me); } } catch (e) { me = "u" + rid(10); }
    let mem = {};
    const load = () => { try { mem = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {} };
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) {} };
    load();
    const subs = [];
    let bc = null;
    try { bc = new BroadcastChannel(KEY); bc.onmessage = () => { load(); fire(); }; } catch (e) {}
    window.addEventListener("storage", e => { if (e.key === KEY) { load(); fire(); } });
    const clone = o => JSON.parse(JSON.stringify(o));
    function fire() { subs.forEach(s => s()); }
    function changed() { save(); try { bc && bc.postMessage(1); } catch (e) {} fire(); }
    const kids = col => { const depth = col.split("/").length + 1; return Object.keys(mem).filter(k => k.startsWith(col + "/") && k.split("/").length === depth); };
    return {
      kind: "demo", DEL, me: async () => me,
      onDoc(path, cb) { const f = () => cb(mem[path] ? clone(mem[path]) : null); subs.push(f); setTimeout(f, 0); },
      onCol(path, cb) { const f = () => cb(kids(path).map(k => ({ id: k.split("/").pop(), ...clone(mem[k]) }))); subs.push(f); setTimeout(f, 0); },
      async merge(path, data) { mem[path] = deepMerge(mem[path], data, DEL); changed(); },
      async add(col, data) { const id = rid(12); mem[col + "/" + id] = clone(data); changed(); return id; },
      async del(path) { delete mem[path]; changed(); },
      async list(col) { return kids(col).map(k => k.split("/").pop()); }
    };
  }

  async function firebaseStore(cfg) {
    const V = "10.12.2";
    const appM = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
    const authM = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`);
    const fs = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`);
    const app = appM.initializeApp(cfg);
    const auth = authM.getAuth(app);
    const db = fs.getFirestore(app);
    const user = await new Promise((res, rej) => {
      const un = authM.onAuthStateChanged(auth, u => { if (u) { un(); res(u); } });
      authM.signInAnonymously(auth).catch(rej);
    });
    const DEL = fs.deleteField();
    return {
      kind: "firebase", DEL, me: async () => user.uid,
      onDoc(path, cb) { fs.onSnapshot(fs.doc(db, path), s => cb(s.exists() ? s.data() : null), e => { console.warn(e); window.toast && window.toast("Connexion perdue avec la séance. Rechargez la page."); }); },
      onCol(path, cb) { fs.onSnapshot(fs.collection(db, path), s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => console.warn(e)); },
      async merge(path, data) { await fs.setDoc(fs.doc(db, path), data, { merge: true }); },
      async add(col, data) { const r = await fs.addDoc(fs.collection(db, col), data); return r.id; },
      async del(path) { await fs.deleteDoc(fs.doc(db, path)); },
      async list(col) { const s = await fs.getDocs(fs.collection(db, col)); return s.docs.map(d => d.id); }
    };
  }

  return async function makeStore(cfg) {
    if (cfg) {
      try { return await firebaseStore(cfg); }
      catch (e) { console.warn(e); window.toast && window.toast("Connexion à Firebase impossible. Mode démonstration activé."); }
    }
    return demoStore();
  };
})();
