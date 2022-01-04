import { Renderer } from "../../common/engine/Renderer.js";
import { GLTFLoader } from "../../common/engine/GLTFLoader.js";
import { mat4, quat, vec3 } from "../../lib/gl-matrix-module.js";

import { Light } from "../../common/gltf_components/Light.js";

import { HUDEnd } from "../menus/HUDs/HUDEnd.js";

import { GUI } from "../../lib/dat.gui.module.js";

// Define constants used in this class - used to avoid "magic numbers"
const cameraOrbitRotation = 0.005;
const cameraOrbitVector = [0, 0, 0]; // Used to rotate camera around scene
const cameraRotateVector = [0, 1, 0]; // Used to rotate camera around itself

const lightStartPosition = [-53, 90, 33];
const cameraStartPosition = [2.1, 4.2, 30];

export class EndGameComponent {
	constructor(gl) {
		// Set reference to global WebGL object
		this.gl = gl;

		// No tanks were destroyed
		this.tanksDestroyed = 0;

		// No HUD exits yet
		this.hud = null;
	}

	async init() {
		this.loader = new GLTFLoader();

		await this.loader.load("../../common/models/end/end_scene.gltf");

		// Get scene and from gltf file
		this.scene = await this.loader.loadScene(this.loader.defaultScene);
		this.camera = await this.loader.loadNode("Camera");
		this.ground = await this.loader.loadNode("ground");

		// Check if and scene exist
		if (!this.scene) {
			throw new Error("Scene not present in glTF");
		}

		// Set starting camera and light positions
		this._setLight();
		this._setCamera();

		// Create local instance of renderer and prepare scene and it's nodes
		this.renderer = new Renderer(this.gl);
		this.renderer.prepareScene(this.scene);
	}

	load(tanksDestroyed) {
		// Load needed variables and initialize hud
		this.tanksDestroyed = tanksDestroyed;

		this.hud = new HUDEnd(this.tanksDestroyed);
		this.hud.init();
	}

	update() {
		if (this.camera) {
			// Update transformation matrix of camera - this is needed to apply any changes made
			// in the debug menu
			this.camera.updateMatrix();
			this.camera.updateTransform();

			// Rotate camera around axis Y, with focal point being tank's bottom part - thus orbiting
			// around it
			vec3.rotateY(
				this.camera.translation,
				this.camera.translation,
				cameraOrbitVector,
				cameraOrbitRotation
			);

			// Rotate camera around itself - this is needed to ensure view stays on the tank
			this.camera.updateMatrix();
			mat4.rotate(
				this.camera.matrix,
				this.camera.matrix,
				cameraOrbitRotation,
				cameraRotateVector
			);

			// Update camera and top's transformations
			this.camera.updateTransform();
		}
	}

	render() {
		// If renderer, camera and light objects exits - render current scene - this is needed due
		// to the asynchronous nature of the init method
		if (this.renderer && this.camera && this.light) {
			this.renderer.render(this.scene, this.camera, this.light);
		}
	}

	remove() {
		// Remove all elements of HUD
		if (this.hud) {
			this.hud.hide();
		}
	}

	_setLight() {
		// Create new instance of light
		this.light = new Light();

		// Set starting light's position
		this.light.position = lightStartPosition;

		// Add light as to scene
		this.scene.addNode(this.light);
	}

	_setCamera() {
		mat4.fromTranslation(this.camera.matrix, cameraStartPosition);
		this.camera.updateTransform();
	}
}
