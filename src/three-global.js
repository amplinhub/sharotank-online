/* The game code uses the global THREE (r128 API). Bundling it from npm removes the CDN dependency. */
import * as THREE from 'three';
window.THREE = THREE;
