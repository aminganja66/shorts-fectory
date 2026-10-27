// Spoken-English normaliser: turns written numbers/symbols into the words a person would actually say.
//   import {speak} from './spoken.mjs'   → speak('In 2011, Nokia lost 22.1% and $5.44 billion.')
//   npm run spoken -- <episodeId>         → fills lines[].voice for every line whose spoken form differs from its text
//   npm run spoken:test                   → runs the self-test (node pipeline/spoken.mjs --test)
// The caption keeps the written text; ElevenLabs gets the spoken form. Each KIND of number is read differently:
//   years  1927 → "nineteen twenty-seven" · 2007 → "two thousand seven" · 2011 → "twenty eleven" · 1990s → "the nineteen nineties"
//   money  $116 → "one hundred sixteen dollars" · €5.44B → "five point four four billion euros" · $5.44 → "five dollars and forty-four cents"
//   percent 49.4% → "forty-nine point four percent"      time 3:30 PM → "three thirty P M"      date February 11 → "February eleventh"
//   quarter Q3 2011 → "Q three of twenty eleven"          ordinal 3rd → "third"      multipliers 10x → "ten times", 5M → "five million"
//   ranges 2007–2013 → "two thousand seven to twenty thirteen" · 40–50% → "forty to fifty percent" · units 5km → "five kilometers"
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const TENS_PLURAL = {0: 'hundreds', 10: 'tens', 20: 'twenties', 30: 'thirties', 40: 'forties', 50: 'fifties', 60: 'sixties', 70: 'seventies', 80: 'eighties', 90: 'nineties'};
const below100 = (n) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : ''));
const below1000 = (n) => {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return (h ? ONES[h] + ' hundred' + (r ? ' ' : '') : '') + (r ? below100(r) : '');
};
const intWords = (n) => {
  if (n === 0) return 'zero';
  if (n >= 1e15) return String(n).split('').map((d) => ONES[+d]).join(' ');
  const out = [];
  for (const [v, name] of [[1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']]) {
    if (n >= v) {
      out.push(below1000(Math.floor(n / v)) + ' ' + name);
      n %= v;
    }
  }
  if (n > 0) out.push(below1000(n));
  return out.join(' ');
};
// "1,200.55" → "one thousand two hundred point five five"
export const numWords = (s) => {
  const clean = String(s).replace(/,/g, '');
  const [i, d] = clean.split('.');
  return intWords(parseInt(i || '0', 10)) + (d ? ' point ' + d.split('').map((x) => ONES[+x]).join(' ') : '');
};
const ordWords = (n) => {
  const w = intWords(n);
  const irregular = {one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth'};
  return w.replace(/(\w+)$/, (m) => irregular[m] ?? (m.endsWith('y') ? m.slice(0, -1) + 'ieth' : m + 'th'));
};
export const yearWords = (y) => {
  if (y === 2000) return 'two thousand';
  if (y >= 2001 && y <= 2009) return 'two thousand ' + ONES[y - 2000];
  const a = Math.floor(y / 100);
  const b = y % 100;
  if (b === 0) return below100(a) + ' hundred';
  if (b < 10) return below100(a) + ' oh ' + ONES[b];
  return below100(a) + ' ' + below100(b);
};

const MONTHS = {jan: 'January', feb: 'February', mar: 'March', apr: 'April', may: 'May', jun: 'June', jul: 'July', aug: 'August', sep: 'September', sept: 'September', oct: 'October', nov: 'November', dec: 'December'};
const MONTH_RE = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
const monthName = (m) => MONTHS[m.replace(/\./, '').toLowerCase().slice(0, m.toLowerCase().startsWith('sept') ? 4 : 3)] ?? m;
const CUR = {'$': ['dollar', 'dollars', 'cent', 'cents'], '€': ['euro', 'euros', 'cent', 'cents'], '£': ['pound', 'pounds', 'penny', 'pence'], '₹': ['rupee', 'rupees', 'paisa', 'paise'], '¥': ['yen', 'yen', 'sen', 'sen']};
const SCALE = {trillion: 'trillion', billion: 'billion', million: 'million', thousand: 'thousand', crore: 'crore', crores: 'crore', lakh: 'lakh', lakhs: 'lakh', bn: 'billion', mn: 'million', k: 'thousand', m: 'million', b: 'billion', t: 'trillion'};
const UNITS = {km: 'kilometers', kg: 'kilograms', cm: 'centimeters', mm: 'millimeters', mph: 'miles per hour', kph: 'kilometers per hour', 'km/h': 'kilometers per hour', GB: 'gigabytes', MB: 'megabytes', TB: 'terabytes', KB: 'kilobytes', GHz: 'gigahertz', MHz: 'megahertz', kW: 'kilowatts', MW: 'megawatts', lbs: 'pounds', lb: 'pounds', ft: 'feet', mi: 'miles', '°C': 'degrees Celsius', '°F': 'degrees Fahrenheit'};
// words after a 4-digit number that mean it is a COUNT, not a year ("2000 employees")
const COUNT_NOUN = /^(people|users|employees|customers|units|dollars|euros|workers|jobs|stores|cars|years|days|months|hours|subscribers|downloads|views|sales|barrels|tons|miles|points|pounds|rupees)\b/i;
// words that make a following 4-digit number a QUANTITY ("about 2000", "more than 1500")
const COUNTISH_PREV = new Set(['about', 'roughly', 'over', 'under', 'nearly', 'almost', 'approximately', 'only', 'just', 'than', 'exactly', 'estimated', 'some', 'another', 'additional', 'extra', 'with', 'had', 'has', 'have', 'hired', 'fired', 'lost', 'sold', 'bought', 'cut', 'added', 'raised', 'paid', 'earned', 'made', 'got']);
// nouns that follow a money amount used as an ADJECTIVE → singular currency ("a fifty million dollar offer")
const MONEY_ADJ_NOUN = /^(deal|offer|bid|bill|loan|fine|fee|price|tag|deficit|debt|budget|investment|acquisition|takeover|buyout|contract|package|plan|lawsuit|settlement|penalty|grant|check|cheque|round|funding|fund|valuation|bet|gamble|mistake|question|bond|stimulus|cut|hike|jump|drop|increase|difference|gap|hole|loss|profit|stake|order|launch|project|prize|reward|ticket|coffee|bonus|salary|payout|payment|donation|gift|company|startup|business|industry|market|economy|fortune|empire|brand|check|purchase|sale|bailout|rescue|merger|lawsuit|claim|charge|tax|tariff)\b/i;

export const speak = (input) => {
  let t = ' ' + input + ' ';
  const sub = (re, fn) => {
    t = t.replace(re, fn);
  };

  // --- dates: "February 11, 2011" / "Feb 11" / "11 February 2011"
  sub(new RegExp(`\\b(${MONTH_RE})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?!\\d)(?:,?\\s+(\\d{4}))?`, 'g'), (m, mo, d, y) => {
    if (+d < 1 || +d > 31) return m;
    return `${monthName(mo)} ${ordWords(+d)}${y ? ', ' + yearWords(+y) : ''}`;
  });
  sub(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_RE})\\b\\.?(?:,?\\s+(\\d{4}))?`, 'g'), (m, d, mo, y) => (+d < 1 || +d > 31 ? m : `the ${ordWords(+d)} of ${monthName(mo)}${y ? ', ' + yearWords(+y) : ''}`));

  // --- money (symbol first): $5.44B, €5.44 billion, ₹1,000 crore, $116, $5.44
  sub(/([$€£₹¥])\s?(\d[\d,]*(?:\.\d+)?)(?:\s?(trillion|billion|million|thousand|crores?|lakhs?|bn|mn|[kKmMbBtT])(?![a-zA-Z]))?/g, (m, sym, num, sc, offset, whole) => {
    const [one, many, cOne, cMany] = CUR[sym];
    const scale = sc ? SCALE[sc.toLowerCase()] : null;
    const nextWord = whole.slice(offset + m.length).replace(/^\s+/, '');
    const adj = MONEY_ADJ_NOUN.test(nextWord); // "a $50 million offer" → "fifty million dollar offer"
    if (scale) return `${numWords(num)} ${scale} ${adj ? one : many}`;
    const [i, d] = num.replace(/,/g, '').split('.');
    if (d && d.length === 2 && sym !== '¥') {
      const cents = parseInt(d, 10);
      const iv = parseInt(i, 10);
      const part = iv ? `${intWords(iv)} ${iv === 1 ? one : many}` : '';
      const cpart = cents ? `${intWords(cents)} ${cents === 1 ? cOne : cMany}` : '';
      return [part, cpart].filter(Boolean).join(' and ');
    }
    return `${numWords(num)} ${(parseFloat(num.replace(/,/g, '')) === 1 && !d) || adj ? one : many}`;
  });
  sub(/\b(\d[\d,]*(?:\.\d+)?)\s?(USD|EUR|GBP|INR)\b/g, (m, n, c) => `${numWords(n)} ${{USD: 'US dollars', EUR: 'euros', GBP: 'pounds', INR: 'rupees'}[c]}`);

  // --- ranges with percent: 40–50%  /  year ranges: 2007–2013  /  generic number ranges
  sub(/(\d[\d,]*(?:\.\d+)?)\s?[–—-]\s?(\d[\d,]*(?:\.\d+)?)\s?%/g, (m, a, b) => `${numWords(a)} to ${numWords(b)} percent`);
  sub(/\b(1[1-9]\d\d|20\d\d)\s?[–—-]\s?(1[1-9]\d\d|20\d\d)\b/g, (m, a, b) => `${yearWords(+a)} to ${yearWords(+b)}`);
  sub(/\b(1[1-9]\d\d|20\d\d)\s?[–—-]\s?(\d{2})\b/g, (m, a, b) => `${yearWords(+a)} to ${yearWords(Math.floor(+a / 100) * 100 + +b)}`);

  // --- percent: 49.4%, +4.2%, -3%
  sub(/(^|[\s(])([+\-−])?(\d[\d,]*(?:\.\d+)?)\s?%/g, (m, pre, sign, n) => `${pre}${sign === '+' ? 'plus ' : sign ? 'minus ' : ''}${numWords(n)} percent`);

  // --- times: 3:30 PM, 9am, at 14:05
  sub(/\b(\d{1,2}):(\d{2})\s?(?:([ap])\.m\.|([ap])m\b)/gi, (m, h, mi, a1, a2) => `${timeWords(+h, +mi)} ${(a1 || a2).toUpperCase()} M`);
  sub(/\b(\d{1,2})\s?(?:([ap])\.m\.|([ap])m\b)/gi, (m, h, a1, a2) => `${ONES[+h] ?? h} ${(a1 || a2).toUpperCase()} M`);
  sub(/\b(at|by|until|around|before|after|from)\s(\d{1,2}):(\d{2})\b(?!\d)/gi, (m, p, h, mi) => (+h <= 24 && +mi < 60 ? `${p} ${timeWords(+h, +mi)}` : m));

  // --- quarters / fiscal years / decades
  sub(/\bQ([1-4])\b(?:\s+(?:of\s+)?(\d{4}))?/g, (m, q, y) => `Q ${ONES[+q]}${y ? ' of ' + yearWords(+y) : ''}`);
  sub(/\bFY\s?'?(\d{2}|\d{4})\b/g, (m, y) => `F Y ${y.length === 4 ? yearWords(+y) : below100(+y)}`);
  sub(/\b2000s\b/g, () => 'two thousands');
  sub(/\b(1[1-9]|20)(\d)0s\b/g, (m, a, b) => `${below100(+a)} ${TENS_PLURAL[+b * 10]}`);
  sub(/(^|[\s(])'(\d)0s\b/g, (m, pre, d) => `${pre}${TENS_PLURAL[+d * 10]}`);

  // --- ordinals: 3rd, 21st
  sub(/\b(\d+)(st|nd|rd|th)\b/g, (m, n) => ordWords(+n));

  // --- years (context-sensitive) — before plain numbers
  // A plausible year (1100–2099, no commas/decimals) is read as a YEAR unless a count noun follows ("2000 employees")
  // or a quantity word precedes it ("about 2000", "more than 1500").
  t = t.replace(/(^|[\s(“"'])(1[1-9]\d\d|20\d\d)(?![\d,.]*\d)(?=([^\n]{0,24}))/g, (m, pre, y, after, offset, whole) => {
    const before = whole.slice(0, offset + pre.length).trimEnd();
    const prevWord = (before.match(/([A-Za-z]+)$/) ?? [])[1]?.toLowerCase();
    const next = after.replace(/^\s+/, '');
    const isYear = !COUNT_NOUN.test(next) && !(prevWord && COUNTISH_PREV.has(prevWord));
    return isYear ? `${pre}${yearWords(+y)}` : m;
  });

  // --- multipliers & suffixes: 10x, 5M, 3.2bn, 50K
  sub(/\b(\d+(?:\.\d+)?)\s?[x×](?![a-zA-Z0-9])/g, (m, n) => `${numWords(n)} times`);
  sub(/\b(\d+(?:\.\d+)?)\s?(bn|mn|K|M|B|T)\b/g, (m, n, s) => `${numWords(n)} ${SCALE[s.toLowerCase()]}`);

  // --- units
  const unitRe = Object.keys(UNITS).sort((a, b) => b.length - a.length).map((u) => u.replace(/[/°]/g, (c) => '\\' + c)).join('|');
  sub(new RegExp(`(\\d[\\d,]*(?:\\.\\d+)?)\\s?(${unitRe})(?![a-zA-Z])`, 'g'), (m, n, u) => `${numWords(n)} ${UNITS[u]}`);

  // --- ratios, fractions, symbols before plain numbers
  sub(/\b(\d+):(\d+)\b/g, (m, a, b) => `${numWords(a)} to ${numWords(b)}`);
  sub(/\b1\/2\b/g, () => 'one half');
  sub(/\b1\/4\b/g, () => 'one quarter');
  sub(/\b3\/4\b/g, () => 'three quarters');
  sub(/(?:#|\bNo\.\s?)(\d+)/g, (m, n) => `number ${numWords(n)}`);
  sub(/\b\d+(?:\.\d+){2,}\b/g, (m) => m.split('.').map((x) => numWords(x)).join(' point '));

  // --- everything left: negatives, comma-numbers, decimals, integers (+ scale words stay as typed: "5.44 billion")
  sub(/(^|[\s(])[-−](\d)/g, (m, pre, d) => `${pre}minus ${d}`);
  sub(/(?<![\w.])(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?(?![\w])/g, (m, i, d) => numWords(i + (d ?? '')));
  sub(/(?<=[A-Za-z])-(\d+)\b/g, (m, n) => '-' + numWords(n)); // COVID-19 → COVID-nineteen

  // --- symbols & abbreviations
  sub(/\s&\s/g, ' and ');
  sub(/\s\+\s/g, ' plus ');
  sub(/[≈~]\s?(?=\w)/g, 'about ');
  sub(/\bvs\.?(?=\s)/gi, 'versus');
  sub(/\bapprox\./gi, 'approximately');
  sub(/\be\.g\./gi, 'for example');
  sub(/\bi\.e\./gi, 'that is');
  sub(/\betc\./gi, 'and so on');
  sub(/\s→\s/g, ', then ');

  return t.trim().replace(/\s{2,}/g, ' ');
};

function timeWords(h, m) {
  const hh = h === 0 ? 'twelve' : h > 12 ? ONES[h - 12] ?? String(h) : ONES[h];
  if (m === 0) return `${hh} o'clock`;
  if (m < 10) return `${hh} oh ${ONES[m]}`;
  return `${hh} ${below100(m)}`;
}

// ---------- CLI: self-test and episode filler ----------
const self = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === self) {
  const args = process.argv.slice(2);
  if (args.includes('--test')) {
    const cases = [
      ['In 1927 Zeigarnik ran a test.', 'In nineteen twenty-seven Zeigarnik ran a test.'],
      ['It happened in 2007.', 'It happened in two thousand seven.'],
      ['By 2011 Samsung had passed Nokia.', 'By twenty eleven Samsung had passed Nokia.'],
      ['In 2000 it began.', 'In two thousand it began.'],
      ['2025 was different.', 'twenty twenty-five was different.'],
      ['The company had 2000 employees.', 'The company had two thousand employees.'],
      ['From 2007–2013 sales fell.', 'From two thousand seven to twenty thirteen sales fell.'],
      ['Through the 1990s and the 2000s.', 'Through the nineteen nineties and the two thousands.'],
      ["Back in the '90s.", 'Back in the nineties.'],
      ['Nokia held 49.4% of sales.', 'Nokia held forty-nine point four percent of sales.'],
      ['Between 40–50% of people.', 'Between forty to fifty percent of people.'],
      ['Up +4.2% this year.', 'Up plus four point two percent this year.'],
      ['Oil hit $116 a barrel.', 'Oil hit one hundred sixteen dollars a barrel.'],
      ['The debt is $39 trillion.', 'The debt is thirty-nine trillion dollars.'],
      ['It cost $5.44 each.', 'It cost five dollars and forty-four cents each.'],
      ['It cost $1.', 'It cost one dollar.'],
      ['Raised $50M in funding.', 'Raised fifty million dollars in funding.'],
      ['A ₹1,000 crore plan.', 'A one thousand crore rupee plan.'],
      ['In Q3 2011, sales rose.', 'In Q three of twenty eleven, sales rose.'],
      ['See you at 3:30 PM.', 'See you at three thirty P M.'],
      ['Meet at 9am sharp.', 'Meet at nine A M sharp.'],
      ['The call is at 14:05 today.', "The call is at two oh five today."],
      ['On February 11, 2011 it was announced.', 'On February eleventh, twenty eleven it was announced.'],
      ['Feb 11 was the day.', 'February eleventh was the day.'],
      ['On 11 February it began.', 'On the eleventh of February it began.'],
      ['The 3rd quarter and the 21st century.', 'The third quarter and the twenty-first century.'],
      ['Sales grew 10x in a year.', 'Sales grew ten times in a year.'],
      ['5M users and 3.2bn views.', 'five million users and three point two billion views.'],
      ['A 5km run at 100 mph.', 'A five kilometers run at one hundred miles per hour.'],
      ['Storage of 512GB.', 'Storage of five hundred twelve gigabytes.'],
      ['1,200,000 copies sold.', 'one million two hundred thousand copies sold.'],
      ['A 2025 meta-analysis found nothing.', 'A twenty twenty-five meta-analysis found nothing.'],
      ['It had about 2000 fans and more than 1500 seats.', 'It had about two thousand fans and more than one thousand five hundred seats.'],
      ['A $50 million offer came in 2000.', 'A fifty million dollar offer came in two thousand.'],
      ['It cost $50 million today.', 'It cost fifty million dollars today.'],
      ['A €5.44 billion deal.', 'A five point four four billion euro deal.'],
      ['Ranked #1 worldwide.', 'Ranked number one worldwide.'],
      ['Apple & Google vs. Nokia.', 'Apple and Google versus Nokia.'],
      ['The FY24 results.', 'The F Y twenty-four results.'],
      ['A ratio of 3:1 here.', 'A ratio of three to one here.'],
      ['COVID-19 hit.', 'COVID-nineteen hit.'],
      ['Windows 7 and iPhone 15.', 'Windows seven and iPhone fifteen.'],
      ['It grew 3.5 times.', 'It grew three point five times.'],
      ['Temperatures hit 40°C.', 'Temperatures hit forty degrees Celsius.'],
    ];
    let bad = 0;
    for (const [i, want] of cases) {
      const got = speak(i);
      if (got !== want) {
        bad++;
        console.log(`✖ ${i}\n   want: ${want}\n   got : ${got}`);
      }
    }
    console.log(bad ? `\n${bad}/${cases.length} failed` : `✔ ${cases.length} spoken-form tests passed`);
    process.exit(bad ? 1 : 0);
  }
  // npm run spoken -- <episodeId> [--force]
  const {loadEpisode, writeJSON, ok, info} = await import('./lib.mjs');
  const id = args.find((a) => !a.startsWith('--'));
  const {dir, sb} = loadEpisode(id);
  if (sb.language !== 'en') {
    info('Not an English episode — nothing to do.');
    process.exit(0);
  }
  const force = args.includes('--force');
  let changed = 0;
  sb.lines.forEach((l, i) => {
    const sp = speak(l.text);
    if (sp !== l.text) {
      if (!l.voice || force) {
        l.voice = sp;
        changed++;
      }
      console.log(`line ${i + 1}\n  text : ${l.text}\n  voice: ${l.voice}`);
    } else if (l.voice && force) delete l.voice;
  });
  if (changed || force) writeJSON(path.join(dir, 'storyboard.json'), sb);
  ok(`spoken forms ready (${changed} line(s) filled in). Read the voice lines once: numbers must sound like a person talking.`);
}
