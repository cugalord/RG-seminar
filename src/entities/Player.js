import { Entity } from "./Entity.js";
import { mat4, quat, vec3 } from "../../lib/gl-matrix-module.js";
import { Utils } from "../../common/engine/Utils.js";

// Define constants used in this class - used to avoid "magic numbers"
const tankRotation = 0.01;
const tankRotationVector = [0, 1, 0];

const msFactor = 0.001;

const maxDistance = -7;
const minDistance = 0;
const scrollScale = 0.01;

export class Player extends Entity {
	constructor(preset, bot, top, camera, hud, soundManager, bullet, scene) {
		// Explicity call constructor of parent class
		super();

		// Set presets for 3 different tanks - each has it's own properties
		this.presets = [
			[100, 1, 10],
			[75, 2, 8],
			[200, 0.5, 20],
		];

		// Select properties based on preset
		this.maxHealth = this.presets[preset][0];
		this.speed = this.presets[preset][1];
		this.damage = this.presets[preset][2];

		// Set counters for health and ammo, these are to be adjusted during the game
		this.currHealth = this.maxHealth;
		this.currAmmo = 5;
		this.maxAmmo = 15;

		// Set references to tank's bottom part, top part and camera
		this.bot = bot;
		this.top = top;
		this.camera = camera;

		// Rebind keyword this on event handlers
		this.mousemoveHandler = this.mousemoveHandler.bind(this);
		this.keydownHandler = this.keydownHandler.bind(this);
		this.keyupHandler = this.keyupHandler.bind(this);
		this.clickHandler = this.clickHandler.bind(this);
		this.scrollHandler = this.scrollHandler.bind(this);

		// Set keys pressed as empty dict
		this.keys = {};

		// Set tank default properties - used during movement calculations
		this.defaults = {
			mouseSensitivity: 0.0002,
			maxSpeed: 0.005,
			friction: 0.02,
			acceleration: 7 * this.speed,
			velocity: [0, 0, 0],
		};

		// Set acceleration of top - used in shooting
		this.topAcceleration = 7;

		// Set variables needed for time calculations
		this.time = Date.now();
		this.startTime = this.time;
		this.deltaTime = 0;

		// Set shot as not occured yet
		this.shot = false;

		// Set reference to global hud object
		this.hud = hud;

		this.soundManager = soundManager;

		this.distanceCovered = 0;

		this.bulletModel = bullet;
		this.scene = scene;

		this.spawnedBullet = null;
		this.bulletSpeed = 20;

		this.raycaster = null;
	}

	update(dt) {
		if (document.pointerLockElement !== document.getElementById("canvas")) {
			// Get forward vector of bottom part
			//const forward = this._getForward(this.bot, false);
			const forward = Utils.getForward(this.bot, false);

			// 1: add movement acceleration & rotation
			let acc = vec3.create();
			if (this.keys["KeyW"]) {
				vec3.add(acc, acc, forward);
			}
			if (this.keys["KeyS"]) {
				vec3.sub(acc, acc, forward);
			}
			if (this.keys["KeyD"]) {
				// Rotate bottom part and top part opposite eachother, this ensures top part stays
				// in place
				mat4.rotate(this.bot.matrix, this.bot.matrix, -tankRotation, tankRotationVector);
				mat4.rotate(this.top.matrix, this.top.matrix, tankRotation, tankRotationVector);
			}
			if (this.keys["KeyA"]) {
				// Rotate bottom part and top part opposite eachother, this ensures top part stays
				// in place
				mat4.rotate(this.bot.matrix, this.bot.matrix, tankRotation, tankRotationVector);
				mat4.rotate(this.top.matrix, this.top.matrix, -tankRotation, tankRotationVector);
			}

			// Update transformations
			this.bot.updateTransform();
			this.top.updateTransform();
			this.camera.updateTransform();

			// 2: update velocity
			vec3.scaleAndAdd(
				this.defaults.velocity,
				this.defaults.velocity,
				acc,
				dt * this.defaults.acceleration
			);

			// 3: if no movement, apply friction
			if (
				(!this.keys["KeyW"] && !this.keys["KeyS"]) ||
				this.keys["KeyD"] ||
				this.keys["KeyA"]
			) {
				vec3.scale(
					this.defaults.velocity,
					this.defaults.velocity,
					1 - this.defaults.friction
				);
			}

			// 4: limit speed
			const len = vec3.len(this.defaults.velocity);
			if (len > this.maxSpeed) {
				vec3.scale(
					this.defaults.velocity,
					this.defaults.velocity,
					this.defaults.maxSpeed / len
				);
			}

			this.soundManager.playDrive();

			// Move tank
			this._moveBotAndCamera(dt);
		}

		// Set current health and ammo
		this.hud.setAmmo(this.currAmmo, this.maxAmmo);
		this.hud.setHealth(this.currHealth, this.maxHealth);
	}

	enable() {
		// Bind event listeners
		document.addEventListener("mousemove", this.mousemoveHandler);
		document.addEventListener("keydown", this.keydownHandler);
		document.addEventListener("keyup", this.keyupHandler);
		document.addEventListener("click", this.clickHandler);
		document.addEventListener("wheel", this.scrollHandler);
	}

	disable() {
		// Unbind event listeners
		document.removeEventListener("mousemove", this.mousemoveHandler);
		document.removeEventListener("keydown", this.keydownHandler);
		document.removeEventListener("keyup", this.keyupHandler);
		document.removeEventListener("click", this.clickHandler);
		document.removeEventListener("wheel", this.scrollHandler);

		this.hud.hide();

		// Unset all keys pressed
		for (let key in this.keys) {
			this.keys[key] = false;
		}
	}

	mousemoveHandler(e) {
		// Check if controls are enabled
		if (document.pointerLockElement !== document.getElementById("canvas")) {
			// Get movement on X-axis from event
			const dx = e.movementX;

			const xPos = e.clientX;
			const yPos = e.clientY;

			// Rotate top and camera by movement scaled by sensitivity
			this._rotateTopAndCamera(-dx * this.defaults.mouseSensitivity);
		}
	}

	keydownHandler(e) {
		// If key pressed, set it's entry to true
		this.keys[e.code] = true;
	}

	keyupHandler(e) {
		// If key released, set it's entry to false
		this.keys[e.code] = false;
	}

	clickHandler(e) {
		// Click = shot, on shot bounce tank back

		if (document.pointerLockElement !== document.getElementById("canvas")) {
			// Get time difference
			this.time = Date.now();
			this.deltaTime = (this.time - this.startTime) * msFactor;

			// If time difference over 2 ms - allow shooting again
			if (this.deltaTime > 2) {
				this.shot = false;
			}

			// If shot hasn't occured and tank still has ammo
			if (!this.shot && this.currAmmo > 0) {
				// Shot fired - ammo decreased
				this.currAmmo--;

				this.soundManager.playShot();

				this.raycaster.cast(this.top, false);

				//const cameraForward = this._getForward(this.camera, true);
				const cameraForward = Utils.getForward(this.camera, true);

				// Calculate backward vector
				//const botForward = this._getForward(this.bot, false);
				const botForward = Utils.getForward(this.bot, false);
				const botBackward = vec3.set(
					vec3.create(),
					-botForward[0],
					-botForward[1],
					-botForward[2]
				);

				// Create empty acceleration vector
				let acc = vec3.create();

				// Check if tank's top and bottom are opposite and add correct vector - tank must bounce
				// in the opposite direction of it's top part
				if (vec3.distance(cameraForward, botForward) < 1) {
					vec3.add(acc, acc, botBackward);
				} else {
					vec3.add(acc, acc, botForward);
				}
				// Increase tank's velocity
				vec3.scaleAndAdd(
					this.defaults.velocity,
					this.defaults.velocity,
					acc,
					1 * this.topAcceleration
				);
				this.top.updateMatrix();

				// Shot occured, reset start time
				this.shot = true;
				this.startTime = this.time;

				this.hud.setAmmo(this.currAmmo, this.maxAmmo);
			} else if (!this.shot && this.currAmmo == 0) {
				this.soundManager.playShotEmpty();
			}
		}
	}

	scrollHandler(e) {
		if (document.pointerLockElement !== document.getElementById("canvas")) {
			// Calculate scroll and scale
			const deltaY = event.deltaY * scrollScale;

			// Increase counter of distance covered
			this.distanceCovered += deltaY;

			// Create empty vector
			let acc = vec3.create();

			// Increase movement vector by distance
			vec3.add(acc, acc, [0, 0, deltaY]);

			// Limit distance - makes sure that camera stays near tank (no overshooting or leaving map)
			if (this.distanceCovered > maxDistance && this.distanceCovered <= minDistance) {
				// Move camera
				mat4.translate(this.camera.matrix, this.camera.matrix, acc);
				this.camera.updateTransform();
			}
		}
	}

	_rotateTopAndCamera(rotation) {
		// Rotate top around itself by rotation
		mat4.rotate(this.top.matrix, this.top.matrix, rotation, tankRotationVector);

		// Rotate camera around axis Y, with focal point being tank's bottom part - thus orbiting
		// around it
		vec3.rotateY(
			this.camera.translation,
			this.camera.translation,
			this.bot.translation,
			rotation
		);

		// Rotate camera around itself - this is needed to ensure view stays on the tank
		this.camera.updateMatrix();
		mat4.rotate(this.camera.matrix, this.camera.matrix, rotation, tankRotationVector);

		// Update camera and top's transformations
		this.camera.updateTransform();
		this.top.updateTransform();
	}

	_moveBotAndCamera(dt) {
		// Translate tank's bottom part and camera by velocity vector and scale by time difference (dt)
		vec3.scaleAndAdd(this.bot.translation, this.bot.translation, this.defaults.velocity, dt);

		vec3.scaleAndAdd(
			this.camera.translation,
			this.camera.translation,
			this.defaults.velocity,
			dt
		);

		// Update matrices - we have to update top matrix as well, as it is bot's child node
		this.bot.updateMatrix();
		this.top.updateMatrix();
		this.camera.updateMatrix();
	}

	addHealth(health) {
		this.soundManager.playHealth();
		// When adding health, clamp it to max value
		this.health = Math.min(this.currHealth + health, this.maxHealth);
	}

	addAmmo(ammo) {
		this.soundManager.playAmmo();
		// When adding ammo, clamp it to max value
		this.currAmmo = Math.min(this.currAmmo + ammo, this.maxAmmo);
	}

	reduceHealth(health) {
		this.health -= health;
		this.soundManager.playBounce();
	}

	getHealth() {
		return this.health;
	}

	setRaycaster(raycaster) {
		this.raycaster = raycaster;
	}
}
