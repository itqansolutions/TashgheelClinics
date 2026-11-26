import { phrases } from './phrases';

// Arabic mode: translate known static text on screen (text nodes, placeholder, title).
// Keeps unknown text as is. Works for every page without touching each component.
const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const EN_M = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const COUNTRIES: Record<string, string> = {
  'Egypt':'مصر','Saudi Arabia':'السعودية','United Arab Emirates':'الإمارات','Kuwait':'الكويت','Qatar':'قطر','Jordan':'الأردن',
  'Lebanon':'لبنان','Libya':'ليبيا','United Kingdom':'المملكة المتحدة','United States':'الولايات المتحدة','Other':'أخرى',
  'Sudan':'السودان','Syria':'سوريا','Iraq':'العراق','Palestine':'فلسطين','Yemen':'اليمن','Oman':'عمان','Bahrain':'البحرين',
  'Morocco':'المغرب','Algeria':'الجزائر','Tunisia':'تونس','Turkey':'تركيا','Germany':'ألمانيا','France':'فرنسا','Italy':'إيطاليا',
  'Canada':'كندا','Somalia':'الصومال','Mauritania':'موريتانيا','Djibouti':'جيبوتي','Comoros':'جزر القمر',
};
const PATTERNS: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/^(\d{1,2}):(\d{2}) (AM|PM)$/i, (m) => `${m[1]}:${m[2]} ${m[3].toUpperCase() === 'AM' ? 'ص' : 'م'}`],
  [/^([\d,.]+) EGP$/, (m) => `${m[1]} ج.م`],
  [/^(.+) - ([\d,.]+) EGP$/, (m) => `${lookup(m[1]) ?? m[1]} - ${m[2]} ج.م`],
  [/^(.+?) \((\d+)\)$/, (m) => { const r = phrases[m[1].trim()] ?? lookup(m[1]); return r ? `${r} (${m[2]})` : m[0]; }],
  [/^([\d,.]+) sources?$/, (m) => `${m[1]} مصدر`],
  [/^Joined (.+)$/, (m) => `انضم في ${m[1]}`],
  [/^(\d+) Years?$/, (m) => `${m[1]} سنة`],
  [/^via (.+)$/, (m) => `عن طريق ${m[1]}`],
  [/^Patient since ([A-Z][a-z]{2}) (\d{4})$/, (m) => `مريض من ${MONTHS[['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(m[1])] ?? m[1]} ${m[2]}`],
  [/^([\d,.]+) total patients$/, (m) => `${m[1]} مريض`],
  [/^([\d,.]+) registered doctors$/, (m) => `${m[1]} دكتور مسجل`],
  [/^([\d,.]+)% commission$/, (m) => `عمولة ${m[1]}%`],
  [/^Max ([\d,.]+)% off$/, (m) => `أقصى خصم ${m[1]}%`],
  [/^([\d,.]+) services?$/, (m) => `${m[1]} خدمة`],
  [/^([\d,.]+) doctors?$/, (m) => `${m[1]} دكتور`],
  [/^([\d,.]+) min$/, (m) => `${m[1]} دقيقة`],
  [/^· ([\d,.]+) doctors?$/, (m) => `· ${m[1]} دكتور`],
];
const lookup = (raw: string): string | null => {
  const core = raw.trim();
  if (!core) return null;
  const mm = core.match(/^([A-Z][a-z]+) (\d{4})$/);
  if (mm && EN_M.includes(mm[1])) return `${MONTHS[EN_M.indexOf(mm[1])]} ${mm[2]}`;
  if (phrases[core]) return phrases[core];
  if (COUNTRIES[core]) return COUNTRIES[core];
  for (const [re, fn] of PATTERNS) { const x = core.match(re); if (x) return fn(x); }
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
