import { Renderer } from "../../common/engine/Renderer.js";
import { GLTFLoader } from "../../common/engine/GLTFLoader.js";
import { mat4, quat, vec3 } from "../../lib/gl-matrix-module.js";

import { Light } from "../../common/gltf_components/Light.js";

import { Player } from "../entities/Player.js";
import { Enemy } from "../entities/Enemy.js";
import { Powerup } from "../entities/Powerup.js";

import { EntityManager } from "../managers/EntityManager.js";

import { HUDGame } from "../menus/HUDs/HUDGame.js";
import { Physics } from "../../common/engine/Physics.js";

import { Raycaster } from "../../common/engine/Raycaster.js";

// Define constants used in this class - used to avoid "magic numbers"
const firstPathIndex = 144;
const numberOfPaths = 12;

const numberOfHPowerups = 7;
const numberOfAPowerups = 6;

const numberOfEnemies = 3;

const lightStartAttenuation = [1.2, 0.1, 0.06];
const cameraStartPosition = [-13.2, 3, 0];
const degrees90ToRadians = -1.57; // Used to rotate camera to point in same direction as tank
const cameraRotateVector = [0, 1, 0]; // Used to rotate camera around itself

const thunderRandomnessFactor = 0.6; // Lower number - thunder more often
const thunderShininessThresholdBottom = 5; // Threshold for when thunder occurs
const thunderShininessThresholdTop = 50; // Max shininess

export class MainGameComponent {
	constructor(gl, canvas) {
		// Set reference to global WebGl object
		this.gl = gl;

		// Path to selected tank is not chosen yet
		this.tankModelPath = null;

		// Set reference to global menu manager object as null
		this.menuManager = null;

		// Set reference to global sound manager object as null
		this.soundManager = null;
	}

	async init() {
		// Create new GLTF loader and load first tank
		this.loader = new GLTFLoader();

		await this.loader.load("../../common/models/bullet/bullet.gltf");

		this.bullet = await this.loader.loadNode("bullet");

		await this.loader.load("../../common/models/map/map.gltf");

		// Get scene and from gltf file
		this.scene = await this.loader.loadScene(this.loader.defaultScene);

		// Check scene exist
		if (!this.scene) {
			throw new Error("Scene not present in glTF");
		}

		// Load player and light position nodes
		this.playerPosition = await this.loader.loadNode("player");
		this.lightPosition = await this.loader.loadNode("light1");

		// Create containers to hold all game components
		// -pathPositions contains instances of Node class, as we only need their translation vectors
		// -powerupsHealth and powerupsAmmo contain instances of Powerup class, with differently
		//  set isHealth flags
		// -enemies contains instances of Enemy class
		// -enemiesDestroyed contains instances of Node class, as we only need their models and
		//  translation vectors
		this.pathPositions = new Array();

		this.powerupsHealth = new Array();
		this.powerupsAmmo = new Array();

		this.enemies = new Array();
		this.enemiesDestroyed = new Array();

		// Load all needed nodes on startup - ensures that minimal loading of files is done during
		// game runtime, thus increasing optimization
		await this._loadPaths();
		this._loadPowerups();
		this._loadEnemies();

		// Create empty player variable
		this.player = null;

		// Create empty raycaster and physics variables
		this.raycaster = null;
		this.physics = null;

		// Set array of flags of enemies destroyed - used to check if game was won or lost
		this.tanksDestroyed = [false, false, false];

		// Create new instance of entity manager - it manages the logic of all entities and contains
		// it so it doesn't pollute main classes
		this.entityManager = new EntityManager();

		// Create local instance of renderer and prepare scene and it's nodes
		this.renderer = new Renderer(this.gl);
		this.renderer.prepareScene(this.scene);
	}

	update(dt) {
		// If tank's bottom, top part and camera are loaded - this check is needed due to the asynchronous
		// nature of the init method
		if (this.tankBot && this.tankTop && this.camera && this.player && this.light) {
			this._simulateLightning(dt);
			this.physics.update(dt);

			// If player is dead
			if (this.player.getHealth() <= 0) {
				return -1;
			}

			// Check if all enemies are dead
			if (this._checkDeadEnemies()) {
				return -1;
			}

			// Check how many enemies are defeated
			this._checkEnemyStatus();

			// Update all entities in the game
			this.entityManager.update(dt);
		}
	}

	render() {
		// If renderer, camera and light objects exits - render current scene - this is needed due
		// to the asynchronous nature of the init method
		if (this.renderer && this.camera && this.light) {
			this.renderer.render(this.scene, this.camera, this.light);
		}
	}

	async load(tankModelPath) {
		// Load needed components from main game file
		this.tankModelPath = tankModelPath;

		// Get tank's name and tank's number
		this.tankName = this.tankModelPath.split("/").pop().split(".")[0];
		this.tankNumber = this.tankName.substring(this.tankName.length - 1);

		// Load tank file and extract bottom and top nodes
		await this.loader.load(tankModelPath);
		this.tankBot = await this.loader.loadNode("bot" + this.tankNumber);
		this.tankTop = await this.loader.loadNode("top" + this.tankNumber);

		// Load camera node
		this.camera = await this.loader.loadNode("Camera");

		// Set tank, light and camera's attributes, such as position, rotation, etc.
		this._setTank();
		this._setLight();
		this._setCamera();

		this.tankBot.isEntity = true;
		this.tankTop.isEntity = true;

		// Add nodes to scene
		this.scene.addNode(this.tankBot);
		this.scene.addNode(this.tankTop);
		this.scene.addNode(this.camera);

		// Create HUD - used to display player ammo and health
		this.hud = new HUDGame();
		this.hud.init();

		// Create player instance that contains current tank & camera
		this.player = new Player(
			parseInt(this.tankNumber - 1),
			this.tankBot,
			this.tankTop,
			this.camera,
			this.hud,
			this.soundManager
		);

		// Initialize entity manager with arrays of entities
		this.entityManager.init(this.enemies, this.powerupsHealth, this.powerupsAmmo, this.player);

		// Enable player event handlers
		this.player.enable();

		// Create new physics engine
		this.physics = new Physics(this.scene, this.player, this.enemies);

		this.raycaster = new Raycaster(this.scene, this.player, this.enemies, this.soundManager);

		this.player.setRaycaster(this.raycaster);

		for (let i = 0; i < this.enemies.length; i++) {
			this.enemies[i].setRaycaster(this.raycaster);
			this.enemies[i].setPlayer(this.player);
			this.enemies[i].setEnemies(this.enemies);
		}

		// Prepare current scene
		this.renderer.prepareScene(this.scene);
	}

	unload() {
		// Return anything that is needed in EndGameComponent
		return this.tanksDestroyed;
	}

	setMenuManager(menuManager) {
		// Set local instance of menu manager
		this.menuManager = menuManager;
	}

	setSoundManager(soundManager) {
		this.soundManager = soundManager;
	}

	remove() {
		// Remove newly added nodes from scene
		this.scene.removeNode(this.tankBot);
		this.scene.removeNode(this.tankTop);
		this.scene.removeNode(this.camera);

		// Remove player event listeners & unset player reference
		this.player.disable();
		this.player = undefined;

		// Clear entities from entity manager
		this.entityManager.clear();
	}

	async reload() {
		// This method is needed for when we remove powerup nodes from scene - we need to readd them
		// to the scene when we start the game again

		// Reload correct gltf file
		await this.loader.load("../../common/models/map/map.gltf");

		// Get scene and from gltf file
		this.scene = await this.loader.loadScene(this.loader.defaultScene);

		// Check scene exist
		if (!this.scene) {
			throw new Error("Scene not present in glTF");
		}

		// Load all needed nodes on startup - ensures that minimal loading of files is done during
		// game runtime, thus increasing optimization
		await this._loadPaths();
		await this._loadPowerups();
		await this._loadEnemies();
	}

	async _loadPaths() {
		this.pathPositions.splice(0, this.pathPositions.length);

		// Load all nodes from map containing path coordinates
		for (let i = 0; i < numberOfPaths; i++) {
			let pathPosition = await this.loader.loadNode(i + firstPathIndex);

			// Nodes must be cloned as their reference will be overwritten when next node is loaded
			this.pathPositions.push(pathPosition);
		}
	}

	async _loadPowerups() {
		// First load all health powerups and then all ammo powerups
		let powerupModel = null;

		this.powerupsHealth.splice(0, this.powerupsHealth.length);
		this.powerupsAmmo.splice(0, this.powerupsAmmo.length);

		for (let i = 0; i < numberOfHPowerups; i++) {
			powerupModel = await this.loader.loadNode("powerup.health.00" + (i + 1));
			powerupModel.isEntity = true;
			powerupModel.isHealth = true;

			this.powerupsHealth.push(new Powerup(powerupModel, true));
		}

		for (let i = 0; i < numberOfAPowerups; i++) {
			powerupModel = await this.loader.loadNode("powerup.ammo.00" + (i + 1));
			powerupModel.isEntity = true;
			powerupModel.isHealth = false;

			this.powerupsAmmo.push(new Powerup(powerupModel, false));
		}
	}

	async _loadEnemies() {
		this.enemies.splice(0, this.enemies.length);
		this.enemiesDestroyed.splice(0, this.enemiesDestroyed.length);

		// Load all enemy models and all enemy destroyed models
		for (let i = 0; i < numberOfEnemies; i++) {
			let enemyTop = await this.loader.loadNode("enemy." + (i + 1) + ".top");
			let enemyBot = await this.loader.loadNode("enemy." + (i + 1) + ".bot");
			enemyTop.isEntity = true;
			enemyBot.isEntity = true;

			let enemyTopDestroyed = await this.loader.loadNode("enemy." + (i + 1) + ".top.dead");
			let enemyBotDestroyed = await this.loader.loadNode("enemy." + (i + 1) + ".bot.dead");
			enemyTopDestroyed.isEntity = true;
			enemyBotDestroyed.isEntity = true;

			this.enemies.push(
				new Enemy(
					i != 2 ? 1 : 0,
					enemyTop,
					enemyBot,
					this.pathPositions,
					this.soundManager,
					enemyTopDestroyed,
					enemyBotDestroyed,
					i
				)
			);
			this.enemiesDestroyed.push([enemyTopDestroyed, enemyBotDestroyed]);
		}
	}

	_setTank() {
		// Set camera as child of tank's top
		this.tankTop.addChild(this.camera);
		// Set tank's top as child of tank's bottom - this is needed so transformations of tank
		// bottom are also applied to top
		this.tankBot.addChild(this.tankTop);

		// Set position of tank to player's empty node position
		mat4.copy(this.tankBot.matrix, this.playerPosition.matrix);

		// Update transformation matrices
		this.tankBot.updateTransform();
		this.tankTop.updateTransform();
	}

	_setLight() {
		// Create identity vector to hold light's node translation
		let lTranslation = vec3.create();

		// Get light's translation
		mat4.getTranslation(lTranslation, this.lightPosition.matrix);

		// Create new instance of light
		this.light = new Light();

		// Set light's position
		this.light.position[0] = lTranslation[0];
		this.light.position[1] = lTranslation[1];
		this.light.position[2] = lTranslation[2];

		// Set light's attenuation
		this.light.attenuation = lightStartAttenuation;

		// Add light as to scene
		this.scene.addNode(this.light);
	}

	_setCamera() {
		// Set position of player as position of camera and update matrix
		mat4.copy(this.camera.matrix, this.playerPosition.matrix);
		this.camera.updateTransform();

		// Translate and rotate camera into correct position for viewing tank
		mat4.translate(this.camera.matrix, this.camera.matrix, cameraStartPosition);
		mat4.rotate(this.camera.matrix, this.camera.matrix, degrees90ToRadians, cameraRotateVector);
		this.camera.updateTransform();

		// Set camera's camera object's far attribute to infinity - needed to render entire scene
		// otherwise skybox isn't rendered
		this.camera.camera.far = Infinity;
		this.camera.camera.updateMatrix();
	}

	_simulateLightning(dt) {
		// Simulate lightning by quickly and randomly changing light shininess
		const factor = Math.random() * (10 - 1) + 1;

		const increase = Math.random() < thunderRandomnessFactor ? true : false;

		if (increase) {
			if (this.light.shininess + factor < thunderShininessThresholdTop) {
				this.light.shininess += factor;
			}
		} else {
			if (this.light.shininess - factor > 0) {
				this.light.shininess -= factor;
				if (this.light.shininess < thunderShininessThresholdBottom) {
					this.soundManager.playThunder();
				}
			}
		}
	}

	_checkEnemyStatus() {
		// Check if enemies are destroyed
		for (let i = 0; i < this.enemies.length; i++) {
			this.tanksDestroyed[i] = this.enemies[i].getDestroyed();
		}
	}

	_checkDeadEnemies() {
		let all = true;
		for (let i = 0; i < this.tanksDestroyed.length; i++) {
			if (this.tanksDestroyed[i] == false) {
				all = false;
				break;
			}
		}
		return all;
	}
}
