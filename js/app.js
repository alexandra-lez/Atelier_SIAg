/* Exercice de posture : portrait individuel, portrait général du groupe et formation des équipes.
   Deux vues : la personne participante (adresse #CODE) et l'animation (adresse #animer, non affichée aux participants). */
(() => {
const C = window.CONTENT, DOCS = window.DOCS, IC = window.ICONS || {};
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ico = (k, cls = "") => `<span class="ico ${cls}" aria-hidden="true">${IC[k] || ""}</span>`;
const rid = (n = 8) => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31]).join("");
const pick = a => a[Math.floor(Math.random() * a.length)];
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const filled = v => !!(v && String(v).trim());
const nOn = o => Object.values(o || {}).filter(Boolean).length;
const pct = (a, n) => n ? Math.round(a / n * 100) : 0;
const MIN_GROUP = 5; // le portrait du groupe n'apparaît qu'à partir de 5 portraits terminés
const IN_PREVIEW = !!(window.claude && typeof window.claude.use === "function") || /claudeusercontent|claude\.ai/.test(location.hostname);
const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

window.toast = (msg, ms = 3200) => { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(window.toast.h); window.toast.h = setTimeout(() => { t.hidden = true; }, ms); };
async function busy(btn, label, fn, done) {
  const old = btn.innerHTML; btn.disabled = true; btn.textContent = label;
  try { await fn(); toast("Document prêt. Vérifiez vos téléchargements."); if (done) done(); }
  catch (e) { if (e && e.quiet) toast("Téléchargement annulé."); else { console.warn(e); toast(e && e.why ? e.why : "Le document n'a pas pu être créé (" + ((e && (e.message || e.code)) || "erreur inconnue") + "). Réessayez."); } }
  finally { btn.disabled = false; btn.innerHTML = old; }
}
function copyText(txt) {
  try { navigator.clipboard.writeText(txt).then(() => toast("Lien copié."), () => prompt("Copiez ce lien :", txt)); } catch (e) { prompt("Copiez ce lien :", txt); }
}

/* ======================= État et synchronisation ======================= */
const ST = { store: null, me: null, code: null, admin: false, session: null, people: {}, pst: null, sitIdx: null, flagged: false, built: null, tab: "portrait" };
const P = path => `sessions/${ST.code}${path ? "/" + path : ""}`;
const isOwner = () => !!(ST.admin && ST.session && ST.session.owner === ST.me);
const me = () => ST.people[ST.me] || {};
const people = () => Object.entries(ST.people).filter(([id]) => ST.session && id !== ST.session.owner);
const TEAM = Object.fromEntries(C.TEAMS.map(t => [t.id, t]));
const tName = t => TEAM[t] ? TEAM[t].nm : t;
const teamOf = uid => (ST.session && ST.session.assign && ST.session.assign[uid]) || null;
const allTeams = () => ((ST.session && ST.session.teams) || []).filter(t => TEAM[t]);
const members = t => people().filter(([id]) => teamOf(id) === t);
const queues = {};
function write(path, data) {
  const q = queues[path] || Promise.resolve();
  queues[path] = q.then(() => ST.store.merge(path, data)).catch(e => { console.warn(e); toast("L'enregistrement n'a pas fonctionné. Vérifiez la connexion."); });
  return queues[path];
}
const savePerson = patch => { ST.saving = (ST.saving || 0) + 1; paintSave(); ST.people[ST.me] = deep(me(), patch); return write(P("people/" + ST.me), { ...patch, seen: Date.now() }).finally(() => { ST.saving = Math.max(0, ST.saving - 1); ST.savedAt = Date.now(); paintSave(); }); };
function deep(base, patch) { const o = { ...(base || {}) }; for (const k of Object.keys(patch)) { const v = patch[k]; if (v === ST.store.DEL) delete o[k]; else if (v && typeof v === "object" && !Array.isArray(v)) o[k] = deep(o[k], v); else o[k] = v; } return o; }

(async function boot() {
  const cfg = window.ATELIER_CONFIG && window.ATELIER_CONFIG.firebase;
  ST.store = await window.makeStore(cfg);
  ST.me = await ST.store.me();
  window.addEventListener("hashchange", route);
  window.addEventListener("resize", () => { if (ST.built && ST.built.startsWith("p:")) paintHelp(); });
  route();
  setInterval(simTick, 1300);
})();

let subscribed = null, unsub = [];
function parseHash() {
  const h = decodeURIComponent(location.hash.replace(/^#/, ""));
  if (/^animer\b/i.test(h)) { const c = h.split("/")[1]; return { admin: true, code: c && /^[A-Z0-9]{4,6}$/i.test(c) ? c.toUpperCase() : null }; }
  return { admin: false, code: /^[A-Z0-9]{4,6}$/i.test(h) ? h.toUpperCase() : null };
}
function route() {
  const r = parseHash();
  ST.admin = r.admin;
  document.body.classList.toggle("is-admin", r.admin);
  if (!r.code) { subscribed = null; ST.code = null; ST.session = null; ST.built = null; r.admin ? renderAdminHome() : renderLanding(); return; }
  if (subscribed === r.code + r.admin) return;
  subscribed = r.code + r.admin; ST.code = r.code; ST.session = null; ST.people = {}; ST.built = null; ST.peopleSub = false;
  $("main").innerHTML = `<div class="loading">Connexion à la séance…</div>`;
  ST.store.onDoc(P(""), d => {
    if (subscribed !== r.code + r.admin) return;
    ST.session = d;
    if (!d) { $("main").innerHTML = `<section class="card narrow center-card"><h1>Séance introuvable</h1><p>Aucune séance ne porte le code <b>${esc(r.code)}</b>. Vérifiez-le auprès de la personne qui anime.</p><a class="btn ghost" href="#">Entrer un autre code</a></section>`; return; }
    if (!ST.peopleSub) {
      ST.peopleSub = true;
      // L'animation lit toutes les fiches; une personne participante ne lit que la sienne.
      if (r.admin && d.owner === ST.me) ST.store.onCol(P("people"), l => { ST.people = Object.fromEntries(l.map(x => [x.id, x])); render(); });
      else ST.store.onDoc(P("people/" + ST.me), doc => { ST.people = doc ? { [ST.me]: doc } : {}; render(); });
    }
    render();
  });
}
let raf = null;
function render() { if (raf) return; raf = setTimeout(() => { raf = null; if (!ST.session) return; if (ST.admin) renderAdmin(); else renderPart(); }, 0); }
function topbar(right, sub) {
  $("topr").innerHTML = right || "";
  $("topsub").textContent = sub || "Atelier 1, Service de soutien à la formation";
}

/* ======================= Bandeau d'ouverture et silhouette ======================= */
const hero = (inner, cls = "") => `<section class="hero ${cls}"><div class="hero-in">${inner}</div></section>`;
/* La silhouette du portrait : une forme lissée qui passe par les six réponses.
   ex = true : version pour le Word (couleurs et polices écrites en dur, fond blanc). */
/* Un nom long passe sur deux lignes, avant « et », sinon après 18 caractères au plus */
const splitName = nm => {
  if (nm.length <= 18) return [nm];
  if (nm.includes(" et ")) { const i = nm.indexOf(" et "); return [nm.slice(0, i), nm.slice(i + 1)]; }
  const w = nm.split(" "); let i = 1;
  while (i < w.length - 1 && w.slice(0, i + 1).join(" ").length <= 18) i++;
  return [w.slice(0, i).join(" "), w.slice(i).join(" ")];
};
function silhouetteSVG(F, hot = [], opt = {}) {
  const N = C.FACETS.length, R = 135, rad = d => d * Math.PI / 180, ang = i => rad(i * 360 / N - 90), ex = !!opt.ex;
  const e = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const val = f => F[f.k] == null ? 0 : F[f.k];
  const pts = C.FACETS.map((f, i) => { const k = Math.max(0.08, val(f) / 100); return [Math.cos(ang(i)) * R * k, Math.sin(ang(i)) * R * k]; });
  let d = "";
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N], t = 0.19;
    if (!i) d += `M${p1[0].toFixed(1)},${p1[1].toFixed(1)}`;
    d += ` C${(p1[0] + (p2[0] - p0[0]) * t).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) * t).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) * t).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) * t).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  const ink = ex ? "#1A221D" : "var(--fg)", gold = ex ? "#9A6C12" : "var(--gold-ink)", line = ex ? "#E3E8E0" : "var(--line)", bg = ex ? "#FFFFFF" : "var(--surface)";
  const font = ex ? 'font-family="Arial, Helvetica, sans-serif"' : 'class="lab"';
  let s = `<svg ${ex ? 'xmlns="http://www.w3.org/2000/svg" width="1920" height="1230"' : `class="silhouette${opt.still ? " still" : ""}"`} viewBox="${ex ? "-320 -205 640 410" : "-280 -200 560 400"}" role="img" aria-label="Ma silhouette. ${e(C.FACETS.map(f => `${f.nm} : ${F[f.k] == null ? "sans réponse" : F[f.k] + " sur 100"}`).join(", "))}">`;
  if (ex) s += `<rect x="-320" y="-205" width="640" height="410" fill="#FFFFFF"/>`;
  s += `<defs><radialGradient id="sg" cx="0" cy="0" r="150" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#00A759" stop-opacity=".95"/><stop offset="1" stop-color="#805186" stop-opacity=".92"/></radialGradient>
    <filter id="ssh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#805186" flood-opacity=".32"/></filter></defs>`;
  [0.25, 0.5, 0.75, 1].forEach(k => { s += `<circle r="${R * k}" fill="none" stroke="${line}" stroke-width="1" ${k < 1 ? 'stroke-dasharray="1 5"' : ""}/>`; });
  C.FACETS.forEach((f, i) => { s += `<line x2="${(Math.cos(ang(i)) * R).toFixed(1)}" y2="${(Math.sin(ang(i)) * R).toFixed(1)}" stroke="${line}" stroke-opacity=".6"/>`; });
  s += `<g class="shape"><path d="${d} Z" fill="url(#sg)" filter="url(#ssh)"/></g>`;
  pts.forEach((p, i) => { const h = hot.includes(C.FACETS[i].k); s += `<circle class="pt" style="--i:${i}" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${h ? 7 : 5}" fill="${h ? "#E5A938" : bg}" stroke="${h ? bg : "#805186"}" stroke-width="2.5"/>`; });
  C.FACETS.forEach((f, i) => {
    const lines = splitName(f.nm), x = Math.cos(ang(i)) * (R + 26), y0 = Math.sin(ang(i)) * (R + 26);
    const y = y0 + (y0 < -10 ? -2 - (lines.length - 1) * 19 : y0 > 10 ? 14 : 6 - (lines.length - 1) * 9.5);
    const anchor = Math.abs(x) < 10 ? "middle" : x > 0 ? "start" : "end", h = hot.includes(f.k);
    s += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" ${font} font-weight="700" font-size="17" fill="${h ? gold : ink}">${lines.map((l, j) => `<tspan x="${x.toFixed(1)}" dy="${j ? 19 : 0}">${e(l)}</tspan>`).join("")}</text>`;
  });
  return s + "</svg>";
}
const ringsSVG = () => `<svg class="rings" viewBox="0 0 200 200" aria-hidden="true">${[30, 52, 74, 96].map((r, i) => `<circle cx="160" cy="40" r="${r}" style="--i:${i}"/>`).join("")}</svg>`;

/* ======================= Accueil (sans code) ======================= */
function renderLanding() {
  topbar("");
  $("main").innerHTML = hero(`<div class="land-l"><h1 class="display"><span class="part">PARTIE 1 |</span> Mon portrait de personne utilisatrice</h1>
      <p class="lead">Dressez votre portrait de personne utilisatrice de l'IA générative, découvrez celui du groupe, puis rejoignez votre équipe.</p></div>
    <form class="card join" id="joinForm"><label class="f"><span>Code de la séance</span><small>La personne qui anime vous le donne.</small>
      <input type="text" id="joinCode" maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Ex. : K7QM" aria-describedby="joinErr"></label>
      <p class="err" id="joinErr" role="alert"></p><button class="btn big block" type="submit">Entrer ${ico("arrowR")}</button>
      ${ST.store.kind === "demo" ? `<p class="note">${IN_PREVIEW ? "Aperçu : seules les séances créées dans ce navigateur sont accessibles." : (window.FIREBASE_ERROR ? "Connexion à Firebase impossible. " + window.FIREBASE_ERROR + " " : "") + "Mode démonstration : seules les séances créées dans ce navigateur sont accessibles."}</p>` : ""}</form>
      ${IN_PREVIEW ? `<p class="note preview-link">Aperçu seulement : <a href="#animer">ouvrir la vue d'animation</a>. Ce lien n'existe pas dans la version déployée.</p>` : ""}`, "hero-land");
  $("joinForm").onsubmit = e => { e.preventDefault(); const c = $("joinCode").value.trim().toUpperCase(); if (!/^[A-Z0-9]{4,6}$/.test(c)) { $("joinErr").textContent = "Le code compte 4 caractères, lettres et chiffres."; $("joinCode").focus(); return; } location.hash = c; };
  $("joinCode").focus();
}

/* ======================= Portrait : calculs ======================= */
const L5 = x => x == null ? null : (x - 1) * 25;
const avg = arr => { const v = arr.filter(x => x != null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; };
const R4 = [0, 33, 67, 100];
function seeded(str) { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }
const optOrder = (s, uid) => { const r = seeded(uid + s.id); return s.o.slice().sort(() => r() - 0.5); };
const SIT = Object.fromEntries(C.SITUATIONS.map(s => [s.id, s]));
const RULE = Object.fromEntries(C.RULES.map(r => [r.k, r]));
const chosen = (p, s) => s.o.find(o => o.k === ((p && p.sit) || {})[s.id]) || null;
const known = (p, r) => ((p && p.known) || {})[r.k];
const BELIEFS = ["b_comprend", "b_ecrit", "b_sources", "b_neutre", "b_confiance"];
/* Sous-scores internes, pour les tensions seulement (jamais affichés) */
const utilite = a => avg(["p_temps", "p_qualite", "p_reflexion"].map(k => L5(a[k]))), confiance = a => avg(BELIEFS.map(k => L5(a[k])));
function facets(p) {
  const a = (p && p.a) || {};
  return {
    usages: p && p.u_freq != null ? R4[p.u_freq] : null,
    croyances: avg(["p_temps", "p_qualite", "p_reflexion", ...BELIEFS].map(k => L5(a[k]))),
    emotions: p && p.emo != null ? p.emo : null,
    competence: avg(["c_formuler", "c_ajuster", "c_erreur", "c_choisir", "c_expliquer"].map(k => L5(a[k]))),
    valeurs: avg(["v_souhaitable", "v_transparence", "v_humain", "v_equite", "v_environnement"].map(k => L5(a[k]))),
    attentes: avg(C.SITUATIONS.map(s => { const o = chosen(p, s); return o ? o.d : null; }))
  };
}
const PENSE = ["p_temps", "p_qualite", "p_reflexion", "p_habitude", "p_social", "b_comprend", "b_ecrit", "b_sources", "b_neutre", "b_confiance"], REPERES = ["c_formuler", "c_ajuster", "c_erreur", "c_choisir", "c_expliquer", "v_souhaitable", "v_transparence", "v_humain", "v_equite", "v_environnement"];
const REQ = {
  usages: p => [{ id: "q-freq", nm: "la fréquence", ok: p.u_freq != null }, { id: "q-tasks", nm: "les tâches", ok: p.u_freq === 0 || nOn(p.tasks) > 0 }, { id: "q-tools", nm: "les outils", ok: nOn(p.tools) > 0 }],
  pense: p => PENSE.map(k => ({ id: "lk-" + k, nm: "aff", ok: (p.a || {})[k] != null })),
  ressens: p => [{ id: "q-emo", nm: "le curseur", ok: p.emo != null }, { id: "q-worries", nm: "ce qui vous inquiète", ok: nOn(p.worries) > 0 }, { id: "q-preocc", nm: "la question qui vous occupe", ok: !!p.preocc }],
  reperes: p => [...REPERES.map(k => ({ id: "lk-" + k, nm: "aff", ok: (p.a || {})[k] != null })), { id: "q-values", nm: "ce qui compte pour vous", ok: nOn(p.values) > 0 }],
  situations: p => [{ id: "sitB", nm: "votre choix", ok: !!chosen(p, C.SITUATIONS[ST.sitIdx || 0]) }],
  portrait: () => []
};
const SCREEN_DONE = {
  usages: p => REQ.usages(p).every(x => x.ok), pense: p => REQ.pense(p).every(x => x.ok), ressens: p => REQ.ressens(p).every(x => x.ok), reperes: p => REQ.reperes(p).every(x => x.ok),
  situations: p => C.SITUATIONS.every(s => chosen(p, s)), portrait: p => !!p.seenPortrait
};
const SIT_I = C.PSCREENS.findIndex(x => x.k === "situations"), POR_I = C.PSCREENS.findIndex(x => x.k === "portrait");
const screenDone = (p, i) => SCREEN_DONE[C.PSCREENS[i].k](p || {});
const firstOpen = p => { const i = C.PSCREENS.findIndex((_, k) => !screenDone(p, k)); return i < 0 ? C.PSCREENS.length - 1 : i; };
const canOpen = (p, i) => i <= firstOpen(p);
const portraitDone = p => C.PSCREENS.slice(0, POR_I).every((_, i) => screenDone(p, i));
function missingText(list) {
  const miss = list.filter(x => !x.ok); if (!miss.length) return "";
  const aff = miss.filter(x => x.nm === "aff").length, others = [...new Set(miss.filter(x => x.nm !== "aff").map(x => x.nm))];
  const parts = [...(aff ? [aff > 1 ? aff + " affirmations" : "une affirmation"] : []), ...others];
  return "Il manque " + (parts.length > 1 ? parts.slice(0, -1).join(", ") + " et " + parts.at(-1) : parts[0]) + ".";
}
function tensions(p) {
  const F = facets(p), a = p.a || {}, out = [];
  const gaps = C.RULES.map(r => { const o = chosen(p, SIT[r.sit]); return known(p, r) === 2 && o && o.d < 50 ? { r, o } : null; }).filter(Boolean);
  if (gaps.length) { const g = gaps[0]; out.push({ k: "regle", piste: "Avant d'envoyer un travail fait avec l'IAg, reprenez cette ligne directrice comme liste de vérification.", nm: "Connue, mais pas appliquée", txt: `Vous connaissiez la ligne directrice « ${g.r.nm.toLowerCase()} », mais votre choix dans la situation « ${SIT[g.r.sit].nm} » va dans l'autre sens.`, q: "Qu'est-ce qui fait qu'une règle connue passe à la trappe un jour chargé?", src: "Tankelevitch et al. (2024)", c: "var(--gold)" }); }
  if (confiance(a) != null && confiance(a) >= 70 && a.c_erreur != null && a.c_erreur <= 3) out.push({ k: "confiance", piste: "Pour votre prochaine réponse importante, vérifiez deux affirmations dans une source officielle avant de l'utiliser.", nm: "La confiance et la compétence", txt: "Vous faites confiance aux réponses de l'IAg, mais vous ne vous sentez pas tout à fait capable d'y repérer une erreur.", q: "Qu'est-ce qui vous aiderait à repérer une erreur dans une réponse convaincante?", src: "Lee et al. (2025)", c: "var(--emerald)" });
  const s4 = chosen(p, SIT.s4);
  if ((p.tools || {}).public && s4 && s4.d < 50) out.push({ k: "public", piste: "Pour le travail, privilégiez Copilot Chat avec votre compte UdeS et retirez toute donnée personnelle avant de soumettre un texte.", nm: "Un outil externe et les données", txt: "Vous utilisez un outil externe à l'UdeS, et dans la situation des commentaires d'appréciation, les renseignements personnels n'étaient pas protégés.", q: "Savez-vous ce qu'il advient de ce que vous entrez dans un outil externe à l'UdeS?", src: "Université de Sherbrooke (2024)", c: "var(--copper)" });
  const vg = C.VALUES.filter(v => v.sit && (p.values || {})[v.k]).map(v => ({ v, o: chosen(p, SIT[v.sit]) })).filter(x => x.o && x.o.d < 50);
  if (vg.length) out.push({ k: "valeur", piste: "Nommez ce qui compte pour vous au début de votre requête, puis vérifiez que le résultat le respecte.", nm: "Ce qui compte et ce que je fais", txt: `Vous dites tenir à « ${vg[0].v.nm.toLowerCase()} », mais votre choix dans la situation « ${SIT[vg[0].v.sit].nm} » ne le reflète pas.`, q: "Ce qui compte pour vous se retrouve-t-il dans vos choix?", src: "Miao et Cukurova (2024)", c: "var(--plum)" });
  if (utilite(a) != null && utilite(a) >= 70 && F.emotions != null && F.emotions <= 35) out.push({ k: "ambivalence", piste: "Notez une inquiétude précise et cherchez la règle ou la pratique qui y répond.", nm: "Utile, mais inquiétante", txt: "Vous trouvez l'IAg utile, et elle vous inquiète en même temps.", q: "Qu'est-ce qui vous inquiète dans un outil que vous trouvez utile?", src: "Schepman et Rodway (2020)", c: "var(--plum)" });
  if ((a.p_habitude >= 4 || a.p_social >= 4) && utilite(a) != null && utilite(a) <= 50) out.push({ k: "habitude", piste: "Avant d'ouvrir l'outil, posez-vous la question : quelle valeur ajoutée pour cette tâche et ce but?", nm: "L'habitude plutôt que l'utilité", txt: "Vous l'utilisez par habitude ou parce que d'autres le font, plus que pour ce qu'elle vous apporte.", q: "Pour quelles tâches l'IAg vous apporte-t-elle vraiment quelque chose?", src: "Venkatesh et al. (2012)", c: "var(--forest)" });
  if (a.b_sources >= 4) out.push({ k: "sources", piste: "Demandez toujours les références, puis ouvrez-les et lisez-les avant de les citer.", nm: "Des sources à vérifier", txt: "Vous pensez que l'IAg s'appuie sur des sources fiables. Elle peut pourtant produire des références plausibles qui n'existent pas.", q: "Comment vérifiez-vous les références et les faits qu'elle avance?", src: "Ng et al. (2021)", c: "var(--forest)" });
  if (a.b_neutre >= 4) out.push({ k: "neutre", piste: "Demandez à l'outil d'autres points de vue, puis comparez-les à vos connaissances et à celles des personnes concernées.", nm: "Une neutralité à questionner", txt: "Vous pensez que les réponses de l'IAg sont neutres. Elles reflètent pourtant les biais des données qui ont servi à l'entraîner.", q: "Dans votre travail, quels biais pourraient avoir un effet sur les personnes que vous servez?", src: "Miao et Cukurova (2024)", c: "var(--plum)" });
  if (a.b_comprend >= 4) out.push({ k: "comprend", piste: "Traitez chaque réponse comme un premier jet à valider, jamais comme une explication qui fait autorité.", nm: "Une IA qui « comprend »", txt: "Vous pensez que l'IAg comprend ce qu'elle écrit. Elle prédit plutôt les mots les plus probables.", q: "Si elle prédit des mots plutôt qu'elle ne comprend, comment vérifiez-vous ce qu'elle produit?", src: "Long et Magerko (2020)", c: "var(--forest)" });
  if (F.usages != null && F.usages <= 33 && F.attentes != null && F.attentes >= 70) out.push({ k: "prudence", piste: "Choisissez une tâche sans risque, comme reformuler un texte déjà public, et essayez-la avec une vérification.", nm: "La prudence qui retient", txt: "Vous l'utilisez peu, et vos choix en situation montrent un bon discernement.", q: "Quelle tâche sans risque pourriez-vous essayer, avec des garde-fous?", src: "Parasuraman et Riley (1997)", c: "var(--emerald)" });
  const unk = C.RULES.filter(r => known(p, r) === 0);
  if (unk.length) out.push({ k: "decouvrir", piste: "Prenez dix minutes pour lire les lignes directrices de l'UdeS (voir les références).", nm: unk.length > 1 ? "Des lignes directrices à découvrir" : "Une ligne directrice à découvrir", txt: `Vous ne connaissiez pas « ${unk.map(r => r.nm.toLowerCase()).join(" », « ")} ».`, q: "Laquelle aimeriez-vous mieux comprendre?", src: "Université de Sherbrooke (2024)", c: "var(--gold)" });
  return out.slice(0, 3);
}
function analyse(p) {
  return {
    F: facets(p), tensions: tensions(p), preocc: C.PREOCC.find(x => x.k === p.preocc),
    tasks: C.TASKS.filter(t => (p.tasks || {})[t.k]).map(t => t.nm), tools: C.TOOLS.filter(t => (p.tools || {})[t.k]).map(t => t.nm),
    worries: C.WORRIES.filter(w => (p.worries || {})[w.k]).map(w => w.nm), values: C.VALUES.filter(v => (p.values || {})[v.k]).map(v => v.nm),
    rules: C.RULES.map(r => ({ nm: r.nm, lev: known(p, r) != null ? C.KNOWN[known(p, r)] : "Non précisé" })),
    sits: C.SITUATIONS.map(s => { const o = chosen(p, s); return o ? { nm: s.nm, rule: RULE[s.rule].nm, choix: o.t, lec: o.lec, averti: s.averti } : null; }).filter(Boolean),
    freq: p.u_freq != null ? C.FREQ[p.u_freq] : null
  };
}
/* Les continuums : chaque facette entre ses deux pôles */
function continuumsHTML(F, hot = []) {
  return `<div class="conts">${C.FACETS.map(f => { const v = F[f.k], h = hot.includes(f.k);
    return `<div class="cont${h ? " hot" : ""}"><span class="cn">${esc(f.nm)}</span><div class="ct" role="img" aria-label="${esc(f.nm)} : ${v == null ? "sans réponse" : v + " sur 100, entre « " + f.l + " » et « " + f.r + " »"}">${v == null ? "" : `<span class="cm" style="left:${v}%"></span>`}</div><span class="ce"><span>${esc(f.l)}</span><span>${esc(f.r)}</span></span></div>`; }).join("")}</div>`;
}
function hotFacets(A) { const hot = [];
  A.tensions.forEach(t => ({ confiance: ["croyances", "competence"], sources: ["croyances"], neutre: ["croyances"], regle: ["attentes"], public: ["attentes"], decouvrir: ["attentes"], ambivalence: ["croyances", "emotions"], habitude: ["croyances"], comprend: ["croyances"], valeur: ["valeurs"], prudence: ["usages"] }[t.k] || []).forEach(x => hot.push(x)));
  return [...new Set(hot)]; }
/* Les deux images pour le portrait Word (couleurs et polices écrites en dur) */
function continuumsSVG(F, hot = []) {
  const e = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"), W = 560, H = 26 + C.FACETS.length * 54;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * 3}" height="${H * 3}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#FFFFFF"/><defs><linearGradient id="gd" x1="0" x2="1"><stop offset="0" stop-color="#E9DFEB"/><stop offset=".5" stop-color="#E3F5EA"/><stop offset="1" stop-color="#C9E9D6"/></linearGradient></defs>`;
  C.FACETS.forEach((f, i) => {
    const y = 26 + i * 54, x0 = 150, w = 390, v = F[f.k], h = hot.includes(f.k);
    const ln = splitName(f.nm);
    s += `<text x="0" y="${y + 6 - (ln.length - 1) * 8}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="14" fill="${h ? "#9A6C12" : "#1A221D"}">${ln.map((l, j) => `<tspan x="0" dy="${j ? 17 : 0}">${e(l)}</tspan>`).join("")}</text>`;
    s += `<rect x="${x0}" y="${y - 5}" width="${w}" height="10" rx="5" fill="url(#gd)"/>`;
    s += `<text x="${x0}" y="${y + 24}" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="#6B756F">${e(f.l)}</text><text x="${x0 + w}" y="${y + 24}" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="#6B756F">${e(f.r)}</text>`;
    if (v != null) s += `<circle cx="${x0 + w * v / 100}" cy="${y}" r="10" fill="${h ? "#E5A938" : "#805186"}" stroke="#FFFFFF" stroke-width="3"/>`;
  });
  return s + "</svg>";
}
function svgToPNG(svg, w, h) {
  return new Promise(res => {
    setTimeout(() => res(null), 6000); // si l'image ne se charge jamais, le document se crée sans elle
    const img = new Image(), url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    img.onload = () => { const cv = document.createElement("canvas"); cv.width = w; cv.height = h; cv.getContext("2d").drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url); cv.toBlob(b => b ? b.arrayBuffer().then(x => res({ data: new Uint8Array(x), w, h })) : res(null), "image/png"); };
    img.onerror = () => { URL.revokeObjectURL(url); res(null); };
    img.src = url;
  });
}
async function portraitImages(F, hot) {
  const H = 26 + C.FACETS.length * 54;
  return { silhouette: await svgToPNG(silhouetteSVG(F, hot, { ex: true }), 1920, 1230), continuums: await svgToPNG(continuumsSVG(F, hot), 1680, H * 3) };
}
const ITEM = Object.fromEntries(C.ITEMS.map(x => [x.k, x]));
const lkHead = () => `<div class="lkhead" aria-hidden="true"><span></span>${C.LIKERT.map(l => `<span>${esc(l)}</span>`).join("")}</div>`;
const likertRow = (k, cur) => `<div class="lk" id="lk-${k}" data-item="${k}"><p id="lkt-${k}">${esc(ITEM[k].t)}</p><div class="lks" role="group" aria-labelledby="lkt-${k}">${C.LIKERT.map((l, i) => `<button type="button" class="lkb" data-v="${i + 1}" aria-pressed="${cur === i + 1}" aria-label="${esc(l)}"><span class="dot"></span><span class="lbl">${esc(l)}</span></button>`).join("")}</div></div>`;
const chipSet = (id, list, sel, max) => `<div class="chips" id="${id}" data-max="${max || 99}">${list.map(x => `<button type="button" class="chip" data-k="${x.k}" aria-pressed="${!!(sel || {})[x.k]}">${esc(x.nm)}</button>`).join("")}</div>`;
const fmtDec = x => String(x).replace(".", ",");
const minLeft = i => Math.max(1, Math.round(C.PSCREENS.slice(Math.max(0, i)).reduce((a, s) => a + s.min, 0)));

/* ======================= Vue participante ======================= */
function renderPart() {
  const p = me();
  topbar(`${p.prenom ? `<span class="who">${ico("person")}${esc(p.prenom)}</span>` : ""}<span class="save" id="saveInd" role="status" aria-live="polite"></span>`, "Séance " + ST.code);
  paintSave();
  if (!p.started) return renderWelcome();
  if (!portraitDone(p) || ST.pst != null && ST.pst < POR_I && ST.tab === "portrait") return renderScreens();
  return renderTabs();
}
/* ---------- Bienvenue ---------- */
const MODES = [["presence", "En présence", "groups"], ["distance", "À distance", "device"]];
const MODE_NM = { presence: "En présence", distance: "À distance" };
const modeOf = p => (p && p.mode === "distance") ? "distance" : "presence";
const teamMode = t => ((ST.session && ST.session.teamMode) || {})[t] || null;
const PRINCIPES = [["person", "En individuel", "Vous répondez de façon individuelle, à votre rythme."], ["privacy", "Privé", "Personne d'autre ne voit votre portrait. Le groupe ne voit qu'un portrait général."], ["bulb", "Pas un test", "Ni bonne ni mauvaise réponse. Répondez ce que vous feriez vraiment."]];
function renderWelcome() {
  if (ST.built !== "welcome") {
    ST.built = "welcome";
    $("main").innerHTML = hero(`<h1 class="display"><span class="part">PARTIE 1 |</span> Mon portrait de personne utilisatrice</h1>
        <p class="lead">En ${minLeft(0)} minutes environ, vous faites le point sur votre façon d'utiliser l'IAg aujourd'hui. Vous découvrirez ensuite le portrait général du groupe et votre équipe.</p>`, "welcome-hero") + `<section class="welcome">
      <div class="w-intro">
        <ul class="princ">${PRINCIPES.map(([i, t, d]) => `<li>${ico(i)}<div><b>${t}</b><span>${d}</span></div></li>`).join("")}</ul>
        <ol class="steps-mini">${C.PSCREENS.map((s, k) => `<li><span>${k + 1}</span>${esc(s.nm)}</li>`).join("")}</ol></div>
      <form class="card w-form" id="wForm" novalidate><h2>Avant de commencer</h2>
        <label class="f" id="f-prenom"><span>Votre prénom</span><small>Il sert seulement à former les équipes.</small><input type="text" id="prenom" maxlength="30" autocomplete="given-name"></label>
        <fieldset class="f" id="f-profil"><legend>Votre fonction</legend><div class="seg" id="profil">${C.PROFILS.map(x => `<button type="button" data-v="${esc(x)}">${esc(x)}</button>`).join("")}</div></fieldset>
        <fieldset class="f" id="f-mode"><legend>Vous participez…</legend><small>Les équipes réunissent des personnes qui participent de la même façon.</small><div class="seg mode" id="mode">${MODES.map(([k, nm, ic]) => `<button type="button" data-v="${k}">${ico(ic)}${nm}</button>`).join("")}</div></fieldset>
        <p class="err" id="wErr" role="alert"></p>
        <button class="btn big block" type="submit">Commencer mon portrait ${ico("arrowR")}</button></form></section>`;
    const p0 = me(); $("prenom").value = p0.prenom || "";
    $("prenom").addEventListener("change", e => savePerson({ prenom: e.target.value.trim().slice(0, 30) }));
    $("profil").querySelectorAll("button").forEach(b => b.onclick = () => { savePerson({ profil: b.dataset.v }); paintWelcome(); });
    $("mode").querySelectorAll("button").forEach(b => b.onclick = () => { savePerson({ mode: b.dataset.v }); paintWelcome(); });
    $("wForm").onsubmit = e => {
      e.preventDefault(); const nm = $("prenom").value.trim(), p = me(), miss = [];
      if (!nm) miss.push(["f-prenom", "votre prénom"]); if (!p.profil) miss.push(["f-profil", "votre fonction"]); if (!p.mode) miss.push(["f-mode", "votre façon de participer"]);
      document.querySelectorAll(".w-form .f").forEach(f => f.classList.toggle("missing", miss.some(m => m[0] === f.id)));
      if (miss.length) { $("wErr").textContent = "Il manque " + miss.map(m => m[1]).join(", ").replace(/, ([^,]*)$/, " et $1") + "."; const el = $(miss[0][0]).querySelector("input, button"); if (el) el.focus(); return; }
      savePerson({ prenom: nm.slice(0, 30), started: true }); ST.built = null; ST.pst = 0; render(); window.scrollTo(0, 0);
    };
  }
  paintWelcome();
}
function paintWelcome() { const p = me(); $("profil").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(p.profil === b.dataset.v))); $("mode").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(p.mode === b.dataset.v))); }

/* ---------- Les écrans du portrait ---------- */
function goScreen(i) { ST.pst = Math.max(0, Math.min(C.PSCREENS.length - 1, i)); ST.flagged = false; ST.built = null; if (ST.pst === SIT_I && ST.sitIdx == null) ST.sitIdx = Math.max(0, C.SITUATIONS.findIndex(s => !chosen(me(), s))); render(); window.scrollTo(0, 0); }
function shell(i, title, lead, inner, next) {
  return `<section class="ps" id="ps"><header class="ps-h"><div><span class="eyebrow">Étape ${i + 1} sur ${C.PSCREENS.length}</span><h1>${esc(title)}</h1>${lead ? `<p class="lead">${lead}</p>` : ""}</div><span class="cnt" id="psCount"></span></header>
    <div class="ps-b">${inner}</div>
    <footer class="ps-f"><button type="button" class="btn ghost" id="psPrev">${ico("arrowL")}<span>Précédent</span></button><p class="msg" id="psMsg" role="status" aria-live="polite"></p>${next === false ? "<span></span>" : `<button type="button" class="btn" id="psNext"><span id="psNextL">${next || "Suivant"}</span>${ico("arrowR")}</button>`}</footer></section>`;
}
const SCR = {};
SCR.usages = (p, i) => shell(i, "Mes usages", "Pensez au dernier mois, au travail.", `
    <fieldset class="q" id="q-freq"><legend>Ce mois-ci, j'ai utilisé l'IAg au travail…</legend><div class="scale" id="uFreq">${C.FREQ.map((f, k) => `<button type="button" class="tile sc" data-v="${k}" aria-pressed="${p.u_freq === k}"><span class="lvl" aria-hidden="true">${[1, 2, 3].map(b => `<i class="${b <= k ? "on" : ""}"></i>`).join("")}</span><span class="sct">${esc(f)}</span></button>`).join("")}</div></fieldset>
    <fieldset class="q" id="q-tools"><legend>Avec quels outils? <small>Choisissez « Aucun » si c'est le cas</small></legend>${chipSet("uTools", C.TOOLS, p.tools).replace('class="chips"', 'class="chips boxes"')}</fieldset>
    <fieldset class="q" id="q-tasks"><legend>Pour quelles tâches? <small>Plusieurs choix possibles</small></legend>${chipSet("uTasks", C.TASKS, p.tasks)}<small class="hint" id="tasksOff" hidden>Vous n'avez pas utilisé l'IAg ce mois-ci : vous pouvez passer cette question.</small></fieldset>`);
SCR.pense = (p, i) => shell(i, "Ce que j'en pense", "Indiquez votre degré d'accord avec chaque affirmation.", `<div class="lkgroup"><h2>Ce que l'IAg m'apporte</h2>${lkHead()}${PENSE.slice(0, 5).map(k => likertRow(k, (p.a || {})[k])).join("")}</div>
  <div class="lkgroup"><h2>Ce que je crois ou ce que je sais de son fonctionnement</h2>${lkHead()}${PENSE.slice(5).map(k => likertRow(k, (p.a || {})[k])).join("")}</div>`);
SCR.ressens = (p, i) => shell(i, "Ce que je ressens", "", `<fieldset class="q" id="q-emo"><legend>Face à l'IAg, je ressens surtout…</legend><input type="range" min="0" max="100" step="5" id="emo" class="${p.emo == null ? "untouched" : ""}" aria-label="De l'inquiétude à l'enthousiasme" aria-describedby="emoHint"><span class="ends"><span>De l'inquiétude</span><span>Un mélange</span><span>De l'enthousiasme</span></span><small class="hint" id="emoHint"></small></fieldset>
    <fieldset class="q" id="q-worries"><legend>Ce qui m'inquiète <small>Trois choix au plus</small></legend>${chipSet("worries", C.WORRIES, p.worries, 3)}</fieldset>
    <fieldset class="q" id="q-preocc"><legend>La question qui m'occupe le plus en ce moment</legend><div class="tiles grid3" id="preocc">${C.PREOCC.map(x => `<button type="button" class="tile two-line" data-v="${x.k}" aria-pressed="${p.preocc === x.k}"><b>${esc(x.nm)}</b><span>${esc(x.q)}</span></button>`).join("")}</div></fieldset>`);
SCR.reperes = (p, i) => shell(i, "Ma compétence et mes valeurs", "Indiquez votre degré d'accord, en pensant à votre pratique actuelle.", `<div class="lkgroup"><h2>Ce que je me sens capable de faire</h2>${lkHead()}${REPERES.slice(0, 5).map(k => likertRow(k, (p.a || {})[k])).join("")}</div>
  <div class="lkgroup"><h2>Ce qui compte pour moi</h2>${lkHead()}${REPERES.slice(5).map(k => likertRow(k, (p.a || {})[k])).join("")}</div>
  <fieldset class="q" id="q-values"><legend>Ce qui compte le plus quand j'utilise l'IAg <small>Deux choix au plus</small></legend>${chipSet("values", C.VALUES, p.values, 2)}</fieldset>`);
SCR.situations = (p, i) => {
  const k = ST.sitIdx || 0, s = C.SITUATIONS[k], cur = chosen(p, s), last = k === C.SITUATIONS.length - 1;
  return shell(i, "Quatre situations", "Répondez ce que vous feriez vraiment, un jour chargé, pas ce qu'il faudrait faire.", `
    <div class="sitbar"><span class="eyebrow">Situation ${k + 1} sur ${C.SITUATIONS.length}</span><span class="sitdots">${C.SITUATIONS.map((x, j) => `<button type="button" class="sd${j === k ? " cur" : ""}${chosen(p, x) ? " done" : ""}" data-k="${j}" aria-label="Situation ${j + 1}${chosen(p, x) ? " (faite)" : ""}" ${chosen(p, x) || j === k || j <= C.SITUATIONS.findIndex(y => !chosen(p, y)) ? "" : "disabled"}></button>`).join("")}</span></div>
    <section class="sitcard q" id="sitB"><h2>${esc(s.nm)}</h2><p class="sittext">${esc(s.t)}</p>
      <p class="qq" id="sitQ">Que feriez-vous?</p><div class="opts" role="group" aria-labelledby="sitQ" id="sitOpts">${optOrder(s, ST.me).map(o => `<button type="button" class="tile opt" data-o="${o.k}" aria-pressed="${!!cur && cur.k === o.k}">${esc(o.t)}</button>`).join("")}</div></section>`,
    last ? "Voir mon portrait" : "Situation suivante");
};
SCR.portrait = (p, i) => {
  const A = analyse(p), hot = hotFacets(A);

  return shell(i, "Mon portrait", "Une photo du moment, pas une étiquette.", `<div class="pt-top">
    <figure class="sil-wrap">${silhouetteSVG(A.F, hot, { still: !!ST.bloomed })}<figcaption>La forme est unique à chaque personne : il n'y a pas de bonne forme. Plus un point s'éloigne du centre, plus vous êtes près de la fin du continuum.${hot.length ? ' <span class="hotkey">Point or : facette liée à une tension.</span>' : ""}</figcaption></figure>
    <section class="tcol"><h2>${A.tensions.length ? (A.tensions.length > 1 ? A.tensions.length + " tensions à explorer" : "Une tension à explorer") : "Aucune tension marquée"}</h2>
      ${A.tensions.length ? `<div class="tens">${A.tensions.map(t => `<div class="ten" style="--tc:${t.c}"><b>${esc(t.nm)}</b><p>${esc(t.txt)}</p><p class="tq">${esc(t.q)}</p>${t.piste ? `<p class="tp"><b>Piste :</b> ${esc(t.piste)}</p>` : ""}</div>`).join("")}</div>` : "<p>Vos réponses sont cohérentes entre elles. Pour quelle tâche votre posture serait-elle différente?</p>"}
      ${A.preocc ? `<p class="pre"><b>Ce qui vous occupe : ${esc(A.preocc.nm.toLowerCase())}.</b> ${esc(A.preocc.note)}</p>` : ""}</section></div>
    <section class="cwrap" aria-labelledby="cwT"><h2 id="cwT">Mes six facettes, une à une</h2><p class="note">Chaque ligne va d'un pôle à l'autre. Aucun des deux n'est meilleur.</p>${continuumsHTML(A.F, hot)}</section>
    <section class="reveal" id="reveal"><div class="rv-h">${ico("udes")}<div><p class="kicker">Ce que les quatre situations avaient en commun</p><h2>Les lignes directrices de l'UdeS</h2>
      <p>Chaque situation correspondait à une des quatre lignes directrices de l'Université de Sherbrooke pour l'IA générative. Pour chacune, dites si vous la connaissiez.</p></div></div>
      <div class="rv">${C.RULES.map((r, ri) => { const s = SIT[r.sit], o = chosen(p, s), kv = known(p, r);
        return `<article class="rvc" id="rv-${r.k}"><div class="rvt"><span class="no">${ri + 1}</span><div><b>${esc(r.nm)}</b><span>${esc(r.d)}</span></div></div>
          <div class="rvq"><span id="rq-${r.k}">La connaissiez-vous?</span><div class="seg small" role="group" aria-labelledby="rq-${r.k}" data-rule="${r.k}">${C.KNOWN.map((l, v) => `<button type="button" data-v="${v}" aria-pressed="${kv === v}">${l}</button>`).join("")}</div></div>
          ${o ? `<details><summary>Dans la situation « ${esc(s.nm)} », vous avez choisi : <b>${esc(o.t)}</b></summary><p>${esc(o.lec)}</p><p class="averti"><b>Piste d'usage averti.</b> ${esc(s.averti)}</p></details>` : ""}</article>`; }).join("")}</div>
      <p class="src">Université de Sherbrooke (2024). <a href="https://www.usherbrooke.ca/decouvrir/fileadmin/sites/decouvrir/documents/IA-regles-bonnes-pratiques.pdf" target="_blank" rel="noopener">Lignes directrices pour l'utilisation de l'intelligence artificielle générative</a>.</p></section>
    <section class="card flat keep">      <div class="row"><button class="btn" id="dlPortrait" type="button">${ico("download")}<span>Télécharger mon portrait (Word)</span></button><button class="btn ghost" id="toGroup" type="button">Voir le groupe et mon équipe ${ico("arrowR")}</button></div></section>`, false);
};
function helpHTML(s) {
  return `<aside class="phelp" id="phelp"><button type="button" class="helpbtn" id="helpBtn" aria-controls="phbody"></button>
    <div class="ph-b" id="phbody"><h2>Ce que vous faites ici</h2><p>${esc(s.quoi)}</p><h2>Comment répondre</h2><ul>${s.comment.map(c => `<li>${esc(c)}</li>`).join("")}</ul><h2>Pourquoi?</h2><p>${esc(s.pourquoi)}</p>
      <p class="ph-safe">${ico("lock")}<span>Votre portrait est privé. Vos réponses s'enregistrent toutes seules : vous pouvez revenir en arrière à tout moment.</span></p></div></aside>`;
}
const narrow = () => window.innerWidth < 980;
const onPortrait = () => ST.pst === POR_I;
function helpOpen() { if (narrow()) return !!ST.helpN; return onPortrait() ? !!ST.helpP : !ls.get("ep-aide-off", false); }
function toggleHelp() { if (narrow()) ST.helpN = !ST.helpN; else if (onPortrait()) ST.helpP = !ST.helpP; else ls.set("ep-aide-off", !ls.get("ep-aide-off", false)); paintHelp(); }
function paintHelp() {
  const a = $("phelp"); if (!a) return; const on = helpOpen();
  a.classList.toggle("open", on); $("pmain").classList.toggle("helpoff", !on);
  $("helpBtn").setAttribute("aria-expanded", String(on)); $("helpBtn").innerHTML = on ? `${ico("close")}<span>Masquer l'aide</span>` : `${ico("help")}<span>Aide</span>`;
}
function stepperHTML(p) {
  return `<nav class="stepper" aria-label="Étapes du portrait"><ol>${C.PSCREENS.map((s, i) => { const d = screenDone(p, i), on = i === ST.pst, ok = canOpen(p, i);
    return `<li class="${on ? "on" : ""}${d ? " done" : ""}"><button type="button" data-i="${i}" ${ok ? "" : "disabled"} ${on ? 'aria-current="step"' : ""} aria-label="Étape ${i + 1} : ${esc(s.nm)}${d ? " (faite)" : ""}"><span class="dot">${d && !on ? IC.check || "✓" : i + 1}</span><span class="lb">${esc(s.nm)}</span></button></li>`; }).join("")}</ol>
    <span class="left">${ico("timer")}Encore ${minLeft(ST.pst)} min environ</span></nav>`;
}
function renderScreens() {
  const p = me();
  if (ST.pst == null) ST.pst = firstOpen(p);
  if (!canOpen(p, ST.pst)) ST.pst = firstOpen(p);
  if (ST.pst === SIT_I && ST.sitIdx == null) ST.sitIdx = Math.max(0, C.SITUATIONS.findIndex(s => !chosen(p, s)));
  const k = C.PSCREENS[ST.pst].k, key = "p:" + k + ":" + (k === "situations" ? ST.sitIdx : "");
  if (ST.built !== key) {
    ST.built = key;
    $("main").innerHTML = `<div class="pp">${stepperHTML(p)}<div class="pp-main" id="pmain">${SCR[k](p, ST.pst)}${helpHTML(C.PSCREENS[ST.pst])}</div></div>`;
    $("main").querySelectorAll(".stepper [data-i]").forEach(b => b.onclick = () => { if (+b.dataset.i === SIT_I) ST.sitIdx = null; ST.tab = "portrait"; goScreen(+b.dataset.i); });
    bindScreen(k); $("helpBtn").onclick = toggleHelp; paintHelp();
    if (!reduced()) $("ps").classList.add("enter");
  }
  paintScreen(k);
}
function bindScreen(k) {
  const ps = $("ps");
  $("psPrev").onclick = () => { if (k === "situations" && ST.sitIdx > 0) { ST.sitIdx--; ST.built = null; ST.flagged = false; render(); } else if (ST.pst > 0) goScreen(ST.pst - 1); else { savePerson({ started: false }); ST.built = null; render(); } };
  if ($("psNext")) $("psNext").onclick = () => {
    const p = me(), req = REQ[k](p);
    if (req.some(x => !x.ok)) { ST.flagged = true; paintScreen(k); const first = $(req.find(x => !x.ok).id); if (first) { first.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" }); const b = first.querySelector("button:not([disabled]), input"); if (b) b.focus({ preventScroll: true }); } return; }
    if (k === "situations") { const nx = C.SITUATIONS.findIndex((x, j) => j > ST.sitIdx && !chosen(p, x)), any = C.SITUATIONS.findIndex(x => !chosen(p, x));
      if (nx >= 0 || any >= 0) { ST.sitIdx = nx >= 0 ? nx : any; ST.built = null; ST.flagged = false; render(); window.scrollTo(0, 0); return; } }
    goScreen(ST.pst + 1);
  };
  ps.querySelectorAll(".lk").forEach(row => row.querySelectorAll(".lkb").forEach(b => b.onclick = () => { savePerson({ a: { [row.dataset.item]: +b.dataset.v } }); row.querySelectorAll(".lkb").forEach(x => x.setAttribute("aria-pressed", String(x === b))); paintScreen(k); }));
  const LISTS = { tasks: C.TASKS, tools: C.TOOLS, worries: C.WORRIES, values: C.VALUES };
  const multi = (id, field, exclusive) => { const el = $(id); if (!el) return; el.querySelectorAll(".chip").forEach(b => b.onclick = () => {
    let cur = { ...(me()[field] || {}) }; const kk = b.dataset.k, max = +el.dataset.max;
    if (exclusive && kk === exclusive) cur = cur[kk] ? {} : { [kk]: true };
    else { if (exclusive) delete cur[exclusive]; if (cur[kk]) delete cur[kk]; else { if (nOn(cur) >= max) { toast(`${max === 3 ? "Trois" : "Deux"} choix au plus. Retirez-en un d'abord.`); return; } cur[kk] = true; } }
    savePerson({ [field]: Object.fromEntries(LISTS[field].map(x => [x.k, cur[x.k] ? true : ST.store.DEL])) });
    el.querySelectorAll(".chip").forEach(x => x.setAttribute("aria-pressed", String(!!cur[x.dataset.k]))); paintScreen(k);
  }); };
  if (k === "usages") { $("uFreq").querySelectorAll(".tile").forEach(t => t.onclick = () => { savePerson({ u_freq: +t.dataset.v }); paintScreen(k); }); multi("uTasks", "tasks"); multi("uTools", "tools", "aucun"); }
  if (k === "ressens") {
    const e = $("emo"); e.value = me().emo == null ? 50 : me().emo;
    const set = () => { e.classList.remove("untouched"); ST.people[ST.me] = { ...me(), emo: +e.value }; paintScreen(k); };
    e.addEventListener("input", set); e.addEventListener("change", () => { set(); savePerson({ emo: +e.value }); });
    multi("worries", "worries", "rien"); $("preocc").querySelectorAll(".tile").forEach(t => t.onclick = () => { savePerson({ preocc: t.dataset.v }); paintScreen(k); });
  }
  if (k === "reperes") multi("values", "values");
  if (k === "situations") {
    const s = C.SITUATIONS[ST.sitIdx || 0];
    $("sitOpts").querySelectorAll("[data-o]").forEach(t => t.onclick = () => { savePerson({ sit: { [s.id]: t.dataset.o } }); $("sitOpts").querySelectorAll("[data-o]").forEach(x => x.setAttribute("aria-pressed", String(x === t))); paintScreen(k); });
    ps.querySelectorAll(".sitdots [data-k]").forEach(d => d.onclick = () => { ST.sitIdx = +d.dataset.k; ST.built = null; ST.flagged = false; render(); });
  }
  if (k === "portrait") bindPortrait();
}
function bindPortrait() {
  setTimeout(() => { ST.bloomed = true; }, 50);
  if (!me().seenPortrait) savePerson({ seenPortrait: true });
  document.querySelectorAll(".rvq .seg").forEach(g => g.querySelectorAll("button").forEach(b => b.onclick = () => {
    savePerson({ known: { [g.dataset.rule]: +b.dataset.v } }); g.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); ST.built = null; ST.keepScroll = window.scrollY; render();
  }));
  $("dlPortrait").onclick = () => busy($("dlPortrait"), "Création du document…", async () => { const pp = me(); const A = analyse(pp); await DOCS.portrait(pp, A, await portraitImages(A.F, hotFacets(A))); }, () => savePerson({ dlPortrait: true }));
  if ($("toGroup")) $("toGroup").onclick = () => { ST.tab = "groupe"; ST.pst = POR_I; ST.built = null; render(); window.scrollTo(0, 0); };
  if (ST.keepScroll != null) { const y = ST.keepScroll; ST.keepScroll = null; requestAnimationFrame(() => window.scrollTo(0, y)); }
}
function paintScreen(k) {
  const p = me();
  if (k === "portrait") return;
  const req = REQ[k](p), ok = req.filter(x => x.ok).length, all = ok === req.length;
  req.forEach(x => { const e = $(x.id); if (e) e.classList.toggle("missing", ST.flagged && !x.ok); });
  const cnt = $("psCount");
  if (k === "situations") { const d = C.SITUATIONS.filter(s => chosen(p, s)).length; cnt.textContent = `${d} sur ${C.SITUATIONS.length}`; cnt.classList.toggle("ok", d === C.SITUATIONS.length); }
  else { cnt.textContent = `${ok} sur ${req.length}`; cnt.classList.toggle("ok", all); }
  cnt.setAttribute("aria-label", k === "situations" ? "Situations faites" : "Réponses données");
  const msg = $("psMsg");
  if (ST.flagged && !all) { msg.className = "msg warn"; msg.innerHTML = `${ico("info")}<span>${esc(missingText(req))} C'est surligné.</span>`; }
  else if (all) { msg.className = "msg ok"; msg.innerHTML = `${ico("check")}<span>${k === "situations" ? "Choix enregistré." : "Tout est rempli."}</span>`; }
  else { msg.className = "msg"; msg.innerHTML = ""; }
  if (k === "usages") { $("q-tasks").classList.toggle("off", p.u_freq === 0); $("tasksOff").hidden = p.u_freq !== 0; $("uFreq").querySelectorAll(".tile").forEach(t => t.setAttribute("aria-pressed", String(p.u_freq === +t.dataset.v))); }
  if (k === "ressens") { $("preocc").querySelectorAll(".tile").forEach(t => t.setAttribute("aria-pressed", String(p.preocc === t.dataset.v))); const v = p.emo; $("emoHint").textContent = v == null ? "Glissez le curseur ou utilisez les flèches du clavier." : v <= 30 ? "Surtout de l'inquiétude." : v >= 70 ? "Surtout de l'enthousiasme." : "Un mélange des deux."; }
}
function paintSave() {
  const el = $("saveInd"); if (!el) return;
  const h = ST.saving ? `<span class="spin"></span><span>Enregistrement…</span>` : ST.savedAt ? `${ico("save")}<span>Enregistré</span>` : "";
  if (el.dataset.h !== h) { el.dataset.h = h; el.innerHTML = h; }
}

/* ---------- Après le portrait : trois onglets ---------- */
function renderTabs() {
  const p = me(), pub = ST.session.pub || {}, t = teamOf(ST.me);
  const groupReady = !!(ST.session.showGroup && pub.ready), teamReady = !!t;
  const tabs = [["portrait", "Mon portrait", "person", true], ["groupe", "Le groupe", "chart", groupReady], ["equipe", "Mon équipe", "users", teamReady]];
  if (!["portrait", "groupe", "equipe"].includes(ST.tab)) ST.tab = "portrait";
  const seen = ls.get("ep-seen-" + ST.code, {}), fresh = { groupe: groupReady && !seen.groupe, equipe: teamReady && !seen.equipe };
  if (ST.tab !== "portrait" && (ST.tab === "groupe" ? groupReady : teamReady) && !seen[ST.tab]) { seen[ST.tab] = true; ls.set("ep-seen-" + ST.code, seen); fresh[ST.tab] = false; }
  const key = "t:" + ST.tab + ":" + groupReady + ":" + teamReady + ":" + (ST.tab === "groupe" ? JSON.stringify(pub) : ST.tab === "equipe" ? t + JSON.stringify(pub.roster || {}) : "") + ":" + fresh.groupe + fresh.equipe;
  if (ST.tab === "portrait") {
    if (!(ST.built || "").startsWith("p:portrait")) { ST.pst = POR_I; ST.built = null; }
    $("main").dataset.tabs = "1";
    renderScreensWithTabs(tabs, fresh); return;
  }
  if (ST.built === key) return;
  ST.built = key;
  const body = ST.tab === "groupe" ? (groupReady ? groupHTML(pub) : `<div class="empty">${ico("hourglass")}<p>Le portrait du groupe apparaîtra quand l'animation le partagera.</p></div>`)
    : (teamReady ? teamHTML(t, pub) : `<div class="empty">${ico("hourglass")}<p>Votre équipe apparaîtra ici quand l'animation formera les équipes.</p></div>`);
  $("main").innerHTML = tabsHTML(tabs, fresh) + `<div class="tabbody">${body}</div>`;
  bindTabs();
}
function tabsHTML(tabs, fresh) {
  return `<nav class="tabs" role="tablist" aria-label="Sections">${tabs.map(([k, nm, ic, ok]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${ST.tab === k}" class="${ok ? "" : "wait"}">${ico(ic)}<span>${nm}</span>${fresh[k] ? '<i class="new">Nouveau</i>' : ok ? "" : '<small>Bientôt</small>'}</button>`).join("")}</nav>`;
}
function bindTabs() { $("main").querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { ST.tab = b.dataset.tab; ST.built = null; render(); window.scrollTo(0, 0); }); }
function renderScreensWithTabs(tabs, fresh) {
  const p = me(), key = "p:portrait:tabs:" + JSON.stringify(p.known || {}) + fresh.groupe + fresh.equipe;
  if (ST.built !== key) {
    ST.built = key;
    $("main").innerHTML = tabsHTML(tabs, fresh) + `<div class="pp"><div class="pp-main helpoff" id="pmain">${SCR.portrait(p, POR_I)}${helpHTML(C.PSCREENS[POR_I])}</div></div>`;
    bindTabs(); $("psPrev").onclick = () => { ST.tab = "portrait"; goScreen(SIT_I); }; $("helpBtn").onclick = toggleHelp; paintHelp(); bindPortrait();
  }
}

/* ======================= Portrait général du groupe ======================= */
/* Les données publiées sont des comptes par zone (bas, milieu, haut), jamais des réponses individuelles,
   et seulement quand au moins 5 portraits sont terminés. */
const ZONE = v => v == null ? null : v < 34 ? 0 : v < 67 ? 1 : 2;
function groupHTML(pub) {
  const n = pub.n;
  const facetRows = C.FACETS.map(f => {
    const z = pub.zones[f.k] || [0, 0, 0], tot = z.reduce((a, b) => a + b, 0) || 1;
    const dom = z.indexOf(Math.max(...z)), share = z[dom] / tot;
    const lab = [f.l, "entre les deux", f.r];
    const sum = share >= 0.6 ? `Surtout « ${lab[dom]} »` : "Le groupe est partagé";
    return `<div class="gz"><div class="gz-h"><b>${esc(f.nm)}</b><span>${esc(sum)}</span></div>
      <div class="zbar" role="img" aria-label="${esc(f.nm)} : ${lab.map((l, i) => l + " " + pct(z[i], tot) + " %").join(", ")}">${z.map((c, i) => `<span class="z z${i}" style="flex:${Math.max(c, 0.0001)}">${pct(c, tot) >= 12 ? pct(c, tot) + " %" : ""}</span>`).join("")}</div>
      <div class="gz-e"><span>${esc(f.l)}</span><span>${esc(f.r)}</span></div></div>`;
  }).join("");
  const top = (counts, list, lim = 3) => Object.entries(counts || {}).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]).slice(0, lim).map(([k, c]) => { const x = list.find(y => y.k === k); return x ? `<div class="hrow"><span>${esc(x.nm)}</span><div class="hb"><i style="width:${pct(c, n)}%"></i></div><b>${pct(c, n)} %</b></div>` : ""; }).join("") || '<p class="note">Rien à signaler.</p>';
  const rules = C.RULES.map((r, i) => { const k = (pub.known || {})[r.k] || [0, 0, 0], kt = k.reduce((a, b) => a + b, 0), al = (pub.aligned || {})[r.k] || 0;
    return `<div class="gr"><div class="gr-h"><span class="no">${i + 1}</span><b>${esc(r.nm)}</b></div>
      <div class="kbar" role="img" aria-label="La connaissaient : oui ${pct(k[2], kt)} %, vaguement ${pct(k[1], kt)} %, non ${pct(k[0], kt)} %">${[2, 1, 0].map(v => `<span class="k k${v}" style="flex:${Math.max(k[v], 0.0001)}">${pct(k[v], kt) >= 15 ? pct(k[v], kt) + " %" : ""}</span>`).join("")}</div>
      <p class="note">En situation, ${pct(al, n)} % des choix ont suivi la piste d'usage averti.</p></div>`; }).join("");
  return `<section class="group"><header class="panel-dark">${ringsSVG()}<div><p class="kicker">Le portrait de notre groupe</p><h1 class="display sm">Où en sommes-nous, ensemble?</h1>
      <p class="lead">Un portrait général, à partir de ${n} portraits. Aucune réponse individuelle n'est affichée.</p></div></header>
    <div class="g-two"><section class="card"><h2>Ce qui nous occupe</h2>${top(pub.preocc, C.PREOCC)}</section>
      <section class="card"><h2>Ce qui nous inquiète</h2>${top(pub.worries, C.WORRIES.filter(w => w.k !== "rien"))}</section></div>
    <section class="card"><h2>Nos six facettes</h2><p class="note">Part du groupe dans chaque zone du continuum.</p><div class="gzs">${facetRows}</div>
        <p class="zleg"><span><i class="z0"></i>Début du continuum</span><span><i class="z1"></i>Entre les deux</span><span><i class="z2"></i>Fin du continuum</span></p></section>
    <section class="card"><h2>Les lignes directrices de l'UdeS</h2><p class="kleg"><span><i class="k2"></i>Je la connaissais</span><span><i class="k1"></i>Vaguement</span><span><i class="k0"></i>Non</span></p><div class="grs">${rules}</div></section>
    <section class="card discuss">${ico("forum")}<div><h2>Pour la discussion</h2><p>Qu'est-ce qui vous surprend dans ce portrait? Où vous reconnaissez-vous, où pas du tout?</p></div></section></section>`;
}
function teamHTML(t, pub) {
  const r = (pub.roster || {})[t] || [], col = TEAM[t] ? TEAM[t].c : "var(--plum)", myName = me().prenom || "", dist = (teamMode(t) || modeOf(me())) === "distance";
  return `<section class="team-view"><div class="myteam" style="--tc:${col}">${ringsSVG()}<span>Votre équipe, ${dist ? "à distance" : "en présence"}</span><b>Équipe ${esc(tName(t))}</b>
      <ul>${r.map(nm => `<li>${esc(nm)}${nm === myName ? " <small>(vous)</small>" : ""}</li>`).join("")}</ul></div>
    <section class="card"><h2>Pourquoi cette équipe?</h2><p>L'outil a réuni des personnes aux fonctions, aux usages et aux points de vue différents. Rien n'indique qui pense quoi : à vous d'en parler si vous le souhaitez.</p>
      <h2>Pour commencer</h2><p>${dist ? "Retrouvez les membres de votre équipe dans l'espace virtuel indiqué par l'animation (par exemple, une salle de sous-groupe Teams)." : "Retrouvez les membres de votre équipe dans la salle."}</p></section></section>`;
}

/* ======================= Vue de l'animation ======================= */
function adminList() { return ls.get("ep-admin-sessions", []); }
function renderAdminHome() {
  topbar(`<span class="role">Animation</span>`, "Animation");
  const list = adminList();
  $("main").innerHTML = hero(`<div class="land-l"><p class="kicker">Animation</p><h1 class="display"><span class="part">PARTIE 1 |</span> Mon portrait de personne utilisatrice</h1><p class="lead">Créez une séance, puis donnez aux personnes participantes le lien ou le code. Gardez cet onglet ouvert pendant l'exercice : c'est lui qui calcule le portrait du groupe et les équipes.</p></div>
    <div class="card join"><h2>Nouvelle séance</h2><button class="btn big block" id="createBtn" type="button">${ico("play")}<span>Créer une séance</span></button>
      ${ST.store.kind === "demo" ? `<p class="note">${IN_PREVIEW ? "Aperçu : les appareils de la salle ne peuvent pas rejoindre cet aperçu. Utilisez les participants fictifs pour vous exercer." : (window.FIREBASE_ERROR ? "Connexion à Firebase impossible. " + window.FIREBASE_ERROR + " " : "") + "Mode démonstration : la séance n'est accessible que dans ce navigateur. Pour la salle, configurez Firebase (voir le guide)."}</p>` : ""}
      ${list.length ? `<h2 class="sub">Mes séances récentes</h2><ul class="recent">${list.slice(0, 5).map(x => `<li><a href="#animer/${esc(x.code)}"><b>${esc(x.code)}</b><span>${new Date(x.at).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" })}</span></a></li>`).join("")}</ul>` : ""}</div>`, "hero-land");
  $("createBtn").onclick = async () => {
    const code = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[b % 31]).join("");
    await ST.store.merge(`sessions/${code}`, { owner: ST.me, created: Date.now(), showGroup: false, teams: [], assign: {} });
    ls.set("ep-admin-sessions", [{ code, at: Date.now() }, ...adminList().filter(x => x.code !== code)].slice(0, 12));
    location.hash = "animer/" + code;
  };
}
const joinURL = () => location.href.split("#")[0] + "#" + ST.code;
function renderAdmin() {
  if (ST.session.owner !== ST.me) {
    $("main").innerHTML = `<section class="card narrow center-card"><h1>Accès réservé</h1><p>Cette séance a été créée dans un autre navigateur. Seul le navigateur qui l'a créée peut l'animer.</p><a class="btn ghost" href="#animer">Retour</a></section>`; return;
  }
  topbar(`<span class="role">Animation</span><span class="codechip">${esc(ST.code)}</span>`, "Animation, séance " + ST.code);
  if (ST.built !== "admin") {
    ST.built = "admin";
    $("main").innerHTML = `<section class="adm">
      <section class="invite panel-dark">${ringsSVG()}<div class="inv-t"><p class="kicker">Code de la séance</p><h1 class="code">${esc(ST.code)}</h1>
          <p>Les personnes participantes vont à l'adresse ci-dessous, ou balaient le code QR. L'adresse de l'animation n'est jamais affichée de leur côté.</p>
          <div class="linkrow"><input type="text" readonly value="${esc(joinURL())}" aria-label="Lien pour les participants" id="joinLink"><button class="btn ghost" id="copyLink" type="button">${ico("copy")}<span>Copier</span></button></div>
          <a class="btn ghost small" href="${esc(joinURL())}" target="_blank" rel="noopener">${ico("open")}<span>Ouvrir la vue participante</span></a></div>
        <div class="qr" id="qr" aria-label="Code QR du lien de la séance"></div></section>
      <section class="card"><h2>${ico("users")}Avancement</h2><div class="kpis"><div><b id="k-in">0</b><span id="k-in-l">personnes</span></div><div><b id="k-done">0</b><span>portraits terminés</span></div><div><b id="k-team">0</b><span>dans une équipe</span></div></div><p class="note" id="k-mode"></p><div id="funnel"></div></section>
      <section class="card"><div class="row between"><h2>${ico("chart")}Portrait du groupe</h2><label class="switch"><input type="checkbox" id="showGroup"><span>Visible par les participants</span></label></div><div id="gstat"></div></section>
      <section class="card wide"><div class="row between"><h2>${ico("group")}Les équipes</h2><div class="tctl"><label>Équipes de <select id="tsize"><option>3</option><option selected>4</option><option>5</option><option>6</option></select> personnes</label>
          <button class="btn" id="formBtn" type="button">${ico("shuffle")}<span id="formL">Former les équipes</span></button><button class="btn ghost" id="dlTeams" type="button" hidden>${ico("download")}<span>Liste en Word</span></button></div></div>
        <p class="note">Les personnes en présence et à distance sont réparties séparément, sans jamais être mélangées. Dans chaque groupe, l'outil mélange les fonctions, les niveaux d'usage et les niveaux de confiance; ces informations ne sont jamais affichées, seulement les prénoms. Les équipes apparaissent aussitôt sur l'appareil des personnes.</p>
        <div id="teams"></div><p class="note" id="moveHelp"></p></section>
      <details class="card wide sim"><summary><h2>${ico("science")}S'exercer avec des participants fictifs</h2></summary><p class="note">Ajoutez des participants fictifs : ils remplissent leur portrait peu à peu, ce qui vous permet de voir l'avancement, le portrait du groupe et la formation des équipes.</p>
        <div class="row"><button class="btn ghost" id="simAdd" type="button">Ajouter 8 participants fictifs</button><button class="btn ghost" id="simDel" type="button">Retirer les participants fictifs</button><span class="note" id="simCount"></span></div></details>
      <details class="card wide danger"><summary><h2>${ico("delete")}Fin de séance</h2></summary><p class="note">Les portraits Word restent sur les appareils des personnes. Effacez ensuite toutes les données de la séance : les fiches, le portrait du groupe et les équipes.</p>
        <div class="row"><button class="btn danger" id="wipe1" type="button">Effacer les données de la séance</button><button class="btn danger solid" id="wipe2" type="button" hidden>Confirmer l'effacement définitif</button></div></details></section>`;
    try { if (window.qrcode) { const q = qrcode(0, "M"); q.addData(joinURL()); q.make(); $("qr").innerHTML = q.createSvgTag({ cellSize: 5, margin: 1, scalable: true }); } } catch (e) {}
    if (!$("qr").innerHTML) { $("qr").hidden = true; $("qr").parentElement.classList.add("noqr"); }
    $("copyLink").onclick = () => copyText(joinURL());
    $("showGroup").onchange = e => write(P(""), { showGroup: e.target.checked });
    $("formBtn").onclick = () => { if (allTeams().length && !ST.reform) { ST.reform = true; $("formL").textContent = "Confirmer : tout reformer"; setTimeout(() => { ST.reform = false; paintAdmin(); }, 4000); return; } ST.reform = false; formTeams(+$("tsize").value || 4); };
    $("dlTeams").onclick = () => busy($("dlTeams"), "…", () => DOCS.teams(allTeams().map(t => ({ nm: tName(t), mode: MODE_NM[teamMode(t) || "presence"], m: members(t).map(([, p]) => p.prenom || "Sans prénom") })), ST.code));
    $("simAdd").onclick = () => simAdd(8); $("simDel").onclick = simDel;
    $("wipe1").onclick = () => { $("wipe2").hidden = false; $("wipe2").focus(); }; $("wipe2").onclick = wipe;
  }
  paintAdmin(); publish();
}
function paintAdmin() {
  const ppl = people().map(([, p]) => p), n = ppl.length, done = ppl.filter(portraitDone).length;
  $("k-in").textContent = n; $("k-mode").textContent = n ? `${ppl.filter(p => p.mode === "presence").length} en présence et ${ppl.filter(p => p.mode === "distance").length} à distance.` : ""; $("k-done").textContent = done; $("k-team").textContent = people().filter(([id]) => teamOf(id)).length;
  const rows = [["Ont commencé", ppl.filter(p => p.started).length], ...C.PSCREENS.slice(0, POR_I).map((s, i) => [s.nm, ppl.filter(p => screenDone(p, i)).length]), ["Ont lu leur portrait", ppl.filter(p => p.seenPortrait).length]];
  const fh = `<div class="funnel">${rows.map(([nm, c]) => `<div class="hrow"><span>${esc(nm)}</span><div class="hb"><i style="width:${pct(c, Math.max(1, n))}%"></i></div><b>${c}</b></div>`).join("")}</div>`;
  if ($("funnel").dataset.h !== fh) { $("funnel").dataset.h = fh; $("funnel").innerHTML = fh; }
  $("showGroup").checked = !!ST.session.showGroup;
  const pub = ST.session.pub || {};
  const gs = pub.ready ? `<p>${pub.n} portraits terminés. ${ST.session.showGroup ? "Les participants voient le portrait du groupe dans l'onglet « Le groupe »." : "Activez l'interrupteur pour le montrer aux participants."}</p><details class="gprev"><summary>Aperçu du portrait du groupe</summary>${groupHTML(pub, null)}</details>`
    : `<p class="note">Le portrait du groupe sera prêt quand au moins ${MIN_GROUP} portraits seront terminés (${done} pour l'instant). Ce seuil évite qu'on puisse reconnaître une personne.</p>`;
  if ($("gstat").dataset.h !== gs) { const open = $("gstat").querySelector("details[open]"); $("gstat").dataset.h = gs; $("gstat").innerHTML = gs; if (open && $("gstat").querySelector("details")) $("gstat").querySelector("details").open = true; }
  const has = allTeams().length;
  if (!ST.reform) $("formL").textContent = has ? "Reformer les équipes" : "Former les équipes";
  $("dlTeams").hidden = !has;
  const th = teamsAdminHTML();
  if ($("teams").dataset.h !== th) { $("teams").dataset.h = th; $("teams").innerHTML = th;
    $("teams").querySelectorAll(".mem").forEach(b => b.onclick = () => { ST.moveSel = ST.moveSel === b.dataset.id ? null : b.dataset.id; paintAdmin(); });
    $("teams").querySelectorAll("[data-to]").forEach(b => b.onclick = () => moveTo(ST.moveSel, b.dataset.to)); }
  const wait = people().filter(([id, p]) => p.started && !teamOf(id)).length;
  $("moveHelp").textContent = has ? (ST.moveSel ? "Choisissez l'équipe de destination, ou cliquez de nouveau sur le prénom pour annuler." : `Pour déplacer une personne, cliquez sur son prénom.${wait ? ` ${wait} personne(s) arrivée(s) après la formation : cliquez sur leur prénom dans « Sans équipe » pour les placer.` : ""}`) : "";
  const nsim = people().filter(([, p]) => p.sim).length; $("simCount").textContent = nsim ? nsim + " participant(s) fictif(s)." : ""; $("simDel").disabled = !nsim;
}
function teamsAdminHTML() {
  const ts = allTeams(), sel = ST.moveSel;
  const cnt = m => people().filter(([, p]) => p.started && modeOf(p) === m).length;
  if (!ts.length) return `<div class="empty">${people().length < 2 ? "Il faut au moins deux personnes dans la séance pour former des équipes." : `${cnt("presence")} personne(s) en présence et ${cnt("distance")} à distance. Choisissez la taille des équipes, puis cliquez sur « Former les équipes ». Les deux groupes ne sont jamais mélangés.`}</div>`;
  const card = (t, list, nm, col) => `<div class="tcard${sel && teamOf(sel) !== t && t ? " target" : ""}" style="--tc:${col}"><div class="th"><b>${esc(nm)}</b><span class="n">${list.length}</span></div>
    <ul>${list.map(([id, p]) => `<li><button type="button" class="mem${sel === id ? " sel" : ""}" data-id="${id}" aria-pressed="${sel === id}">${esc(p.prenom || "Sans prénom")}${p.sim ? ' <small>fictif</small>' : ""}</button></li>`).join("") || '<li class="note">Personne</li>'}</ul>
    ${sel && t && teamOf(sel) !== t ? `<button type="button" class="btn small" data-to="${t}">Déplacer ici${teamMode(t) && modeOf(ST.people[sel]) !== teamMode(t) ? ` (${MODE_NM[teamMode(t)].toLowerCase()})` : ""}</button>` : ""}</div>`;
  return ["presence", "distance"].map(m => {
    const mt = ts.filter(t => (teamMode(t) || "presence") === m), loose = people().filter(([id, p]) => !teamOf(id) && modeOf(p) === m);
    if (!mt.length && !loose.length) return "";
    return `<section class="tmode"><h3>${ico(m === "presence" ? "groups" : "device")}${MODE_NM[m]} <span class="n">${mt.reduce((a, t) => a + members(t).length, 0)} personne(s), ${mt.length} équipe(s)</span></h3>
      <div class="tgrid">${mt.map(t => card(t, members(t), "Équipe " + tName(t), TEAM[t].c)).join("")}${loose.length ? card(null, loose, "Sans équipe", "var(--muted)") : ""}</div></section>`;
  }).join("");
}
/* Formation des équipes : on répartit d'abord les fonctions les plus rares, puis chaque personne va dans l'équipe
   où sa fonction, son niveau de confiance et son niveau d'usage sont le moins représentés. */
async function formTeams(size) {
  const all = people().filter(([, p]) => p.started).map(([id, p]) => { const F = facets(p); return { id, mode: modeOf(p), prof: p.profil || "Autre", u: ZONE(F.usages), c: ZONE(F.croyances) }; });
  if (all.length < 2) { toast("Il faut au moins deux personnes pour former des équipes."); return; }
  const groups = ["presence", "distance"].map(m => all.filter(p => p.mode === m)).filter(g => g.length);
  // Nombre d'équipes par groupe, sans dépasser les couleurs disponibles
  let ks = groups.map(g => { let k = Math.max(1, Math.round(g.length / size)); while (g.length / k > size + 1) k++; return k; });
  while (ks.reduce((a, b) => a + b, 0) > C.TEAMS.length) { const i = ks.indexOf(Math.max(...ks)); ks[i]--; }
  const assign = {}, teamMode = {}, ids = []; let next = 0;
  groups.forEach((ppl, gi) => {
    const k = ks[gi], gids = C.TEAMS.slice(next, next + k).map(t => t.id); next += k;
    gids.forEach(t => { ids.push(t); teamMode[t] = ppl[0].mode; });
    const cap = Math.ceil(ppl.length / k), freq = {};
    ppl.forEach(p => { freq[p.prof] = (freq[p.prof] || 0) + 1; });
    ppl.sort((a, b) => freq[a.prof] - freq[b.prof] || Math.random() - 0.5);
    const teams = Object.fromEntries(gids.map(t => [t, []]));
    ppl.forEach(p => {
      let best = null, bestCost = Infinity;
      gids.forEach(t => { const m = teams[t]; if (m.length >= cap) return;
        const cost = m.length * 10 + m.filter(x => x.prof === p.prof).length * 6 + m.filter(x => x.c === p.c).length * 4 + m.filter(x => x.u === p.u).length * 3 + Math.random() * 0.5;
        if (cost < bestCost) { bestCost = cost; best = t; } });
      teams[best].push(p); assign[p.id] = best;
    });
  });
  ST.moveSel = null;
  await write(P(""), { teams: ids, assign: ST.store.DEL, teamMode: ST.store.DEL });
  await write(P(""), { assign, teamMode, formedAt: Date.now() });
  pubLast = ""; publish();
  const np = groups.find(g => g[0].mode === "presence"), nd = groups.find(g => g[0].mode === "distance");
  toast(ids.length + " équipes formées" + (np && nd ? ` : ${ks[0]} en présence, ${ks[1]} à distance.` : "."));
}
async function moveTo(id, t) { if (!id || !t) return; const p0 = ST.people[id]; if (teamMode(t) && modeOf(p0) !== teamMode(t)) await write(P("people/" + id), { mode: teamMode(t) }); await write(P(""), { assign: { [id]: t } }); ST.moveSel = null; pubLast = ""; publish(); const p = ST.people[id]; toast((p && p.prenom || "La personne") + " rejoint l'équipe " + tName(t) + "."); }

/* Ce que l'animation publie dans la séance : seulement des comptes, et la liste des prénoms par équipe. */
function pubData() {
  const done = people().map(([, p]) => p).filter(portraitDone), n = done.length;
  const roster = {}; Object.entries(ST.session.assign || {}).forEach(([id, t]) => { const p = ST.people[id]; if (p && TEAM[t]) (roster[t] = roster[t] || []).push(p.prenom || "Sans prénom"); });
  Object.values(roster).forEach(l => l.sort((a, b) => a.localeCompare(b, "fr")));
  if (n < MIN_GROUP) return { ready: false, n, roster };
  const zones = Object.fromEntries(C.FACETS.map(f => [f.k, [0, 0, 0]]));
  const preocc = {}, worries = {}, kn = Object.fromEntries(C.RULES.map(r => [r.k, [0, 0, 0]])), aligned = Object.fromEntries(C.RULES.map(r => [r.k, 0]));
  done.forEach(p => {
    const F = facets(p); C.FACETS.forEach(f => { const z = ZONE(F[f.k]); if (z != null) zones[f.k][z]++; });
    if (p.preocc) preocc[p.preocc] = (preocc[p.preocc] || 0) + 1;
    Object.keys(p.worries || {}).forEach(w => { if (p.worries[w]) worries[w] = (worries[w] || 0) + 1; });
    C.RULES.forEach(r => { const kv = known(p, r); if (kv != null) kn[r.k][kv]++; const o = chosen(p, SIT[r.sit]); if (o && o.d >= 80) aligned[r.k]++; });
  });
  return { ready: true, n, zones, preocc, worries, known: kn, aligned, roster };
}
let pubTimer = null, pubLast = "";
function publish() {
  if (!isOwner() || pubTimer) return;
  pubTimer = setTimeout(async () => { pubTimer = null; if (!ST.session || !isOwner()) return; const d = pubData(), j = JSON.stringify(d); if (j === pubLast) return; pubLast = j; await write(P(""), { pub: ST.store.DEL }); await write(P(""), { pub: d }); }, 900);
}
async function wipe() {
  try {
    const ids = await ST.store.list(P("people")); for (const id of ids) await ST.store.del(P("people/" + id));
    await ST.store.del(P("")); ls.set("ep-admin-sessions", adminList().filter(x => x.code !== ST.code));
    toast("Les données de la séance ont été effacées."); location.hash = "animer";
  } catch (e) { console.warn(e); toast("L'effacement n'a pas fonctionné complètement. Réessayez."); }
}

/* ======================= Participants fictifs ======================= */
const simPeople = () => people().filter(([, p]) => p.sim);
function simParts() {
  const r5 = (lo = 1, hi = 5) => lo + Math.floor(Math.random() * (hi - lo + 1)), lean = Math.random();
  const some = (list, n) => Object.fromEntries(list.slice().sort(() => Math.random() - 0.5).slice(0, n).map(x => [x.k, true]));
  const A = Object.fromEntries(C.ITEMS.map(x => [x.k, r5()]));
  const sit = Object.fromEntries(C.SITUATIONS.map(x => { const o = x.o.slice().sort((a, b) => lean > 0.5 ? b.d - a.d : a.d - b.d); const r = Math.random(); return [x.id, (r < 0.45 ? o[0] : r < 0.75 ? o[1] : pick(o)).k]; }));
  return [
    { started: true, u_freq: r5(0, 3), tasks: some(C.TASKS.slice(0, 7), 2), tools: some(C.TOOLS.slice(0, 3), 1 + Math.floor(Math.random() * 2)) },
    { a: Object.fromEntries(PENSE.map(k => [k, A[k]])) },
    { emo: Math.round(10 + Math.random() * 80), worries: some(C.WORRIES.slice(0, 13), 1 + Math.floor(Math.random() * 3)), preocc: pick(C.PREOCC).k },
    { a: Object.fromEntries(REPERES.map(k => [k, A[k]])), values: some(C.VALUES, 2) },
    { sit },
    { seenPortrait: true, known: Object.fromEntries(C.RULES.map(r => [r.k, r5(0, 2)])) }
  ];
}
async function simAdd(n) {
  const used = new Set(people().map(([, p]) => p.prenom)), names = C.SIM.names.filter(x => !used.has(x));
  for (let i = 0; i < n; i++) await write(P("people/" + "sim-" + rid(8)), { prenom: names[i] || "Personne " + (used.size + i + 1), profil: C.PROFILS[i % 3], mode: i % 3 === 2 ? "distance" : "presence", sim: true, simStep: 0, seen: Date.now() });
  toast(n + " participants fictifs ont rejoint la séance. Ils remplissent leur portrait peu à peu.");
}
async function simDel() {
  const sims = simPeople().map(([id]) => id);
  if (sims.length) await write(P(""), { assign: Object.fromEntries(sims.map(id => [id, ST.store.DEL])) });
  for (const id of sims) await ST.store.del(P("people/" + id));
  toast("Participants fictifs retirés.");
}
let simBusy = false;
async function simTick() {
  if (!isOwner() || simBusy) return; simBusy = true;
  try {
    const todo = simPeople().filter(([, p]) => (p.simStep || 0) < 6).sort(() => Math.random() - 0.5).slice(0, 2);
    for (const [id, p] of todo) { const st = p.simStep || 0; const parts = ST.simPlan[id] || (ST.simPlan[id] = simParts()); await write(P("people/" + id), { ...parts[st], simStep: st + 1 }); }
  } catch (e) { console.warn(e); } finally { simBusy = false; }
}
ST.simPlan = {};
})();
