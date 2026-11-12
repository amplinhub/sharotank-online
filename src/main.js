/* Entry point. The game is still one shared scope (see tools/vite-game-concat.js):
   the files in src/game/ are joined in name order into a single ES module. */
import './styles.css';
import './three-global.js';
import 'virtual:sharotank-game';
