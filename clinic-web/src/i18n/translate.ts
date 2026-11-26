import { phrases } from './phrases';

// Arabic mode: translate known static text on screen (text nodes, placeholder, title).
// Keeps unknown text as is. Works for every page without touching each component.
const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const EN_M = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const lookup = (raw: string): string | null => {
  const core = raw.trim();
  if (!core) return null;
  const mm = core.match(/^([A-Z][a-z]+) (\d{4})$/);
  if (mm && EN_M.includes(mm[1])) return `${MONTHS[EN_M.indexOf(mm[1])]} ${mm[2]}`;
  if (phrases[core]) return phrases[core];
  const m = core.match(/^(.*?)(\s*[*:…]+|\.\.\.)$/);
  if (m && phrases[m[1].trim()]) return phrases[m[1].trim()] + m[2];
  return null;
};

function node(n: Node) {
  if (n.nodeType === 3) {
    const t = n.nodeValue || '';
    const r = lookup(t);
    if (r) n.nodeValue = t.replace(t.trim(), r);
  } else if (n.nodeType === 1) {
    const el = n as HTMLElement;
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
    for (const a of ['placeholder', 'title', 'aria-label']) {
      const v = el.getAttribute?.(a);
      if (v) { const r = lookup(v); if (r) el.setAttribute(a, r); }
    }
    el.childNodes.forEach(node);
  }
}

export function startArabicTranslator() {
  if (typeof document === 'undefined' || localStorage.getItem('lang') !== 'ar') return;
  let queued = false;
  const run = () => { queued = false; obs.disconnect(); node(document.body); obs.observe(document.body, opts); };
  const opts = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title'] } as MutationObserverInit;
  const obs = new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(run); } });
  document.addEventListener('DOMContentLoaded', run);
  if (document.body) run();
}
