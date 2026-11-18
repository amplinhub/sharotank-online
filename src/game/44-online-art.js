/* ================= v30.0: «Онлайн рейтинг» — медали-достижения, значки, аватарки =================
   Только данные и SVG-строки; логика — в 43-drivers.js (вызывается во время игры, не при загрузке). */
/* [id, название, как получить]; порядок = порядок в сетке медалей */
const MEDALS=[
  ['first','Первая победа','Одолей любого босса.'],
  ['krot','Кротолов','Одолей «Крота» на свалке.'],
  ['hornet','Сбитый Шершень','Одолей «Шершня» в автосалоне.'],
  ['dragon','Укротитель','Одолей «Золотого дракона» в луна-парке.'],
  ['crypt','Отключение','Одолей «Энергобота» на кладбище.'],
  ['all4','Охотник','Одолей всех четырёх боссов.'],
  ['clean','Без царапины','Одолей босса, потеряв меньше 10% брони.'],
  ['fast','Молния','Одолей босса быстрее чем за 90 секунд.'],
  ['shadow','Тихая смерть','Одолей босса на «Тени».'],
  ['arty','Артиллерист','Одолей босса на «РСЗО-537».'],
  ['k100','Боец','Уничтожь 100 роботов.'],
  ['k1000','Ветеран','Уничтожь 1000 роботов.'],
  ['k5000','Легенда','Уничтожь 5000 роботов.'],
  ['ram','Таранщик','Добей 25 роботов тараном.'],
  ['drones','ПВО','Сбей 30 «Сорок».'],
  ['katok','Каток на каток','Уничтожь 10 «Катков».'],
  ['rescue','Спасатель','Выведи 20 гражданских при эвакуациях.'],
  ['flags','Знаменосец','Довези до штаба 3 вражеских флага.'],
  ['streak','Неуязвимый','Выполни 10 заданий подряд, ни разу не будучи подбитым.'],
  ['tuned','Механик','Прокачай двигатель и броню одной машины до максимума.'],
  ['fleet','Автопарк','Собери все 7 машин.'],
  ['major','Майор','Дослужись до майора.'],
  ['team','Своя команда','Добавь в друзья 3 пилотов.'],
  ['radio','Связист','Отправь друзьям 10 сообщений.'],
  ['gift','Щедрый','Отправь друзьям 1000 лома в сумме.']];
/* значки: 24×24, линии цветом currentColor */
const MED_G={
  first:'<path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z"/>',
  krot:'<path d="M6 6h12l-6 13z"/><path d="M8.5 10h7M10 13.5h4"/>',
  hornet:'<circle cx="12" cy="13" r="3"/><path d="M3 7h18M12 7v3M12 16v4M8 20h8"/>',
  dragon:'<path d="M3 15c2-5 4-5 6 0s4 5 6 0 3-6 6-3"/><circle cx="19.5" cy="9.5" r="1"/>',
  crypt:'<path d="M8 7.5a6.5 6.5 0 1 0 8 0"/><path d="M12 4v8"/>',
  all4:'<path d="M7 4l3 3-3 3-3-3zM17 4l3 3-3 3-3-3zM7 14l3 3-3 3-3-3zM17 14l3 3-3 3-3-3z"/>',
  clean:'<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  fast:'<path d="M13 3L6 13h5l-1 8 7-10h-5z"/>',
  shadow:'<path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.5"/><path d="M4 20L20 4"/>',
  arty:'<path d="M5 19l5-12M10 19l5-12M15 19l5-12"/><path d="M8.5 7l1.5-3 1.5 3M13.5 7l1.5-3 1.5 3M18.5 7l1.5-3 1.5 3"/>',
  k100:'<circle cx="12" cy="12" r="6"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>',
  k1000:'<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>',
  k5000:'<path d="M4 17l1.5-9 4 4L12 6l2.5 6 4-4L20 17z"/><path d="M4 20h16"/>',
  ram:'<path d="M3 12h11M10 8l4 4-4 4"/><path d="M17 4v16M20 6v12"/>',
  drones:'<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 8l8 8M16 8l-8 8"/>',
  katok:'<circle cx="8" cy="15" r="4.5"/><path d="M8 13v4M6 15h4"/><path d="M12.5 15H20v-4h-3l-2-4h-4v8"/><circle cx="18" cy="17.5" r="2"/>',
  rescue:'<circle cx="12" cy="5.5" r="2.2"/><path d="M12 8v7M8 11h8M12 15l-3 5M12 15l3 5"/><path d="M18 4v4M16 6h4"/>',
  flags:'<path d="M6 21V3"/><path d="M6 4h11l-2.5 4L17 12H6"/>',
  streak:'<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1.5 1 2 2.5 2 4 1-1.5 1-4 1-7z"/>',
  tuned:'<path d="M15 4a4.5 4.5 0 0 0-4.3 5.8L4 16.5 7.5 20l6.7-6.7A4.5 4.5 0 0 0 20 9l-3 1-3-3 1-3z"/>',
  fleet:'<path d="M3 15h18v3H3zM6 15l1.5-4h7l1.5 4M14 11V8h6"/><circle cx="7" cy="19.5" r="1"/><circle cx="12" cy="19.5" r="1"/><circle cx="17" cy="19.5" r="1"/>',
  major:'<path d="M5 13l7-4 7 4M5 18l7-4 7 4"/><path d="M12 2.5l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z"/>',
  team:'<circle cx="9" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M3.5 19c.5-4 3-6 5.5-6s5 2 5.5 6M14 13.5c3 0 5.5 1.8 6 5.5"/>',
  radio:'<circle cx="12" cy="13" r="1.6"/><path d="M8.5 9.5a5 5 0 0 0 0 7M15.5 9.5a5 5 0 0 1 0 7M5.5 6.5a9 9 0 0 0 0 13M18.5 6.5a9 9 0 0 1 0 13M12 15v6"/>',
  gift:'<path d="M4 10h16v4H4zM5.5 14h13v6h-13zM12 10v10"/><path d="M12 10c-1-3-5-4-5-1.5S11 10 12 10c1 0 5 1 5-1.5S13 7 12 10z"/>'};
const medSvg=id=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${MED_G[id]||''}</svg>`;

/* аватарки: 9 животных, 32×32, плоские фигуры на круглой подложке */
const AVATARS=[
  ['Кот','<path d="M7 13L8 4l6 6M25 13l-1-9-6 6" fill="#e8a24a"/><circle cx="16" cy="18" r="10" fill="#e8a24a"/><path d="M9 5.5l1 5M23 5.5l-1 5" stroke="#b5732a" stroke-width="1.4"/><ellipse cx="12" cy="17" rx="1.4" ry="2" fill="#1b2430"/><ellipse cx="20" cy="17" rx="1.4" ry="2" fill="#1b2430"/><path d="M14.6 21h2.8L16 22.6z" fill="#d9566a"/><path d="M5 20l6 .5M5 23l6-1M27 20l-6 .5M27 23l-6-1" stroke="#f4d9b0" stroke-width=".9"/>'],
  ['Лиса','<path d="M5 9l3-6 5 6M27 9l-3-6-5 6" fill="#e2672c"/><path d="M4 10h24L16 28z" fill="#e2672c"/><path d="M4 10l12 18-5-12zM28 10L16 28l5-12z" fill="#f6efe6"/><circle cx="11.5" cy="15" r="1.4" fill="#1b2430"/><circle cx="20.5" cy="15" r="1.4" fill="#1b2430"/><circle cx="16" cy="26" r="1.6" fill="#1b2430"/>'],
  ['Медведь','<circle cx="8" cy="9" r="4.2" fill="#8a5a3a"/><circle cx="24" cy="9" r="4.2" fill="#8a5a3a"/><circle cx="8" cy="9" r="2" fill="#c08a62"/><circle cx="24" cy="9" r="2" fill="#c08a62"/><circle cx="16" cy="17.5" r="10.5" fill="#8a5a3a"/><ellipse cx="16" cy="21.5" rx="5" ry="4" fill="#d3a47c"/><ellipse cx="16" cy="19.6" rx="2" ry="1.4" fill="#1b2430"/><circle cx="11.5" cy="15" r="1.4" fill="#1b2430"/><circle cx="20.5" cy="15" r="1.4" fill="#1b2430"/>'],
  ['Сова','<path d="M7 8l3 4M25 8l-3 4" stroke="#7a6248" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="16" cy="18" rx="10" ry="11" fill="#7a6248"/><ellipse cx="16" cy="22" rx="6" ry="5.5" fill="#c9b08a"/><circle cx="11.5" cy="14" r="4" fill="#f4ecd8"/><circle cx="20.5" cy="14" r="4" fill="#f4ecd8"/><circle cx="11.5" cy="14" r="2" fill="#1b2430"/><circle cx="20.5" cy="14" r="2" fill="#1b2430"/><path d="M14.5 17.5h3L16 20.5z" fill="#f2b53a"/>'],
  ['Волк','<path d="M6 12L7 2l6 7M26 12L25 2l-6 7" fill="#7d8794"/><path d="M5 11h22l-3.5 9L16 29l-7.5-9z" fill="#7d8794"/><path d="M11 18l5 11 5-11-5 3z" fill="#d6dbe1"/><path d="M8 4.5l1.5 4.5M24 4.5L22.5 9" stroke="#4d5560" stroke-width="1.3"/><path d="M10 14l3 1.4M22 14l-3 1.4" stroke="#f2c84a" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="16" cy="26.5" rx="1.8" ry="1.3" fill="#1b2430"/>'],
  ['Заяц','<ellipse cx="11.5" cy="8" rx="2.8" ry="7.5" fill="#d9d6e0" transform="rotate(-10 11.5 8)"/><ellipse cx="20.5" cy="8" rx="2.8" ry="7.5" fill="#d9d6e0" transform="rotate(10 20.5 8)"/><ellipse cx="11.5" cy="8.5" rx="1.2" ry="5" fill="#e8a6b4" transform="rotate(-10 11.5 8.5)"/><ellipse cx="20.5" cy="8.5" rx="1.2" ry="5" fill="#e8a6b4" transform="rotate(10 20.5 8.5)"/><circle cx="16" cy="20" r="9" fill="#d9d6e0"/><circle cx="12.5" cy="19" r="1.3" fill="#1b2430"/><circle cx="19.5" cy="19" r="1.3" fill="#1b2430"/><path d="M15 22.5h2L16 24z" fill="#d9566a"/><path d="M16 24v2" stroke="#9a96a6" stroke-width=".9"/>'],
  ['Панда','<circle cx="8.5" cy="9" r="4" fill="#1b2430"/><circle cx="23.5" cy="9" r="4" fill="#1b2430"/><circle cx="16" cy="17.5" r="10.5" fill="#f4f4f2"/><ellipse cx="11.5" cy="16" rx="3" ry="3.8" fill="#1b2430" transform="rotate(-25 11.5 16)"/><ellipse cx="20.5" cy="16" rx="3" ry="3.8" fill="#1b2430" transform="rotate(25 20.5 16)"/><circle cx="12" cy="15.6" r="1" fill="#f4f4f2"/><circle cx="20" cy="15.6" r="1" fill="#f4f4f2"/><ellipse cx="16" cy="21.5" rx="1.8" ry="1.2" fill="#1b2430"/>'],
  ['Тигр','<circle cx="8" cy="9" r="3.6" fill="#ef8a2a"/><circle cx="24" cy="9" r="3.6" fill="#ef8a2a"/><circle cx="16" cy="18" r="10.5" fill="#ef8a2a"/><ellipse cx="16" cy="22.5" rx="6" ry="4.5" fill="#f8efe2"/><path d="M16 7.5v4M12 8.5l1 3M20 8.5l-1 3M5.8 15h3.5M5.6 19h3.4M26.2 15h-3.5M26.4 19H23" stroke="#1b2430" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="15.5" r="1.3" fill="#1b2430"/><circle cx="20" cy="15.5" r="1.3" fill="#1b2430"/><path d="M14.4 20.5h3.2L16 22.3z" fill="#1b2430"/>'],
  ['Пингвин','<ellipse cx="16" cy="17" rx="11" ry="12.5" fill="#26313f"/><path d="M16 9c-4.5 0-7.5 3-7.5 8.5 0 6 3.5 10 7.5 10s7.5-4 7.5-10C23.5 12 20.5 9 16 9z" fill="#f4f4f2"/><circle cx="13" cy="15" r="1.4" fill="#1b2430"/><circle cx="19" cy="15" r="1.4" fill="#1b2430"/><path d="M13.5 18h5L16 21.5z" fill="#f2a33a"/>']];
const avSvg=i=>{ const a=AVATARS[i|0]||AVATARS[0]; return `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#132034"/>${a[1]}</svg>`; };
