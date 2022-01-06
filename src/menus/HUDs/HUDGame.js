import { HUD } from "./HUD.js";

export class HUDGame extends HUD {
	constructor() {
		super();

		// Set attributes
		this.health = 0;
		this.ammo = 0;
		this.maxAmmo = 0;

		// Create needed image elements
		this.ammoImage = document.createElement("img");
		this.reticleImage = document.createElement("img");

		// Create needed paragraph element, add text node and append as child
		this.ammoTextContainer = document.createElement("p");
		this.ammoText = document.createTextNode("");
		this.ammoTextContainer.appendChild(this.ammoText);
	}

	init() {
		// Load source images
		this.ammoImage.src = "../../common/images/ammo.png";
		this.healthImage.src = "../../common/images/health.png";
		this.reticleImage.src = "../../common/images/reticle.png";

		// Set positions of images and text containers
		this.healthImage.style.position = "absolute";
		this.healthImage.style.left = 0 + "px";
		this.healthImage.style.bottom = 0 + "px";

		this.ammoImage.style.position = "absolute";
		this.ammoImage.style.left = 0 + "px";
		this.ammoImage.style.bottom = 50 + "px";

		this.reticleImage.style.position = "absolute";
		this.reticleImage.style.left = "49.2%";
		this.reticleImage.style.top = "60%";

		this.healthTextContainer.style.position = "absolute";
		this.healthTextContainer.style.left = 50 + "px";
		this.healthTextContainer.style.bottom = 0 + "px";
		this.healthTextContainer.style.color = "#9d2625";

		this.ammoTextContainer.style.position = "absolute";
		this.ammoTextContainer.style.left = 50 + "px";
		this.ammoTextContainer.style.bottom = 50 + "px";
		this.ammoTextContainer.style.color = "#baa732";

		// Set texts of containers
		this.healthTextContainer.innerText = this.health + "%";
		this.ammoTextContainer.innerText = this.ammo + "/" + this.maxAmmo;

		// Add elements to document body
		document.body.appendChild(this.ammoImage);
		document.body.appendChild(this.healthImage);
		document.body.appendChild(this.reticleImage);
		document.body.appendChild(this.ammoTextContainer);
		document.body.appendChild(this.healthTextContainer);
	}

	setHealth(health, maxHealth) {
		this.health = Math.ceil((health * 100) / maxHealth);
		this.healthTextContainer.innerText = this.health + "%";
	}

	setAmmo(ammo, maxAmmo) {
		this.ammo = ammo;
		this.maxAmmo = maxAmmo;
		this.ammoTextContainer.innerText = this.ammo + "/" + this.maxAmmo;
	}

	display() {
		this.init();
	}

	hide() {
		document.body.removeChild(this.ammoImage);
		document.body.removeChild(this.healthImage);
		document.body.removeChild(this.reticleImage);
		document.body.removeChild(this.ammoTextContainer);
		document.body.removeChild(this.healthTextContainer);
	}

	getReticleCoords() {
		return [this.reticleImage.offsetLeft, this.reticleImage.offsetTop];
	}
}
