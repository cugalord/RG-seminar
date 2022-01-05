export class SoundManager {
	constructor() {
		this.drive = new Audio("../../common/sounds/broom.mp3");
		this.shot = new Audio("../../common/sounds/shot_and_reload.mp3");
		this.shotEmpty = new Audio("../../common/sounds/shot_empty.mp3");
		this.thunder = new Audio("../../common/sounds/thunder_strike.mp3");
		this.ammo = new Audio("../../common/sounds/ammo.mp3");
		this.health = new Audio("../../common/sounds/heal.mp3");
		this.boom = new Audio("../../common/sounds/boom.mp3");
		this.bounce = new Audio("../../common/sounds/bounce.mp3");

		this.drive.volume = 0.2;
		this.shot.volume = 0.3;
		this.thunder.volume = 0.2;
		this.shotEmpty.volume = 1;
		this.ammo.volume = 1;
		this.health.volume = 0.3;
		this.boom.volume = 0.6;
		this.bounce.volume = 0.5;

		this.drive.addEventListener("ended", this.playDrive, false);
	}

	playDrive() {
		if (this.drive) {
			this.drive.play();
		}
	}

	playShot() {
		this.shot.play();
	}

	playShotEmpty() {
		this.shotEmpty.play();
	}

	playThunder() {
		this.thunder.play();
	}

	playHealth() {
		this.health.play();
	}

	playAmmo() {
		this.ammo.play();
	}

	playBoom() {
		this.boom.play();
	}

	playBounce() {
		this.bounce.play();
	}

	pause() {
		this.drive.volume = 0;
		this.shot.volume = 0;
		this.thunder.volume = 0;
		this.shotEmpty.volume = 0;
		this.ammo.volume = 0;
		this.health.volume = 0;
		this.bounce.volume = 0;
		this.boom.volume = 0;
	}

	unpause() {
		this.drive.volume = 0.2;
		this.shot.volume = 0.3;
		this.thunder.volume = 0.2;
		this.shotEmpty.volume = 1;
		this.ammo.volume = 1;
		this.health.volume = 0.3;
		this.bounce.volume = 0.5;
		this.boom.volume = 0.6;
	}

	setPathToAudio(pathToAudio) {
		this.pathToAudio = pathToAudio;
		this.audio = new Audio(this.pathToAudio);
	}
}
