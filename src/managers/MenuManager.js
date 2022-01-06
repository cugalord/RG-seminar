import { Menu } from "../menus/Menu.js";
import { GUI } from "../../lib/dat.gui.module.js";

export class MenuManager {
	constructor(classToMap) {
		// Set reference to class of which methods will be called
		this.classToMap = classToMap;

		// Current menu is not set
		this.currMenu = null;

		this.menus = [];

		// Initialize all menus
		this.init();
	}

	init() {
		this.menus.push(new Menu(this.classToMap)); // Start menu: index 0
		this.menus.push(new Menu(this.classToMap)); // Game menu:  index 1
		this.menus.push(new Menu(this.classToMap)); // End menu:   index 2

		this.currMenu = 0;

		// Hide menus that aren't currently selected
		this.menus[1].hide();
		this.menus[2].hide();

		this._initSelectMenu();
		this._initGameMenu();
		this._initEndMenu();
	}

	swapMenu() {
		// Set next menu and hide other menus
		this.currMenu++;

		if (this.currMenu > 2) {
			this.currMenu = 0;
		}

		for (let i = 0; i < this.menus.length; i++) {
			if (i != this.currMenu) {
				this.menus[i].hide();
			} else {
				this.menus[i].show();
			}
		}
	}

	_initSelectMenu() {
		this.menus[0].addElement(this.classToMap, "swapGameState", "Start game"); // Add button to start game
		this.menus[0].addElement(this.classToMap.selectGameComponent, "swapTank", "Next tank"); // Add button to swap tanks
	}

	_initGameMenu() {
		this.menus[1].addElement(this.classToMap, "swapGameState", "Quit game"); // Add button to quit game

		// Add button to enable pointer lock so controls work again
		this.menus[1].addElement(this.classToMap, "enableCamera", "Enable controls");

		this.menus[1].addElement(this.classToMap, "unpause", "Sound on"); // Add button play sounds
		this.menus[1].addElement(this.classToMap, "pause", "Sound off"); // Add button pause sounds
	}

	_initEndMenu() {
		this.menus[2].addElement(this.classToMap, "swapGameState", "Main menu"); // Add button to return to main menu
	}
}
