// HUD overlay is realized in HTML elements, as it is far easier to implement than
// creating and drawing WebGL primitives. It also never needs to change, apart from text
// which is easier to implement in HTML

export class HUD {
	constructor() {
		// Health is used in all HUDs
		this.healthImage = document.createElement("img");
		this.healthTextContainer = document.createElement("p");
		this.healthText = document.createTextNode("");
		this.healthTextContainer.appendChild(this.healthText);
	}
}
