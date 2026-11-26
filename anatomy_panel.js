// Πάνελ 3D Ανατομίας: viewer + κουμπιά όψης/πλευράς + πληροφορίες + σύνδεση με ασκήσεις και AI Coach.
import { mountAnatomy } from './anatomy.js';
import { MUSCLE_GROUPS, TERM_TO_SLUGS } from './anatomy_data.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Άσκηση -> ρόλος για μια ομάδα. Προτεραιότητα στα δεδομένα Supabase (links: [{exercise_id,slug,involvement_type}]),
// αλλιώς fallback από τα πεδία κειμένου primary_muscles / secondary_muscles.
export function exercisesForGroup(slug, exercises, links) {
  const out = [];
  if (links && links.length) {
    const by = new Map(exercises.map(e => [String(e.id), e]));
    const seen = new Set();
    for (const l of links) if (l.slug === slug) { const e = by.get(String(l.exercise_id)), k = l.exercise_id + l.involvement_type; if (e && !seen.has(k)) { seen.add(k); out.push({ ex: e, role: l.involvement_type }); } }
    return out;
  }
  const has = (txt, role, e) => String(txt || '').split(',').map(t => t.trim()).some(t => (TERM_TO_SLUGS[t] || []).includes(slug)) && out.push({ ex: e, role });
  for (const e of exercises) { if (!has(e.primary_muscles, 'primary', e)) has(e.secondary_muscles, 'secondary', e); }
  return out;
}

// Ουδέτερο, μη διαγνωστικό πλαίσιο για τον AI Coach (καμία ιατρική κρίση: μόνο ανατομική πληροφορία).
export function coachContext(slug, side, lang = 'el') {
  const g = MUSCLE_GROUPS.find(x => x.slug === slug); if (!g) return '';
  const sd = { left: 'αριστερή πλευρά', right: 'δεξιά πλευρά', both: 'και οι δύο πλευρές' }[side] || '';
  return `Ο χρήστης βλέπει στο 3D μοντέλο ανατομίας: ${g.name_el} (${g.name_en}), ${sd}. Ρόλος: ${g.fn_el} ` +
    'Εξήγησε μόνο εκπαιδευτικά. Χωρίς διάγνωση και χωρίς θεραπευτικό πλάνο. Αν ο χρήστης αναφέρει πόνο ή συμπτώματα, ακολούθησε τους υπάρχοντες κανόνες red-flag και yellow-flag.';
}

export async function mountAnatomyPanel(root, opts = {}) {
  const o = Object.assign({ lang: 'el', exercises: [], links: null, onOpenExercise: null, onAskCoach: null, viewer: {} }, opts);
  const L = o.lang === 'en' ? 'en' : 'el';
  const T = L === 'el' ? { front: 'Μπροστά', back: 'Πίσω', left: 'Αριστερά', right: 'Δεξιά', both: 'Και τα δύο', l: 'Αριστερό', r: 'Δεξί', fn: 'Λειτουργία', ex: 'Ασκήσεις', pri: 'Κύριος', sec: 'Δευτερεύων', none: 'Δεν υπάρχουν συνδεδεμένες ασκήσεις.', hint: 'Πάτησε έναν μυ στο μοντέλο ή διάλεξε από τη λίστα.', ask: 'Ρώτα τον Coach', reset: 'Επαναφορά', attr: 'Μοντέλο: Écorché (Charleeh), CC BY-SA 4.0, από BodyParts3D και Z-Anatomy.', edu: 'Μόνο εκπαιδευτικό περιεχόμενο, όχι διάγνωση.' }
    : { front: 'Front', back: 'Back', left: 'Left', right: 'Right', both: 'Both', l: 'Left', r: 'Right', fn: 'Function', ex: 'Exercises', pri: 'Primary', sec: 'Secondary', none: 'No linked exercises.', hint: 'Tap a muscle on the model or pick from the list.', ask: 'Ask the Coach', reset: 'Reset', attr: 'Model: Écorché (Charleeh), CC BY-SA 4.0, from BodyParts3D and Z-Anatomy.', edu: 'Educational only, not a diagnosis.' };
  root.innerHTML = `<div class="anx" style="display:flex;flex-direction:column;gap:8px">
   <div class="anx-view" style="position:relative;height:min(62vh,520px);border-radius:14px;overflow:hidden;background:#1b1b1f"></div>
   <div class="anx-bar" style="display:flex;flex-wrap:wrap;gap:6px">
    ${['front', 'back', 'left', 'right'].map(v => `<button type="button" data-view="${v}" class="anx-btn">${T[v]}</button>`).join('')}
    <button type="button" data-act="reset" class="anx-btn">${T.reset}</button></div>
   <div class="anx-groups" style="display:flex;flex-wrap:wrap;gap:6px"></div>
   <div class="anx-side" style="display:none;gap:6px">${['left', 'both', 'right'].map(s => `<button type="button" data-side="${s}" class="anx-btn">${s === 'left' ? T.l : s === 'right' ? T.r : T.both}</button>`).join('')}</div>
   <div class="anx-info" aria-live="polite" style="font:14px/1.45 system-ui,sans-serif"></div>
   <div class="anx-foot" style="font:11px system-ui,sans-serif;opacity:.65">${esc(T.attr)} ${esc(T.edu)}</div></div>`;
  root.querySelectorAll('.anx-btn').forEach(b => b.style.cssText = 'min-height:40px;padding:0 12px;border-radius:10px;border:1px solid #888;background:transparent;color:inherit;font:13px system-ui,sans-serif;cursor:pointer');
  const q = s => root.querySelector(s), info = q('.anx-info'), sideBar = q('.anx-side');
  let cur = null, side = 'both';
  const render = () => {
    root.querySelectorAll('[data-side]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.side === side)));
    root.querySelectorAll('[data-slug]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.slug === (cur && cur.slug))));
    if (!cur) { sideBar.style.display = 'none'; info.textContent = T.hint; return; }
    sideBar.style.display = 'flex';
    const g = cur, ex = exercisesForGroup(g.slug, o.exercises, o.links);
    const nm = L === 'el' ? g.name_el : g.name_en;
    info.innerHTML = `<h3 style="margin:0 0 4px">${esc(nm)} <small style="opacity:.6">${esc(L === 'el' ? g.name_en : g.name_el)}</small></h3>
      <p style="margin:0 0 6px">${esc(L === 'el' ? g.desc_el : g.desc_en)}</p>
      <p style="margin:0 0 8px"><b>${T.fn}:</b> ${esc(L === 'el' ? g.fn_el : g.fn_en)}</p>
      <div><b>${T.ex} (${ex.length})</b></div>
      ${ex.length ? '<ul style="margin:4px 0 8px;padding-left:18px">' + ex.slice(0, 40).map((x, i) => `<li><button type="button" data-ex="${i}" style="all:unset;cursor:pointer;text-decoration:underline">${esc(L === 'el' ? (x.ex.name_el || x.ex.name_en) : (x.ex.name_en || x.ex.name_el))}</button> <small>${x.role === 'primary' ? T.pri : T.sec}</small></li>`).join('') + '</ul>' : `<p style="opacity:.7">${T.none}</p>`}
      ${o.onAskCoach ? `<button type="button" data-act="ask" class="anx-btn" style="min-height:40px;padding:0 12px;border-radius:10px;border:1px solid #888;background:transparent;color:inherit;cursor:pointer">${T.ask}</button>` : ''}`;
    info.querySelectorAll('[data-ex]').forEach(b => b.onclick = () => o.onOpenExercise && o.onOpenExercise(ex[+b.dataset.ex].ex));
    const a = info.querySelector('[data-act=ask]'); if (a) a.onclick = () => o.onAskCoach(coachContext(g.slug, side, L), g, side);
  };
  const api = await mountAnatomy(q('.anx-view'), Object.assign({}, o.viewer, {
    onSelect: (slug, sd) => { cur = slug ? MUSCLE_GROUPS.find(x => x.slug === slug) : null; side = sd || 'both'; render(); }
  }));
  if (api && api.error) { info.textContent = (L === 'el' ? 'Το μοντέλο δεν φόρτωσε.' : 'The model failed to load.'); return { dispose() { api.dispose(); root.innerHTML = ''; } }; }
  const gl = q('.anx-groups');
  MUSCLE_GROUPS.filter(g => api.groups.has(g.slug)).sort((a, b) => a.order - b.order).forEach(g => {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.slug = g.slug; b.textContent = L === 'el' ? g.name_el : g.name_en; b.className = 'anx-btn';
    b.style.cssText = 'min-height:40px;padding:0 12px;border-radius:10px;border:1px solid #888;background:transparent;color:inherit;font:13px system-ui,sans-serif;cursor:pointer';
    b.onclick = () => { api.select(g.slug, 'both'); api.focusGroup(g.slug); }; gl.append(b);
  });
  root.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { api.unfocus(); api.setView(b.dataset.view); });
  root.querySelector('[data-act=reset]').onclick = () => { api.clearSelection(); api.unfocus(); api.resetView(); };
  root.querySelectorAll('[data-side]').forEach(b => b.onclick = () => { side = b.dataset.side; api.setSide(side); render(); });
  render();
  return { api, dispose() { api.dispose(); root.innerHTML = ''; } };
}
