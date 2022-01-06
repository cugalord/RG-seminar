import { HUD } from "./HUD.js";

export class HUDSelect extends HUD {
	constructor() {
		super();

		// Set attributes
		this.health = 0;
		this.speed = 0;
		this.damage = 0;

		// Create needed image elements
		this.speedImage = document.createElement("img");
		this.damageImage = document.createElement("img");

		// Create needed paragraph elements, add text nodes and append as children
		this.speedTextContainer = document.createElement("p");
		this.speedText = document.createTextNode("");

		this.damageTextContainer = document.createElement("p");
		this.damageText = document.createTextNode("");

		this.speedTextContainer.appendChild(this.speedText);
		this.damageTextContainer.appendChild(this.damageText);

		// Controls

		this.keysImage = document.createElement("img");
		this.scrollImage = document.createElement("img");
		this.clickImage = document.createElement("img");

		this.controlsTextContainer = document.createElement("p");
		this.controlsText = document.createTextNode("");

		this.controlsTextContainer.appendChild(this.controlsText);
	}

	init() {
		// Load source images
		this.healthImage.src = "../../common/images/healthS.png";
		this.speedImage.src = "../../common/images/speed.png";
		this.damageImage.src = "../../common/images/damage.png";

		this.keysImage.src = "../../common/images/keys.png";
		this.scrollImage.src = "../../common/images/mouse_scroll.png";
		this.clickImage.src = "../../common/images/mouse_click.png";

		// Health

		// Set positions of images and text containers
		this.healthImage.style.position = "absolute";
		this.healthImage.style.left = 0 + "px";
		this.healthImage.style.bottom = 0 + "px";

		this.healthTextContainer.style.position = "absolute";
		this.healthTextContainer.style.left = 51 + "px";
		this.healthTextContainer.style.bottom = 0 + "px";
		this.healthTextContainer.style.color = "#000000";

		this.healthTextContainer.innerText = this.health;

		//Speed

		// Set positions of images and text containers
		this.speedImage.style.position = "absolute";
		this.speedImage.style.left = 0 + "px";
		this.speedImage.style.bottom = 50 + "px";

		this.speedTextContainer.style.position = "absolute";
		this.speedTextContainer.style.left = 51 + "px";
		this.speedTextContainer.style.bottom = 50 + "px";
		this.speedTextContainer.style.color = "#000000";

		this.healthTextContainer.innerText = this.speed;

		// Damage

		// Set positions of images and text containers
		this.damageImage.style.position = "absolute";
		this.damageImage.style.left = 0 + "px";
		this.damageImage.style.bottom = 100 + "px";

		this.damageTextContainer.style.position = "absolute";
		this.damageTextContainer.style.left = 51 + "px";
		this.damageTextContainer.style.bottom = 100 + "px";
		this.damageTextContainer.style.color = "#000000";

		this.healthTextContainer.innerText = this.damage;

		// Controls

		this.clickImage.style.position = "absolute";
		this.clickImage.style.right = 0 + "px";
		this.clickImage.style.bottom = 0 + "px";

		this.scrollImage.style.position = "absolute";
		this.scrollImage.style.right = 105 + "px";
		this.scrollImage.style.bottom = 0 + "px";

		this.keysImage.style.position = "absolute";
		this.keysImage.style.right = 210 + "px";
		this.keysImage.style.bottom = 0 + "px";

		this.controlsTextContainer.style.position = "absolute";
		this.controlsTextContainer.style.right = 380 + "px";
		this.controlsTextContainer.style.bottom = 0 + "px";
		this.controlsTextContainer.style.color = "#000000";

		this.controlsTextContainer.innerText = "Controls: ";

		// Add elements to document body
		document.body.appendChild(this.healthImage);
		document.body.appendChild(this.healthTextContainer);
		document.body.appendChild(this.speedImage);
		document.body.appendChild(this.speedTextContainer);
		document.body.appendChild(this.damageImage);
		document.body.appendChild(this.damageTextContainer);
		document.body.appendChild(this.keysImage);
		document.body.appendChild(this.scrollImage);
		document.body.appendChild(this.clickImage);
		document.body.appendChild(this.controlsTextContainer);
	}

	setHealth(health) {
		this.health = health;
		this.healthTextContainer.innerText = this.health;
	}

	setSpeed(speed) {
		this.speed = speed;
		this.speedTextContainer.innerText = this.speed;
	}

	setDamage(damage) {
		this.damage = damage;
		this.damageTextContainer.innerText = this.damage;
	}

	display() {
		this.init();
	}

	hide() {
		if (document.body.contains(this.healthImage)) {
			document.body.removeChild(this.healthImage);
			document.body.removeChild(this.healthTextContainer);
			document.body.removeChild(this.speedImage);
			document.body.removeChild(this.speedTextContainer);
			document.body.removeChild(this.damageImage);
			document.body.removeChild(this.damageTextContainer);
			document.body.removeChild(this.keysImage);
			document.body.removeChild(this.scrollImage);
			document.body.removeChild(this.clickImage);
			document.body.removeChild(this.controlsTextContainer);
		}
	}
}
