import { GUI } from "../../lib/dat.gui.module.js";

export class Menu {
	constructor(classToMap) {
		this.classToMap = classToMap;
		//this.elements = new Array();

		this.gui = new GUI();
	}

	addElement(el, elName, btnName, elValueBottom = null, elValueTop = null) {
		//this.elements.push(el);

		if (!elValueBottom || !elValueTop) {
			this.gui.add(el, elName).name(btnName);
		} else {
			this.gui.add(el, elName, elValueBottom, elValueTop).name(btnName);
		}
	}

	hide() {
		this.gui.hide();
	}
	show() {
		this.gui.show();
	}
}
