import { vec3, mat4, quat, vec4, mat3 } from "../../lib/gl-matrix-module.js";

export class Utils {
	constructor() {}

	static getForward(object, isCamera = false) {
		// Clone object's transformation matrix and create empty vector to hold results
		let objectMatrix = null;
		if (object.matrix) {
			objectMatrix = mat4.clone(object.matrix);
		} else {
			objectMatrix = mat4.clone(object);
		}
		let forwardVector = vec3.create();

		// Because matrix is represented in column-major order, it's indices are:
		// 0, 4, 8,  12
		// 1, 5, 9,  13
		// 2, 6, 10, 14
		// 3, 7, 11, 15

		// Object's forwards rotation is stored in the third column of matrix, in the first three rows

		if (isCamera) {
			// If object is camera, take the correct indices and negate them, as camera's forward
			// is oppostie it's viewing angle: <- View >| C | Forward ->
			forwardVector[0] = -objectMatrix[8];
			forwardVector[1] = -objectMatrix[9];
			forwardVector[2] = -objectMatrix[10];
		} else {
			// If object isn't camera, invert it's transformation matrix and take correct indices in
			// reverse order
			mat4.invert(objectMatrix, objectMatrix);
			forwardVector[0] = objectMatrix[10];
			forwardVector[1] = objectMatrix[9];
			forwardVector[2] = objectMatrix[8];
		}

		return forwardVector;
	}
}