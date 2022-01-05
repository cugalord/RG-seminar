import { HUD } from "./HUD.js";

export class HUDEnd extends HUD {
	constructor(tanksDestroyed) {
		super();

		// Set number of destroyed tanks
		this.tanksDestroyed = tanksDestroyed;
		this.endTextContainer = document.createElement("p");
		this.endText = document.createTextNode("");
		this.endTextContainer.appendChild(this.endText);

		this.tanksDestroyedCounter = 0;

		for (let i = 0; i < this.tanksDestroyed.length; i++) {
			if (this.tanksDestroyed[i] == true) {
				this.tanksDestroyedCounter++;
			}
		}
	}

	init() {
		// If all tanks were destroyed display victory text, otherwise loss text
		if (this.tanksDestroyedCounter === 3) {
			this.endTextContainer.innerText =
				"YOU WON\nYOU DESTROYED " + this.tanksDestroyedCounter + "/3 TANKS";
		} else {
			this.endTextContainer.innerText =
				"YOU LOST\nYOU DESTROYED " + this.tanksDestroyedCounter + "/3 TANKS";
		}

		// Set properties of end game text
		this.endTextContainer.style.position = "absolute";
		this.endTextContainer.style.textAlign = "center";
		this.endTextContainer.style.color = "#000000";
		this.endTextContainer.style.fontWeight = "bold";
		this.endTextContainer.style.fontSize = "100px";
		this.endTextContainer.style.left = "12%";
		this.endTextContainer.style.bottom = "30%";
		this.endTextContainer.style.fontFamily = "Courier New";

		document.body.appendChild(this.endTextContainer);
	}

	display() {
		this.init();
	}

	hide() {
		document.body.removeChild(this.endTextContainer);
	}
}
