import { vec3, mat4, quat } from "../../lib/gl-matrix-module.js";
import { Utils } from "./Utils.js";

export class Raycaster {
	constructor(scene, player, enemies, soundManager) {
		this.scene = scene;
		this.player = player;
		this.enemies = enemies;
		this.soundManager = soundManager;

		// Create list of objects hit for player and all enemies in game - each needs it's own
		// list because raycasting might be concurrent, which could lead to accidental
		// overwritting of data
		this.hitLists = new Array(this.enemies.length + 1);

		// Fill each list with an empty object and t_far set as infinity
		for (let i = 0; i < this.hitLists.length; i++) {
			this.hitLists[i] = [new Object(), Infinity];
		}
	}

	cast(objectOrigin, isCamera = false) {
		// Calculate direction of ray cast - it doesn't change when resolving casts between different
		// objects, so it needs to only be calculated once
		const oo = objectOrigin.getGlobalTransform();

		const forward = Utils.getForward(oo, isCamera);

		this.scene.traverse((other) => {
			// If nodes arent't same and node has mesh
			if (objectOrigin !== other && other.mesh) {
				// If nodes aren't linked in scene tree structure - resolve raycast
				if (
					!objectOrigin.children.includes(other) &&
					!other.children.includes(objectOrigin)
				) {
					this.resolveCast(objectOrigin, other, forward, oo);
				}

				// These steps are necessary to ensure that rays are only resolved between nodes
				// that contain meshes
			}
		});

		if (
			objectOrigin == this.player.top &&
			this.hitLists[this.hitLists.length - 1][1] != Infinity
		) {
			this.action(objectOrigin, this.hitLists[this.hitLists.length - 1][0]);
		} else {
			for (let i = 0; i < this.enemies.length; i++) {
				if (objectOrigin == this.enemies[i].top && this.hitLists[i][1] != Infinity) {
					this.action(objectOrigin, this.hitLists[i][0]);
				}
			}
		}

		this.resetHits();
	}

	resetHits() {
		// After cast, reset hit objects - needed to ensure that calculations of next cast
		// start anew, otherwise previously hit objects could be "hit" when they are not
		for (let i = 0; i < this.hitLists.length; i++) {
			this.hitLists[i] = [new Object(), Infinity];
		}
	}

	resolveCast(objectOrigin, objectHit, forward, oo) {
		const hitTransform = objectHit.getGlobalTransform();
		const pos = mat4.getTranslation(vec3.create(), hitTransform);

		let intersection = false;
		let isIntersecting = false;

		let min = 0;
		let max = 0;

		// Loop throug all primitives in mesh and check if ray intersects them
		for (let i = 0; i < objectHit.mesh.primitives.length; i++) {
			if (
				objectHit.mesh.primitives[i].attributes.POSITION.min !== undefined &&
				objectHit.mesh.primitives[i].attributes.POSITION.max !== undefined
			) {
				// Calculate new positions of bounding boxes
				min = vec3.add(
					vec3.create(),
					pos,
					objectHit.mesh.primitives[i].attributes.POSITION.min
				);
				max = vec3.add(
					vec3.create(),
					pos,
					objectHit.mesh.primitives[i].attributes.POSITION.max
				);

				intersection = this.rayIntersection(min, max, forward, oo);

				// If intersection found, stop checking for this mesh
				if (intersection[0]) {
					isIntersecting = true;
					break;
				}
			}
		}

		// If no intersection was found, end check
		if (!isIntersecting) {
			return false;
		}

		// Check if intersection of object is infront of saved intersection, if it is, replace the
		// hit object and tNear value - used to store object on which an action will be performed
		if (objectOrigin == this.player.top) {
			if (
				intersection[1] >= 0 &&
				intersection[1] <= this.hitLists[this.hitLists.length - 1][1]
			) {
				this.hitLists[this.hitLists.length - 1] = [objectHit, intersection[1]];
			}
		} else {
			for (let i = 0; i < this.enemies.length; i++) {
				if (objectOrigin == this.enemies[i].top) {
					if (intersection[1] >= 0 && intersection[1] <= this.hitLists[i][1]) {
						this.hitLists[i] = [objectHit, intersection[1]];
					}
				}
			}
		}

		return true;
	}

	rayIntersection(min, max, forward, oo) {
		// Create vectors that hold intersection values
		let t1 = vec3.create();
		let t2 = vec3.create();

		let t_near = -Infinity;
		let t_far = Infinity;

		const translation = mat4.getTranslation(vec3.create(), oo);

		// Go through all 3 dimensions
		for (let i = 0; i < 3; i++) {
			if (forward[i] == 0) {
			} else {
				// Calculate intersections
				t1[i] = (min[i] - translation[i]) / forward[i];
				t2[i] = (max[i] - translation[i]) / forward[i];

				// If "closer" intersection farther than "far" intersection, swap them
				if (t1[i] > t2[i]) {
					let tmp = [...t1];
					t1 = [...t2];
					t2 = [...tmp];
				}

				// Set t_near and t_far values
				if (t1[i] > t_near) {
					t_near = t1[i];
				}

				if (t2[i] < t_far) {
					t_far = t2[i];
				}

				// If closer intersection larger than farther, no hit infront of object was found
				if (t_near > t_far) {
					return [false, t_near, t_far];
				}
			}
		}
		return [true, t_near, t_far];
	}

	action(objectOrigin, objectHit) {
		// Check if object hit is entity, and is not a powerup - thus being enemy or player
		if (objectHit.isEntity && objectHit.isHealth === null) {
			// If object hit is player and origin of ray is enemy
			if (
				(objectHit == this.player.top || objectHit == this.player.bot) &&
				objectOrigin != this.player.top
			) {
				let damage = 0;
				for (let enemy of this.enemies) {
					if (enemy.top == objectOrigin || enemy.bot == objectOrigin) {
						damage = enemy.damage;
						break;
					}
				}

				this.player.reduceHealth(damage);
				this.soundManager.playBounce();
			}
			// If object hit is not player (is enemy) and origin of ray is player
			else if (
				objectHit != this.player.top &&
				objectHit != this.player.bot &&
				objectOrigin == this.player.top
			) {
				for (let i = 0; i < this.enemies.length; i++) {
					if (this.enemies[i].top == objectHit || this.enemies[i].bot == objectHit) {
						this.enemies[i].reduceHealth(this.player.damage);
						this.soundManager.playBounce();
						break;
					}
				}
			}
		}
	}
}
