import { Game } from "./game/Game.js";
import { GUI } from "../lib/dat.gui.module.js";
import { Light } from "../common/gltf_components/Light.js";

let game = null;

document.addEventListener("DOMContentLoaded", () => {
	// Get canvas element
	const canvas = document.querySelector("canvas");
	//const gui = new GUI();
	// Create new game instance
	game = new Game(canvas);
});
