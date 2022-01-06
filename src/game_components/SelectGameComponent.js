import { Renderer } from "../../common/engine/Renderer.js";

import { GLTFLoader } from "../../common/engine/GLTFLoader.js";
import { mat4, quat, vec3 } from "../../lib/gl-matrix-module.js";

import { Light } from "../../common/gltf_components/Light.js";

import { HUDSelect } from "../menus/HUDs/HUDSelect.js";

// Define constants used in this class - used to avoid "magic numbers"
const bottomRotateVector = [0, 1, 0]; // Used to rotate tank around itself

const rotationIncrement = 0.005;
const rotationLimit = 6.25;

const lightStartPosition = [-53, 90, 33];
const cameraStartPosition = [0, 4.6, 16.85];

const cameraAngle = -0.14; // Point camera a bit downwards - look at tank from above

export class SelectGameComponent {
	constructor(gl) {
		// Set reference to global WebGl object
		this.gl = gl;

		// Set current tank index to 0 - first tank
		this.currTank = 0;

		// Set paths to tank models
		this.tankModelPath = [
			"../../common/models/tanks/tank1/tank1.gltf",
			"../../common/models/tanks/tank2/tank2.gltf",
			"../../common/models/tanks/tank3/tank3.gltf",
		];

		// Set tank attribute presets
		this.presets = [
			[100, 1, 10],
			[75, 2, 8],
			[200, 0.5, 20],
		];
	}

	async init() {
		// Create new GLTF loader
		this.loader = new GLTFLoader();

		// Load floor file that contains floor tile on which to place tank
		await this.loader.load("../../common/models/floor/floor.gltf");

		// Load floor node to add to scene
		this.floor = await this.loader.loadNode("ground");

		// Load first tank file
		await this.loader.load(this.tankModelPath[0]);

		// Get scene and camera from gltf file
		this.scene = await this.loader.loadScene(this.loader.defaultScene);
		this.camera = await this.loader.loadNode("Camera");

		// Check if camera and scene exist
		if (!this.scene || !this.camera) {
			throw new Error("Scene or Camera not present in glTF");
		}

		if (!this.camera.camera) {
			throw new Error("Camera node does not contain a camera reference");
		}

		// Get top and bottom part of tank - they have to be separate so we can control both
		// independently
		this.tankBot = await this.loader.loadNode("bot1");
		this.tankTop = await this.loader.loadNode("top1");

		// Set top as child of bottom, so when bottom moves top also moves
		this.tankBot.addChild(this.tankTop);

		// Add floor as node of scene - ensuring it will be rendered
		this.scene.addNode(this.floor);

		// Set camera and light to viewing position
		this._setCameraAndLight();

		// Set rotation counter for tank
		this.rot = 0.005;

		// Tank model will rotate
		this.rotate = true;

		// Create HUD - used to show tank's stats
		this.hud = new HUDSelect();
		this.hud.init();

		// Set attributes as first tank's attributes
		this.hud.setHealth(this.presets[0][0]);
		this.hud.setSpeed(this.presets[0][1]);
		this.hud.setDamage(this.presets[0][2]);

		// Create local instance of renderer and prepare scene and it's nodes
		this.renderer = new Renderer(this.gl);
		this.renderer.prepareScene(this.scene);
	}

	update() {
		// If tank's bottom and top part are loaded - this check is needed due to the asynchronous
		// nature of the init method
		if (this.tankBot && this.tankTop) {
			if (this.rotate) {
				// Get reference to tank's bottom's matrix
				let tankBotMatrix = this.tankBot.matrix;

				// Create identity matrix that will hold tank's bottom's translation matrix
				let trans = vec3.create();

				// Get current translation of tank's bottom
				mat4.getTranslation(trans, tankBotMatrix);
				// Generate new transformation matrix from given rotation
				mat4.fromRotation(tankBotMatrix, -this.rot, bottomRotateVector);
				// Translate tank's bottom back to it's original position
				mat4.translate(tankBotMatrix, tankBotMatrix, trans);

				this.tankBot.updateTransform();

				// Get reference to floor's matrix
				let floorMatrix = this.floor.matrix;

				// Create identity matrix that will hold floor'stranslation matrix
				let trans2 = vec3.create();

				// Get current translation of tank's bottom
				mat4.getTranslation(trans2, floorMatrix);
				// Generate new transformation matrix from given rotation
				mat4.fromRotation(floorMatrix, -this.rot, bottomRotateVector);
				// Translate tank's bottom back to it's original position
				mat4.translate(floorMatrix, floorMatrix, trans2);

				this.floor.updateTransform();

				this.rot += rotationIncrement;

				// If rotation is over 6.25 reset it to 0 - this is needed to prevent overflows
				// due to constant increase of rot variable
				if (this.rot > rotationLimit) {
					this.rot = 0;
				}
			}
		}
	}

	render() {
		// If renderer, camera and light objects exits - render current scene - this is needed due
		// to the asynchronous nature of the init method
		if (this.renderer && this.camera && this.light) {
			this.renderer.render(this.scene, this.camera, this.light);
		}
	}

	setMenuManager(menuManager) {
		// Set local instance of menu manager
		this.menuManager = menuManager;
	}

	unload() {
		this.hud.hide();

		// Return anything that is needed in MainGameComponent
		return this.tankModelPath[this.currTank];
	}

	async swapTank() {
		// Increase currently selected tank index, if over limit reset to first tank
		this.currTank++;

		if (this.currTank > 2) {
			this.currTank = 0;
		}

		// Load new tank file
		await this.loader.load(this.tankModelPath[this.currTank]);

		// Reload scene and camera
		this.scene = await this.loader.loadScene(this.loader.defaultScene);
		this.camera = await this.loader.loadNode("Camera");

		// Clear screen to prepare scene for next selected tank
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		// Load bottom and top part of newly selected tank
		this.tankBot = await this.loader.loadNode("bot" + (this.currTank + 1));
		this.tankTop = await this.loader.loadNode("top" + (this.currTank + 1));

		// Add top part of tank as child of bottom part
		this.tankBot.addChild(this.tankTop);

		// Add floor as node of newly created scene
		this.scene.addNode(this.floor);

		// Reposition camera and light - this ensures propper viewing angle of select screen
		this._setCameraAndLight();

		// Remake display
		this.hud.hide();
		this.hud = new HUDSelect();
		this.hud.init();

		// Set tank statistics on hud
		this.hud.setHealth(this.presets[this.currTank][0]);
		this.hud.setSpeed(this.presets[this.currTank][1]);
		this.hud.setDamage(this.presets[this.currTank][2]);

		// Prepare newly loaded scene
		this.renderer.prepareScene(this.scene);
	}

	_rotate() {
		this.rotate = !this.rotate;
	}

	_setCameraAndLight() {
		// Create new light and add as node of scene
		this.light = new Light();
		this.scene.addNode(this.light);

		// Set starting light's position
		this.light.position = lightStartPosition;

		// Update camera's transformation matrix
		this.camera.updateTransform();

		// Move camera to specific location
		mat4.fromTranslation(this.camera.matrix, cameraStartPosition);
		this.camera.updateTransform();

		// Rotate camera around x-axis to ensure good viewing angle of tank
		quat.rotateX(this.camera.rotation, this.camera.rotation, cameraAngle);
		this.camera.updateMatrix();
	}
}
