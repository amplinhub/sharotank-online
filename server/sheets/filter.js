/* Фильтр мата и ругательств (русский + английский) для сообщений «Онлайн рейтинга». Часть Code.gs (собирается tools/build-gas.mjs).
   shClean(text) → {text, bad}: запрещённые слова заменены случайными символами той же длины, bad — найдено ли что-то.
   Ловит обходы: латиница вместо кириллицы (xyй, cyka), цифры (3,0,4,6…), разделители внутри слова (х*й, п.и.з.д.а),
   буквы через пробел (х у й), повторы букв (хууууй). Ложных срабатываний на «страхую», «употреблять», «небо», «мандарин» нет. */
var SH_TO_CYR = { a: 'а', b: 'б', c: 'с', e: 'е', h: 'н', k: 'к', m: 'м', o: 'о', p: 'р', t: 'т', x: 'х', y: 'у', u: 'и', n: 'п', r: 'г', '3': 'з', '0': 'о', '4': 'ч', '6': 'б', '@': 'а', '$': 'с', 'ё': 'е', 'й': 'й' };
var SH_TO_LAT = { 'а': 'a', 'в': 'b', 'с': 'c', 'е': 'e', 'ё': 'e', 'н': 'h', 'к': 'k', 'м': 'm', 'о': 'o', 'р': 'p', 'т': 't', 'х': 'x', 'у': 'y', 'и': 'u', '0': 'o', '1': 'i', '!': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's' };
/* phonetic transliteration (blyat, pizdec, suka, nahuy) */
var SH_DIG = [['shch', 'щ'], ['sch', 'щ'], ['ya', 'я'], ['yo', 'е'], ['yu', 'ю'], ['ch', 'ч'], ['sh', 'ш'], ['zh', 'ж'], ['kh', 'х'], ['ts', 'ц'], ['ye', 'е']];
var SH_PHON = { a: 'а', b: 'б', v: 'в', w: 'в', g: 'г', d: 'д', e: 'е', z: 'з', i: 'и', j: 'й', y: 'й', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р', s: 'с', t: 'т', u: 'у', f: 'ф', h: 'х', x: 'х', c: 'ц', q: 'к', '3': 'з', '0': 'о', '4': 'ч', '6': 'б', '@': 'а', '$': 'с', 'ё': 'е' };
function shPhon(w) { w = w.toLowerCase(); for (var i = 0; i < SH_DIG.length; i++) w = w.split(SH_DIG[i][0]).join(SH_DIG[i][1]); return w; }
var SH_BAD_RU = [
  /ху[йяеиюё]/, /п[ие]зд/, /бляд/, /блят/, /(?:^|[^еоаирг])бля/, /(?:^|[^нсрлхтгдк])еб(?:ан|уч|л[оияа]|ат|аш|ал|н|и[сш]|ок|ыр)/,
  /^(?:за|вы|у|до|об|от|на|по|при|про|раз|рас|съ|въ|под|пере|недо|из|вз|с|отъ|подъ|разъ)ъ?еб(?:а|у|л|н|ок|он|ош|ыр|ись|ет|ут|ен)/,
  /долб[ао]еб/, /муд[аои]к/, /мудил/, /мудозв/, /п[ие]д[оа]?р/, /педик/, /педераст/, /пидр/, /г[ао]ндон/, /залуп/, /манд[ауоеыи](?!рин|ат)/,
  /шлюх/, /^сук(?:а|и|е|у|ой|ам|ами|ах|ин|ина|ины|ино)$/, /сучк/, /сучар/, /сучь/, /дроч/, /говн/, /говен/, /жоп/, /шалав/, /^хер$/, /херн/, /херов/,
  /^чмо/, /уеб/, /ублюд/, /выбляд/, /дебил/, /дибил/, /кретин/, /идиот/, /имбецил/, /^урод/, /падл/, /гнида/, /мраз[ьи]/, /^тварь/, /пидарас/, /пидорас/, /шмар/, /курв/];
var SH_BAD_EN = [/fuck/, /fuk/, /fck/, /phuck/, /shit/, /bitch/, /cunt/, /^dick/, /dickhead/, /^cock(?!pit|tail|roach|er)/, /puss(?:y|ies)/, /asshole/, /^ass$/, /bastard/, /whore/, /slut/,
  /^fag/, /nigg/, /motherf/, /wank/, /twat/, /retard/, /dumbass/, /douche/, /^prick/, /bollock/];
var SH_SKIP = /страх|скорбл|употреб|корабл|сабл|грабл|хлеб|небо|себе|ребен|мандарин|мандат|хулиган|хутор|кукушк|утвар/;
var SH_MASK = '#@%&*!$?§¤';

function shNorm(word, map) { var s = '', prev = ''; word = word.toLowerCase();
  for (var i = 0; i < word.length; i++) { var c = word[i], m = map[c] != null ? map[c] : c; if (!/[a-zа-яё]/.test(m)) continue; if (m === prev) continue; s += m; prev = m; }
  return s; }
function shBadRu(ru) { if (!ru || SH_SKIP.test(ru)) return false; for (var i = 0; i < SH_BAD_RU.length; i++) if (SH_BAD_RU[i].test(ru)) return true; return false; }
function shBadWord(w) { if (!w) return false; var en = shNorm(w, SH_TO_LAT);
  if (shBadRu(shNorm(w, SH_TO_CYR)) || (/[a-z]/i.test(w) && shBadRu(shNorm(shPhon(w), SH_PHON)))) return true;
  if (en) for (var j = 0; j < SH_BAD_EN.length; j++) if (SH_BAD_EN[j].test(en)) return true;
  return false; }
function shMask(n) { var s = ''; for (var i = 0; i < n; i++) s += SH_MASK[Math.floor(Math.random() * SH_MASK.length)]; return s; }
function shClean(text) {
  var parts = String(text).split(/(\s+)/), bad = false, i, j;
  /* letters typed one by one with spaces/dots between them: «х у й», «f u c k» */
  for (i = 0; i < parts.length; i++) {
    if (/\s/.test(parts[i]) || parts[i].length > 2) continue;
    var run = [i]; for (j = i + 2; j < parts.length && !/\s/.test(parts[j]) && parts[j].length <= 2; j += 2) run.push(j);
    if (run.length >= 3) { var joined = run.map(function (k) { return parts[k]; }).join('');
      if (shBadWord(joined)) { bad = true; run.forEach(function (k) { parts[k] = shMask(parts[k].length); }); } i = j - 1; }
  }
  for (i = 0; i < parts.length; i++) { if (/\s/.test(parts[i]) || /^[#@%&*!$?§¤]+$/.test(parts[i])) continue;
    if (shBadWord(parts[i])) { bad = true; parts[i] = shMask(parts[i].length); continue; }
    /* glued words: check each run of letters split by punctuation too («нахуй!», «бля,») */
    var sub = parts[i].split(/([^0-9A-Za-zА-Яа-яЁё@$!*]+)/);
    if (sub.length > 1) { var hit = false; for (j = 0; j < sub.length; j++) if (j % 2 === 0 && shBadWord(sub[j])) { sub[j] = shMask(sub[j].length); hit = true; }
      if (hit) { bad = true; parts[i] = sub.join(''); } } }
  return { text: parts.join(''), bad: bad };
}
