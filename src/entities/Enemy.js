import { Entity } from "./Entity.js";
import { mat4, quat, vec3, mat3 } from "../../lib/gl-matrix-module.js";
import { Utils } from "../../common/engine/Utils.js";

// Define constants used in this class - used to avoid "magic numbers"

// Map nodeIDs to path node names (path and it's neighbours)
// First number in path name represents the current path ID
// Other numbers represent that path's neighbours, seperated by commas
const pathIdToNameMap = {
	144: "path.06.03,05,07",
	145: "path.05.02,06",
	146: "path.02.01,03,05",
	147: "path.03.02,04,06",
	148: "path.07.06,08,12",
	149: "path.08.07,09",
	150: "path.09.08,10",
	151: "path.10.09,11",
	152: "path.11.10,12",
	153: "path.12.07,11",
	154: "path.04.03",
	155: "path.01.02",
};

// Map path numbers to their indexes in scene
const pathNumberToIndexMap = {
	6: 144,
	5: 145,
	2: 146,
	3: 147,
	7: 148,
	8: 149,
	9: 150,
	10: 151,
	11: 152,
	12: 153,
	4: 154,
	1: 155,
};

const msFactor = 0.001;

// Distance limits for enemies movements
const brakingDistance = 10;
const stoppingDistance = 2.5;

// Lower and upper bound of slerp progress - used to determine when shot can occur
const slerpShotLowerLimit = 0.9;
const slerpShotUpperLimit = 1;

// Variables that set how fast linear interpolation occurs
const bottomSlerpIncrement = 0.007;
const topSlerpIncrement = 0.01;

const lockOnDistance = 20;

export class Enemy extends Entity {
	constructor(preset, top, bot, pathNodes, soundManager, destroyedTop, destroyedBot, id) {
		// Explicity call constructor of parent class
		super();

		this.id = id;

		// Set references to tank's bottom and top part
		this.top = top;
		this.bot = bot;

		// Set references to tank's destroyed counterparts
		this.destroyedTop = destroyedTop;
		this.destroyedBot = destroyedBot;

		// Set presets for 3 different tanks - each has it's own properties
		this.presets = [
			[100, 1, 10],
			[75, 1.5, 8],
			[200, 0.75, 20],
		];

		// Set properties based on preset
		this.maxHealth = this.presets[preset][0];
		this.speed = this.presets[preset][1];
		this.damage = this.presets[preset][2];

		// Set current health to max health
		this.currHealth = this.maxHealth;

		// Set tank default properties - used during movement calculations
		this.defaults = {
			mouseSensitivity: 0.0002,
			maxSpeed: 0.005,
			friction: 0.02,
			acceleration: 2 * this.speed,
			velocity: [0, 0, 0],
		};

		// Set bottom goal rotation quaternion to null, and
		// current bottom linear interpolation progress to 0
		this.botRotation = null;
		this.botSlerpProgress = 0;

		// Set top goal rotation quaternion to null, and
		// current top linear interpolation progress to 0
		this.topRotation = null;
		this.topSlerpProgress = 0;

		// Set flags for destroyed, lockon and rotating
		this.destroyed = false;
		this.lockOn = false;
		this.rotating = false;
		this.wait = false;

		// Set variables needed for time calculations
		this.time = Date.now();
		this.startTime = this.time;
		this.deltaTime = 0;

		// Set shot as not occured yet
		this.shot = false;

		// Set references to player, raycaster and sound manager
		this.player = null;
		this.enemies = null;
		this.raycaster = null;
		this.soundManager = soundManager;

		// import path nodes into object
		this.pathNodes = pathNodes;

		// Find first node (tank spawn)
		this.currentNode = this._findStartingNode();

		// Set previous and next node
		this.previousNode = this.currentNode;
		this.nextNode = this._findAndSelectNeighbourNode();

		// Needed to make largest tank look at his next node
		if (this.id == 2) {
			let tmpRot = Utils.calculateLookAt(this.bot.translation, this.nextNode.translation);
			this.bot.rotation = tmpRot;
			this.bot.updateMatrix();
		}
	}

	update(dt) {
		if (!this.destroyed && document.pointerLockElement !== document.getElementById("canvas")) {
			// If tank should be rotating when it reaches an intersection, rotate it, otherwise
			// move it forward
			if (!this.rotating && !this.wait) {
				this._applyMovement(dt);
			} else {
				this._applyBotRotation(dt);
			}

			// Check if player is close enough to generate lockon
			this._getLockOn();

			this.topRotation = Utils.calculateLookAt(
				this.top.translation,
				vec3.set(
					vec3.create(),
					this.player.bot.translation[0],
					this.top.translation[1],
					this.player.bot.translation[2]
				)
			);

			if (this.id == 1) {
				quat.rotateY(this.topRotation, this.topRotation, Utils.degToRad(-180));
			}

			this._applyTopRotation();

			if (this.lockOn) {
				// Get time difference
				this.time = Date.now();
				this.deltaTime = (this.time - this.startTime) * msFactor;

				// If time difference over 2 ms - allow shooting again
				if (this.deltaTime > 2) {
					this.shot = false;
				}

				if (
					this.topSlerpProgress > slerpShotLowerLimit &&
					this.topSlerpProgress <= slerpShotUpperLimit &&
					!this.shot
				) {
					this.raycaster.cast(this.top, false, this.id);
					this.topSlerpProgress = 0;

					// Shot occured, reset start time
					this.shot = true;
					this.startTime = this.time;
				}
			}

			if (this.wait) {
				let tmp = this.currentNode;
				this.currentNode = this.nextNode;
				this.previousNode = tmp;
				this.nextNode = this._findAndSelectNeighbourNode();

				// Get new rotation which points in the direction of next node
				this.botRotation = Utils.calculateLookAt(
					this.bot.translation,
					this.nextNode.translation
				);

				if (this.id == 1) {
					quat.rotateY(this.botRotation, this.botRotation, Utils.degToRad(-180));
				}

				// Start rotation
				this.botSlerpProgress = 0;
				this.rotating = true;
			}
		}
	}

	_applyMovement(dt) {
		// Get forward vector of bottom part
		let forward = Utils.getForward(this.bot, false);

		if (this.id == 1) {
			vec3.negate(forward, forward);
		}

		// 1: add movement acceleration & rotation
		let acc = vec3.create();
		vec3.add(acc, acc, forward);

		// 2: update velocity
		vec3.scaleAndAdd(
			this.defaults.velocity,
			this.defaults.velocity,
			acc,
			dt * this.defaults.acceleration
		);

		// 4: limit speed
		const len = vec3.len(this.defaults.velocity);
		if (len > this.maxSpeed) {
			vec3.scale(
				this.defaults.velocity,
				this.defaults.velocity,
				this.defaults.maxSpeed / len
			);
		}

		// Start braking
		if (vec3.distance(this.bot.translation, this.nextNode.translation) < brakingDistance) {
			vec3.scale(this.defaults.velocity, this.defaults.velocity, 1 - this.defaults.friction);
		}

		//  Stop tank if distance too close to intersection
		if (vec3.distance(this.bot.translation, this.nextNode.translation) > stoppingDistance) {
			this._moveTank(dt);
		} else {
			this.defaults.velocity = [0, 0, 0];

			// Get next node and reset current node
			let tmp = this.currentNode;
			this.currentNode = this.nextNode;
			this.previousNode = tmp;
			this.nextNode = this._findAndSelectNeighbourNode();

			// Get new rotation which points in the direction of next node
			this.botRotation = Utils.calculateLookAt(
				this.bot.translation,
				this.nextNode.translation
			);

			if (this.id == 1) {
				quat.rotateY(this.botRotation, this.botRotation, Utils.degToRad(-180));
			}

			// Start rotation
			this.botSlerpProgress = 0;
			this.rotating = true;
		}
	}

	_moveTank(dt) {
		// Translate tank's bottom part by velocity vector and scale by time difference (dt)
		vec3.scaleAndAdd(this.bot.translation, this.bot.translation, this.defaults.velocity, dt);
		vec3.scaleAndAdd(this.top.translation, this.top.translation, this.defaults.velocity, dt);

		// Update matrices - we have to update top matrix as well, as it is bot's child node
		this.bot.updateMatrix();
		this.top.updateMatrix();
	}

	_applyBotRotation(dt) {
		// If spherical linear interpolation not done yet
		if (this.botSlerpProgress < 1) {
			// Increase progress
			this.botSlerpProgress += bottomSlerpIncrement;

			// Perform spherical linear interpolation on bottom part's rotation
			quat.slerp(
				this.bot.rotation,
				this.bot.rotation,
				this.botRotation,
				this.botSlerpProgress
			);
			this.bot.updateMatrix();
		} else {
			// If slerp done, set flag to false
			this.bot.updateMatrix();
			this.rotating = false;
		}
	}

	_applyTopRotation() {
		// If spherical linear interpolation not done yet
		if (this.topSlerpProgress < 1) {
			// Increase progress
			this.topSlerpProgress += topSlerpIncrement;

			// Perform spherical linear interpolation on bottom part's rotation
			quat.slerp(
				this.top.rotation,
				this.top.rotation,
				this.topRotation,
				this.topSlerpProgress
			);
			this.top.updateMatrix();
		} else {
			// If slerp done, set flag to false
			this.top.updateMatrix();
			this.topSlerpProgress = 0;
		}
	}

	_findStartingNode() {
		// Set closest node and minimum distance to infinity
		let closestNode = null;
		let distance = Infinity;
		// Loop through all nodes and find closest
		for (let i = 0; i < this.pathNodes.length; i++) {
			if (vec3.distance(this.bot.translation, this.pathNodes[i].translation) < distance) {
				closestNode = this.pathNodes[i];
				distance = vec3.distance(this.bot.translation, this.pathNodes[i].translation);
			}
		}
		return closestNode;
	}

	_findAndSelectNeighbourNode() {
		// Get neighbours of current node and remove first neighbour, which is this node
		let neighbours = this._getNodeInfoFromId(this.currentNode.id);
		neighbours.splice(0, 1);

		console.log(neighbours);

		let bannedNodes = new Array();
		let nodeKey = 0;

		if (this.enemies) {
			for (let i = 0; i < this.enemies.length; i++) {
				if (i != this.id) {
					const nodes = this.enemies[i].getCurrentAndNextNode();

					if (nodes.next == this.currentNode.id) {
						console.log("Next is current");
						nodeKey = Object.keys(pathNumberToIndexMap).find(
							(key) => pathNumberToIndexMap[key] === nodes.current
						);

						for (let j = 0; j < neighbours.length; j++) {
							if (parseInt(neighbours[j]) == nodeKey) {
								console.log("Found current");
								neighbours.splice(j, 1);
								break;
							}
						}
					}

					nodeKey = nodeKey = Object.keys(pathNumberToIndexMap).find(
						(key) => pathNumberToIndexMap[key] === nodes.next
					);

					for (let j = 0; j < neighbours.length; j++) {
						if (parseInt(neighbours[j]) == nodeKey) {
							console.log("Found next");
							neighbours.splice(j, 1);
							break;
						}
					}
				}
			}
		}

		if (neighbours.length == 0) {
			this.wait = true;
		} else {
			this.wait = false;
		}

		// Select random node
		const randomNode = Math.floor(Math.random() * neighbours.length);

		// Return neighbour node
		for (let i = 0; i < this.pathNodes.length; i++) {
			if (this.pathNodes[i].id == pathNumberToIndexMap[parseInt(neighbours[randomNode])]) {
				return this.pathNodes[i];
			}
		}
	}

	_getNodeInfoFromId(id) {
		let nodes = new Array();
		let string = pathIdToNameMap[id];

		// Extract node and it's neighbours
		string = string.split("path.")[1];
		nodes.push(string.split(".")[0]);
		string = string.split(".")[1];
		nodes.push(...string.split(","));

		return nodes;
	}

	_swapTankWithDamaged() {
		// Swap tank with it's detroyed counterpart

		// Copy destroyed tank's matrices
		const tmpBot = mat4.clone(this.destroyedBot.matrix);
		const tmpTop = mat4.clone(this.destroyedTop.matrix);

		// Replace destroyed tank's matrices
		mat4.copy(this.destroyedBot.matrix, this.bot.matrix);
		mat4.copy(this.destroyedTop.matrix, this.top.matrix);

		// Replace original tank's matrices
		mat4.copy(this.bot.matrix, tmpBot);
		mat4.copy(this.top.matrix, tmpTop);

		this.bot.updateTransform();
		this.top.updateTransform();
		this.destroyedBot.updateTransform();
		this.destroyedTop.updateTransform();
	}

	_getLockOn() {
		if (vec3.distance(this.bot.translation, this.player.bot.translation) < lockOnDistance) {
			this.lockOn = true;
		} else {
			this.lockOn = false;
		}
	}

	reduceHealth(damage) {
		this.currHealth -= damage;

		// If tank is destroyed, play sound and replace it with destroyed model
		if (this.currHealth <= 0) {
			this.destroyed = true;
			this.soundManager.playBoom();

			this._swapTankWithDamaged();
		}
	}

	setRaycaster(raycaster) {
		this.raycaster = raycaster;
	}

	setPlayer(player) {
		// Setting player reference is needed so we know it's position, which is used in calculating
		// when lockOn occurs
		this.player = player;
	}

	setEnemies(enemies) {
		this.enemies = enemies;
	}

	getDestroyed() {
		return this.destroyed;
	}

	getCurrentAndNextNode() {
		return {
			previous: this.previousNode.id,
			current: this.currentNode.id,
			next: this.nextNode.id,
		};
	}
}
