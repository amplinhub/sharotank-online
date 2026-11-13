/* Заголовок склейки: что игра берёт из настоящих модулей src/lib (tools/vite-game-concat.js кладёт этот файл первым).
   Правило: файл игры, ставший модулем, переезжает в src/lib, а его экспорты добавляются сюда. */
import { SHT } from '@lib/state.js';
import { $, TAU, clamp, lerp, wrapA, rnd, mulberry32, hash3, smooth, wmOnce, REDUCED } from '@lib/util.js';
