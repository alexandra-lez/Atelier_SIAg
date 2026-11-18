/* Génération des documents Word (.docx) dans le navigateur, avec la bibliothèque docx (licence MIT, dossier vendor). */

window.DOCS = (() => {
  const C = window.CONTENT;
  const PLUM = "805186", EMERALD = "00A759", FOREST = "447B5A", GOLD = "B9862A", INK = "1F2A24", MUTED = "5E5E5E", LINE = "D7DDD3", SOFT = "EEF2EB";

  let libPromise = null;
  function lib() {
    if (window.docx) return Promise.resolve(window.docx);
    if (!libPromise) libPromise = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "vendor/docx.iife.js";
      s.onload = () => window.docx ? res(window.docx) : rej(new Error("docx"));
      s.onerror = () => rej(new Error("docx"));
      document.head.appendChild(s);
    });
    return libPromise;
  }
  async function asset(path) { try { const r = await fetch(path); if (!r.ok) return null; return new Uint8Array(await r.arrayBuffer()); } catch (e) { return null; } }

  /* Dans un aperçu claude.ai, les téléchargements passent par la capacité « downloads ».
     Sur GitHub Pages ou ailleurs, un lien de téléchargement classique suffit. */
  let dlCap = null;
  function dlReady() {
    if (dlCap) return dlCap;
    dlCap = (window.claude && typeof window.claude.use === "function")
      ? Promise.race([window.claude.use("downloads").catch(() => null), new Promise(r => setTimeout(() => r(null), 4000))])
      : Promise.resolve(null);
    return dlCap;
  }
  dlReady();
  async function save(blob, filename) {
    const d = await dlReady();
    if (d) {
      try { await d.save({ filename, data: blob }); return; }
      catch (e) { if (e && e.code === "declined") throw Object.assign(new Error("declined"), { quiet: true }); console.warn("downloads", e); }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
  }
  const saveText = (text, filename) => save(new Blob([text], { type: "text/markdown;charset=utf-8" }), filename);

  /* --------- Briques --------- */
  function kit(D) {
    const run = (text, o = {}) => new D.TextRun({ text: String(text == null ? "" : text), ...o });
    const p = (text, o = {}) => new D.Paragraph({ spacing: { after: 120 }, ...o, children: Array.isArray(text) ? text : [run(text, o.run || {})] });
    const h1 = t => new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, children: [run(t)] });
    const h2 = t => new D.Paragraph({ heading: D.HeadingLevel.HEADING_2, children: [run(t)] });
    const bullet = (t, lvl = 0) => new D.Paragraph({ numbering: { reference: "bul", level: lvl }, spacing: { after: 60 }, children: Array.isArray(t) ? t : [run(t)] });
    const lines = s => String(s || "").split(/\n+/).map(x => x.trim()).filter(Boolean);
    const border = { style: D.BorderStyle.SINGLE, size: 4, color: LINE };
    const borders = { top: border, bottom: border, left: border, right: border };
    const cell = (content, w, o = {}) => new D.TableCell({
      borders, width: { size: w, type: D.WidthType.DXA },
      shading: o.fill ? { fill: o.fill, type: D.ShadingType.CLEAR, color: "auto" } : undefined,
      margins: { top: 80, bottom: 80, left: 110, right: 110 },
      children: (Array.isArray(content) ? content : [content]).map(c => typeof c === "string" || typeof c === "number"
        ? new D.Paragraph({ spacing: { after: 0 }, children: [run(c, { bold: !!o.bold, size: 20, color: o.color })] }) : c)
    });
    const table = (head, rows, widths, fill = SOFT) => new D.Table({
      width: { size: widths.reduce((a, b) => a + b, 0), type: D.WidthType.DXA }, columnWidths: widths,
      rows: [new D.TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, widths[i], { bold: true, fill })) }),
        ...rows.map(r => new D.TableRow({ cantSplit: true, children: r.map((c, i) => cell(c == null ? "" : c, widths[i])) }))]
    });
    const spacer = () => new D.Paragraph({ spacing: { after: 80 }, children: [] });
    const rule = () => new D.Paragraph({ spacing: { after: 160 }, border: { bottom: { style: D.BorderStyle.SINGLE, size: 6, color: LINE, space: 4 } }, children: [] });
    return { run, p, h1, h2, bullet, lines, cell, table, spacer, rule };
  }

  async function makeDoc(D, title, subtitle, children) {
    const logo = await asset("assets/ia.png");
    const K = kit(D);
    const head = [];
    if (logo) head.push(new D.Paragraph({ spacing: { after: 120 }, children: [new D.ImageRun({ type: "png", data: logo, transformation: { width: 55, height: 40 }, altText: { title: "iA", description: "Apprivoiser les iA", name: "logo" } })] }));
    head.push(new D.Paragraph({ spacing: { after: 40 }, children: [K.run("APPRIVOISER LES IA, RDV PÉDAGOGIQUE SSF", { size: 16, color: FOREST, bold: true, characterSpacing: 20 })] }));
    head.push(new D.Paragraph({ heading: D.HeadingLevel.TITLE, children: [K.run(title)] }));
    if (subtitle) head.push(new D.Paragraph({ spacing: { after: 240 }, children: [K.run(subtitle, { color: MUTED })] }));
    return new D.Document({
      creator: "Atelier IAg SSF", title, language: "fr-CA",
      styles: {
        default: { document: { run: { font: "Arial", size: 21, color: INK }, paragraph: { spacing: { after: 120, line: 276, lineRule: D.LineRuleType.AUTO } } } },
        paragraphStyles: [
          { id: "Title", name: "Title", basedOn: "Normal", next: "Normal", run: { font: "Arial Narrow", size: 44, bold: true, color: PLUM }, paragraph: { spacing: { after: 80 } } },
          { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial Narrow", size: 30, bold: true, color: FOREST }, paragraph: { spacing: { before: 320, after: 120 }, keepNext: true, outlineLevel: 0, border: { bottom: { style: D.BorderStyle.SINGLE, size: 6, color: EMERALD, space: 4 } } } },
          { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial Narrow", size: 24, bold: true, color: PLUM }, paragraph: { spacing: { before: 220, after: 80 }, keepNext: true, outlineLevel: 1 } }
        ]
      },
      numbering: { config: [{ reference: "bul", levels: [
        { level: 0, format: D.LevelFormat.BULLET, text: "•", alignment: D.AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 360 } } } },
        { level: 1, format: D.LevelFormat.BULLET, text: "◦", alignment: D.AlignmentType.LEFT, style: { paragraph: { indent: { left: 900, hanging: 360 } } } }] }] },
      sections: [{
        properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1200, bottom: 1200, left: 1300, right: 1300 } } },
        footers: { default: new D.Footer({ children: [new D.Paragraph({ alignment: D.AlignmentType.RIGHT, children: [K.run("Atelier IAg SSF, " + title + "   ", { size: 16, color: MUTED }), new D.TextRun({ children: [D.PageNumber.CURRENT], size: 16, color: MUTED })] })] }) },
        children: head.concat(children)
      }]
    });
  }

  const today = () => new Date().toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" });
  const fileSafe = s => String(s || "document").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "document";

  /* --------- Documents Word du portrait et des équipes, dans le gabarit du cahier (sans page couverture) ---------
     Le portrait : la silhouette, les six facettes, les tensions et pistes, puis les références. */
  let zipPromise = null;
  function zipLib() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    if (!zipPromise) zipPromise = new Promise((res, rej) => {
      const s = document.createElement("script"); s.src = "vendor/jszip.min.js";
      s.onload = () => window.JSZip ? res(window.JSZip) : rej(new Error("jszip")); s.onerror = () => rej(Object.assign(new Error("jszip"), { why: "La bibliothèque vendor/jszip.min.js est introuvable." }));
      document.head.appendChild(s);
    });
    return zipPromise;
  }
  const x = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const r = (t, o = {}) => `<w:r><w:rPr>${o.b ? "<w:b/><w:bCs/>" : ""}${o.i ? "<w:i/><w:iCs/>" : ""}${o.color ? `<w:color w:val="${o.color}"/>` : ""}${o.sp ? `<w:spacing w:val="${o.sp}"/>` : ""}${o.sz ? `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>` : ""}</w:rPr><w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
  const para = (runs, ppr = "") => `<w:p><w:pPr>${ppr}</w:pPr>${runs}</w:p>`;
  const box = (inner, fill) => `<w:tbl><w:tblPr><w:tblW w:w="10800" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="10" w:type="dxa"/><w:right w:w="10" w:type="dxa"/></w:tblCellMar><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid><w:gridCol w:w="10800"/></w:tblGrid><w:tr><w:trPr><w:cantSplit/></w:trPr><w:tc><w:tcPr><w:tcW w:w="10800" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/><w:tcMar><w:top w:w="140" w:type="dxa"/><w:left w:w="220" w:type="dxa"/><w:bottom w:w="140" w:type="dxa"/><w:right w:w="220" w:type="dxa"/></w:tcMar></w:tcPr>${inner}</w:tc></w:tr></w:tbl>${para("", '<w:spacing w:after="80"/>')}`;
  const image = (rid, cx, cy, alt, id, nm) => `<w:p><w:pPr><w:spacing w:before="120" w:after="60"/><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="${nm}" descr="${x(alt)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="${nm}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;

  /* Ouvre le gabarit Word (styles, en-tête « Apprivoiser les iA » et pied de page du cahier).
     finish(body, nom) remplace le paragraphe {{CONTENU}} par body, puis enregistre le document. */
  async function openTemplate() {
    const JSZip = await zipLib();
    // 1) le fichier assets/gabarit.docx (modifiable dans Word); 2) sinon, la copie intégrée js/gabarit.js
    let data = null;
    try { const res = await fetch("assets/gabarit.docx", { cache: "no-cache" }); if (res.ok) { const buf = await res.arrayBuffer(); if (new Uint8Array(buf, 0, 2)[0] === 0x50) data = buf; } } catch (e) {}
    if (!data && window.GABARIT_WORD) data = Uint8Array.from(atob(window.GABARIT_WORD), c => c.charCodeAt(0));
    if (!data) throw Object.assign(new Error("gabarit"), { why: "Le gabarit Word est introuvable. Vérifiez que assets/gabarit.docx et js/gabarit.js sont en ligne." });
    const zip = await JSZip.loadAsync(data);
    let rels = await zip.file("word/_rels/document.xml.rels").async("string");
    const addRel = (type, target, ext) => { const id = "rIdP" + (rels.match(/rIdP\d+/g) || []).length; rels = rels.replace("</Relationships>", `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${x(target)}"${ext ? ' TargetMode="External"' : ""}/></Relationships>`); return id; };
    const finish = async (body, filename) => {
      let doc = await zip.file("word/document.xml").async("string");
      doc = doc.replace("<w:p><w:r><w:t>{{CONTENU}}</w:t></w:r></w:p>", body);
      zip.file("word/document.xml", doc);
      zip.file("word/_rels/document.xml.rels", rels);
      Object.keys(zip.files).forEach(n => { if (zip.files[n].dir) delete zip.files[n]; }); // pas d'entrées de dossier : Word en ligne les refuse
      const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", compression: "DEFLATE" });
      await save(blob, filename);
    };
    return { zip, addRel, finish };
  }

  async function portrait(person, A, imgs = {}) {
    const { zip, addRel, finish } = await openTemplate();
    let body = "";
    // En-tête de la partie, comme dans le cahier
    body += para(r("PARTIE 1", { b: true, color: "808080", sz: 18, sp: 20 }), '<w:spacing w:after="40"/>');
    body += para(r("Mon portrait de personne utilisatrice"), '<w:pStyle w:val="Titre1"/>');
    body += para(r(((person.prenom ? person.prenom + ", " : "") + today()) + ". ", { b: true }) + r("Ce portrait est une photo du moment, pas une étiquette."), '<w:spacing w:after="120" w:line="288" w:lineRule="auto"/>');
    // La silhouette, puis les continuums
    const alt = C.FACETS.map(f => `${f.nm} : ${A.F[f.k] == null ? "sans réponse" : A.F[f.k] + " sur 100"}`).join(", ");
    const put = (img, nm, id, cx) => { zip.file(`word/media/${nm}.png`, img.data); const rid = addRel("image", `media/${nm}.png`); return image(rid, cx, Math.round(cx * img.h / img.w), (nm === "silhouette" ? "Ma silhouette. " : "Mes six facettes. ") + alt, id, nm); };
    if (imgs.silhouette) body += put(imgs.silhouette, "silhouette", 101, 5760720);
    body += para(r("La forme est unique à chaque personne, il n'y a pas de bonne forme. Plus un point s'éloigne du centre, plus vous êtes près de la fin du continuum." + (A.tensions.length ? " Un point couleur jaune signale une facette liée à une tension." : ""), { i: true, color: "5E5E5E", sz: 18 }), '<w:spacing w:after="200"/><w:jc w:val="center"/>');
    if (imgs.continuums) {
      body += para(r("Mes six facettes, une à une"), '<w:pStyle w:val="Titre2"/>');
      body += para(r("Chaque ligne va d'un pôle à l'autre. Aucun des deux n'est meilleur.", { i: true, color: "5E5E5E", sz: 18 }), '<w:keepNext/><w:spacing w:after="60"/>');
      body += put(imgs.continuums, "facettes", 102, 5486400);
    }
    // Tensions et pistes
    if (A.tensions.length) {
      body += para(r(A.tensions.length > 1 ? "Tensions à explorer et pistes" : "Une tension à explorer et une piste"), '<w:pStyle w:val="Titre2"/>');
      A.tensions.forEach(t => {
        body += box(
          para(r(t.nm, { b: true, sz: 23 }), '<w:spacing w:after="60"/>') +
          para(r(t.txt), '<w:spacing w:after="60" w:line="276" w:lineRule="auto"/>') +
          para(r("Question : ", { b: true }) + r(t.q, { i: true }), '<w:spacing w:after="60" w:line="276" w:lineRule="auto"/>') +
          (t.piste ? para(r("Piste : ", { b: true, color: "1F4E79" }) + r(t.piste), '<w:spacing w:after="0" w:line="276" w:lineRule="auto"/>') : ""),
          "F3F5F8");
      });
    } else {
      body += para(r("Pistes"), '<w:pStyle w:val="Titre2"/>');
      body += box(para(r("Aucune tension marquée ne ressort de vos réponses. ", { b: true }) + r("Pour quelle tâche votre posture serait-elle différente? Essayez de la décrire en une phrase."), '<w:spacing w:after="0" w:line="276" w:lineRule="auto"/>'), "DCEBF7");
    }
    // Références, présentées comme dans le cahier
    body += para(r("Références"), '<w:pStyle w:val="Titre2"/>');
    C.SOURCES.forEach(src => {
      const m = src.match(/^(.*?)(https?:\/\/\S+)\s*$/);
      const rp = '<w:sz w:val="19"/><w:szCs w:val="19"/>';
      let runs = `<w:r><w:rPr>${rp}</w:rPr><w:t xml:space="preserve">${x(m ? m[1] : src)}</w:t></w:r>`;
      if (m) { const id = addRel("hyperlink", m[2], true); runs += `<w:hyperlink r:id="${id}" w:history="1"><w:r><w:rPr><w:rStyle w:val="Lienhypertexte"/>${rp}</w:rPr><w:t>${x(m[2])}</w:t></w:r></w:hyperlink>`; }
      body += `<w:p><w:pPr><w:spacing w:after="100" w:line="264" w:lineRule="auto"/><w:ind w:left="360" w:hanging="360"/></w:pPr>${runs}</w:p>`;
    });
    await finish(body, "portrait-IAg-" + fileSafe(person.prenom || "anonyme") + ".docx");
  }

  /* --------- Travail d'équipe (partie 2) --------- */
  async function team(t, members, cards, tdoc, crits) {
    const D = await lib(); const K = kit(D);
    const ch = [];
    ch.push(K.p([K.run("Membres : ", { bold: true }), K.run(members.length ? members.join(", ") : "non précisés")]));
    const placed = cards.filter(c => c.q).length, tested = cards.filter(c => c.tested);
    ch.push(K.p(`${placed} carte(s) placée(s) sur ${cards.length}, ${tested.length} testée(s), ${cards.filter(c => c.custom).length} ajoutée(s) par l'équipe.`));
    ch.push(K.h1("Notre grille"));
    const by = Object.fromEntries(C.QUADS.map(q => [q.k, cards.filter(c => c.q === q.k)]));
    const quadCell = q => [new D.Paragraph({ spacing: { after: 60 }, children: [K.run(q.nm, { bold: true, color: PLUM })] }), new D.Paragraph({ spacing: { after: 80 }, children: [K.run(q.hint, { size: 17, color: MUTED, italics: true })] }),
      ...(by[q.k].length ? by[q.k].map(c => K.bullet(c.t + (c.res && c.res !== "prevu" ? " (le test a surpris)" : ""))) : [new D.Paragraph({ children: [K.run("Aucune carte", { color: MUTED, size: 18 })] })])];
    const Q = Object.fromEntries(C.QUADS.map(q => [q.k, q]));
    const w = 4820;
    ch.push(new D.Table({ width: { size: w * 2, type: D.WidthType.DXA }, columnWidths: [w, w], rows: [
      new D.TableRow({ children: [K.cell(quadCell(Q.eviter), w, { fill: "F6E3DA" }), K.cell(quadCell(Q.encadrer), w, { fill: "F8EDD3" })] }),
      new D.TableRow({ children: [K.cell(quadCell(Q.gadget), w, { fill: "ECEFEA" }), K.cell(quadCell(Q.adopter), w, { fill: "DDF0E2" })] })] }));
    ch.push(K.p([K.run("Axe vertical : vigilance requise. Axe horizontal : valeur ajoutée pour la tâche.", { size: 17, color: MUTED })], { spacing: { before: 80, after: 120 } }));
    ch.push(K.h1("Nos cartes en détail"));
    const qn = Object.fromEntries(C.QUADS.map(q => [q.k, q.nm])), rn = Object.fromEntries(C.RES.map(r => [r.k, r.nm]));
    ch.push(K.table(["Carte", "Zone", "Et si…", "Test", "Pourquoi"], cards.map(c => [c.t + (c.custom ? " (ajoutée)" : ""), c.q ? qn[c.q] : "Non placée",
      !c.et ? "" : c.moved ? "A bougé (d'abord : " + (qn[c.q0] || "?") + ")" : c.etSkip ? "Passée" : c.etDone ? "Reste" : "", c.tested ? (rn[c.res] || "Testée") : "", c.j || ""]), [3000, 1300, 1700, 1200, 2440]));
    const movedCards = cards.filter(c => c.moved);
    if (movedCards.length) { ch.push(K.h2("Les cartes qui ont bougé avec la variante « Et si… »")); movedCards.forEach(c => ch.push(K.bullet([K.run(c.t + " ", { bold: true }), K.run("Et si " + c.et + " → de « " + (qn[c.q0] || "?") + " » à « " + qn[c.q] + " ».")]))); }
    ch.push(K.spacer());
    ch.push(K.h1("Nos prises de position"));
    (K.lines(tdoc.pos).length ? K.lines(tdoc.pos) : ["À compléter."]).forEach(l => ch.push(K.bullet(l)));
    ch.push(K.h1("Idées émergentes"));
    (K.lines(tdoc.idees).length ? K.lines(tdoc.idees) : ["À compléter."]).forEach(l => ch.push(K.bullet(l)));
    ch.push(K.h1("Nos critères"));
    C.NOTIONS.forEach(n => { const cs = crits.filter(c => (c.notion || "aclasser") === n.k); if (cs.length) { ch.push(K.h2(n.nm)); cs.forEach(c => ch.push(K.bullet(c.text))); } });
    if (!crits.length) ch.push(K.p("Aucun critère noté."));
    const doc = await makeDoc(D, "Travail de l'équipe " + t.nm, "Partie 2, Cartes d'usage, " + today(), ch);
    await save(await D.Packer.toBlob(doc), "equipe-" + fileSafe(t.nm) + "-cartes-usage.docx");
  }

  /* --------- Skills --------- */
  function skillMd(f) {
    const L = s => String(s || "").split(/\n+/).map(x => x.trim()).filter(Boolean).map(x => x.replace(/^[-•\d.)\s]+/, ""));
    const ul = s => L(s).map(x => "- " + x).join("\n"), ol = s => L(s).map((x, i) => (i + 1) + ". " + x).join("\n");
    const slug = String(f.nom || "skill").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "skill";
    const desc = [f.quand, f.fournit ? "La personne fournit " + String(f.fournit).replace(/\.$/, "").replace(/^\w/, c => c.toLowerCase()) + "." : ""].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    let md = `---\nname: ${slug}\ndescription: ${desc || "À compléter."}\n---\n\n# ${f.nom || "Skill sans nom"}\n`;
    if (f.jamais) md += `\n## Avant de commencer\n\nSi le contenu fourni contient l'un des éléments suivants, arrête-toi et demande à la personne de le retirer.\n${ul(f.jamais)}\n`;
    if (f.quand) md += `\n## Quand l'utiliser\n\n${f.quand}\n`;
    if (f.fournit) md += `\n## Ce que la personne fournit\n\n${f.fournit}\n`;
    if (f.etapes) md += `\n## Étapes\n\n${ol(f.etapes)}\n`;
    if (f.format) md += `\n## Format du résultat\n\n${f.format}\n`;
    if (f.criteres) md += `\n## Critères de qualité\n\n${ul(f.criteres)}\n`;
    if (f.limites) md += `\n## Limites\n\n${ul(f.limites)}\n`;
    if (f.verifs || f.declaration) md += `\n## À rappeler à la fin\n\n${f.verifs ? "Rappelle à la personne de vérifier elle-même les points suivants avant d'utiliser le résultat.\n" + ul(f.verifs) + "\n" : ""}${f.declaration ? "\nRappelle-lui aussi la déclaration à faire : " + f.declaration + "\n" : ""}`;
    return md;
  }
  function skillSection(D, K, s, teamName) {
    const ch = [];
    ch.push(K.h1(s.nom || "Skill sans nom"));
    ch.push(K.p([K.run("Équipe " + (teamName || "") + (s.srcText ? ", à partir de l'usage « " + s.srcText + " »" : ""), { color: MUTED, size: 18 })]));
    const notionOf = Object.fromEntries(C.NOTIONS.map(n => [n.k, n.nm]));
    C.FIELDS.filter(f => f.k !== "nom").forEach(f => {
      const v = s[f.k];
      ch.push(new D.Paragraph({ spacing: { before: 140, after: 60 }, keepNext: true, children: [K.run(f.nm, { bold: true, color: PLUM }), K.run(f.n ? "   " + notionOf[f.n] : "", { size: 16, color: MUTED })] }));
      const ls = K.lines(v);
      if (!ls.length) ch.push(K.p([K.run("À compléter.", { color: MUTED, italics: true })]));
      else if (ls.length === 1) ch.push(K.p(ls[0]));
      else ls.forEach(l => ch.push(K.bullet(l.replace(/^[-•\d.)\s]+/, ""))));
    });
    ch.push(K.h2("Texte à utiliser dans Copilot Chat (SKILL.md)"));
    skillMd(s).split("\n").forEach(l => ch.push(new D.Paragraph({ spacing: { after: 0, line: 240 }, shading: { fill: "F3F5F1", type: D.ShadingType.CLEAR, color: "auto" }, children: [K.run(l || " ", { font: "Consolas", size: 17 })] })));
    return ch;
  }
  async function skillDoc(s, teamName) {
    const D = await lib(); const K = kit(D);
    const doc = await makeDoc(D, s.nom || "Skill", "Banque de skills du SSF, " + today(), skillSection(D, K, s, teamName));
    await save(await D.Packer.toBlob(doc), "skill-" + fileSafe(s.nom) + ".docx");
  }
  async function bank(skills, teamName, crits, code) {
    const D = await lib(); const K = kit(D);
    let ch = [];
    ch.push(K.p(`${skills.length} skill(s) créée(s) pendant l'atelier, séance ${code}. Chaque fiche présente ses rubriques, puis le texte prêt à téléverser dans Copilot Chat ou à coller au début d'une conversation.`));
    ch.push(K.h1("Sommaire"));
    skills.forEach(s => ch.push(K.bullet([K.run(s.nom || "Skill sans nom", { bold: true }), K.run(", équipe " + teamName(s.team) + (s.quand ? ". " + s.quand : ""))])));
    skills.forEach(s => { ch.push(new D.Paragraph({ children: [new D.PageBreak()] })); ch = ch.concat(skillSection(D, K, s, teamName(s.team))); });
    if (crits.length) {
      ch.push(new D.Paragraph({ children: [new D.PageBreak()] }));
      ch.push(K.h1("Critères nommés par le groupe"));
      C.NOTIONS.forEach(n => { const cs = crits.filter(c => (c.notion || "aclasser") === n.k); if (cs.length) { ch.push(K.h2(n.nm)); cs.forEach(c => ch.push(K.bullet(c.text))); } });
    }
    const doc = await makeDoc(D, "Banque de skills du SSF", "Atelier 1, " + today(), ch);
    await save(await D.Packer.toBlob(doc), "banque-skills-SSF-" + code + ".docx");
  }

  /* --------- Composition des équipes (prénoms seulement) --------- */
  async function teams(list, code) {
    const { finish } = await openTemplate();
    const n = list.reduce((a, t) => a + t.m.length, 0);
    let body = para(r("PARTIE 1", { b: true, color: "808080", sz: 18, sp: 20 }), '<w:spacing w:after="40"/>');
    body += para(r("Les équipes"), '<w:pStyle w:val="Titre1"/>');
    body += para(r("Séance " + code + ", " + today() + ". ", { b: true }) + r(`${list.length} équipe${list.length > 1 ? "s" : ""}, ${n} personne${n > 1 ? "s" : ""}. Les personnes en présence et à distance sont réparties séparément. Dans chaque groupe, les équipes mélangent les fonctions et les points de vue; aucune information des portraits n'apparaît ici.`), '<w:spacing w:after="160" w:line="288" w:lineRule="auto"/>');
    ["En présence", "À distance"].forEach(mode => {
      const ts = list.filter(t => (t.mode || "En présence") === mode); if (!ts.length) return;
      body += para(r(mode), '<w:pStyle w:val="Titre2"/>');
      ts.forEach(t => {
        body += box(para(r("Équipe " + t.nm, { b: true, sz: 24 }) + r(`   ${t.m.length} personne${t.m.length > 1 ? "s" : ""}`, { color: "5E5E5E", sz: 19 }), '<w:spacing w:after="80"/>') +
          t.m.map((nm, k) => para(r(nm), `<w:spacing w:after="${k === t.m.length - 1 ? 0 : 40}"/>`)).join(""), "F3F5F8");
      });
    });
    await finish(body, "equipes-" + code + ".docx");
  }

  return { lib, portrait, team, teams, skillDoc, bank, skillMd, save, saveText, fileSafe };
})();
