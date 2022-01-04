import { Entity } from "./Entity.js";
import { mat4, quat, vec3 } from "../../lib/gl-matrix-module.js";

// Define constants used in this class - used to avoid "magic numbers"
const modelRotation = 0.01;
const rotationVector = [0, 1, 0];

export class Powerup extends Entity {
	constructor(model, isHealth = true) {
		// Explicity call constructor of parent class
		super();

		// Set model of powerup
		this.model = model;

		// Set health flag
		this.isHealth = isHealth;
	}

	update(dt) {
		// Rotate model around itself
		mat4.rotate(this.model.matrix, this.model.matrix, modelRotation, rotationVector);
		this.model.updateTransform();
	}
}
