/* Заголовок склейки: что игра берёт из настоящих модулей src/lib (tools/vite-game-concat.js кладёт этот файл первым).
   Правило: файл игры, ставший модулем, переезжает в src/lib, а его экспорты добавляются сюда. */
import { SHT } from '@lib/state.js';
import { $, TAU, clamp, lerp, wrapA, rnd, mulberry32, hash3, smooth, wmOnce, REDUCED } from '@lib/util.js';
import { bindSound, SND, sndAt, sndOff, sndOut, sInit, engineInit, ENG_VOICE, sfxRev, engineUpdate, sNz, sO, sfxMg, sfxCannon, sfxRocket, sfxBoom, sfxTick, sfxGlass, sfxThud, sfxClick, sfxBuy, sfxPickup, sfxCharge, sfxJump, sfxClang, sfxHatch, sfxMgE, sfxCannonE, sfxBeam, sfxCreak, sfxWrench } from '@lib/sound.js';
import { bindParticles, G, _q, _v, DEB, LINES, SMOKE, FIRE, setSmoke, Puffs, flashPools, debInit, debSpawn, debUpdate, spkInit, spark, spkUpdate, groundFlash, flashUpdate, splashSmall, splashBig } from '@lib/particles.js';
