// This file contains all the code necessary to create debug menus for SelectGameComponent and
// MainGameComponent. To use this code, follow the instructions above the lines of code.
// This code was removed so the end user has no ability to use it, but it can be quickly added
// if debugging is ever needed.

/*ADD THESE LINES TO SelectGameComponent.update() METHOD*/
// Update transformation matrices - this is needed to apply any changes made in the
// debug menu
this.tankBot.updateMatrix();
his.tankTop.updateMatrix();
if (this.camera) {
	// Update transformation matrix of camera - this is needed to apply any changes made
	// in the debug menu
	this.camera.updateMatrix();
	this.camera.updateTransform();
}


/*ADD THESE LINES TO MainGameComponent.update() METHOD*/
// Update transformation matrices - this is needed to apply any changes made in the
// debug menu
this.tankBot.updateMatrix();
this.tankTop.updateMatrix();

this.tankBot.updateTransform();
this.tankTop.updateTransform();

this.camera.updateMatrix();
this.camera.updateTransform();



/* ADD THIS LINE TO THE END OF SelectGameComponent._swapTank() METHOD */
// Recreate debug menu - this is needed to rebind newly loaded variables
this.menuManager.recreateDebug();

/* ADD THESE LINES INTO THE MenuManager._initSelectMenu() METHOD */
this.menus[0].addElement(this, "_hideDebug", "Hide debug"); // Add button to hide debug
this.menus[0].addElement(this, "_showDebug", "Show debug"); // Add button to show debug

/* ADD THESE LINES INTO THE MenuManager._initGameMenu() METHOD */
this.menus[1].addElement(this, "_hideDebug2", "Hide debug"); // Add button to hide debug
this.menus[1].addElement(this, "_showDebug2", "Show debug"); // Add button to show debug

/* ADD THIS LINE AT THE END OF MenuManager._initSelectMenu() METHOD */
// Create debug menu
this._createDebug();


/* ADD THIS LINE AT THE END OF MainGameComponent.load() METHOD */
// Create debug menu
this.menuManager._createDebug2();

/* ADD THESE METHODS INTO THE MenuManager CLASS */
_createDebug() {
		// Create empty debug menu
		this.debug = new GUI();

		// Add controllers for needed variables/functions
		for (let i = 0; i < 3; i++) {
			this.debug
				.add(this.classToMap.selectGameComponent.light.position, i, -200.0, 200.0)
				.name("position." + String.fromCharCode("x".charCodeAt(0) + i));
		}

		for (let i = 0; i < 3; i++) {
			this.debug
				.add(this.classToMap.selectGameComponent.camera.translation, i, -10.0, 30.0)
				.name("cposition." + String.fromCharCode("x".charCodeAt(0) + i));
		}

		for (let i = 0; i < 3; i++) {
			this.debug
				.add(this.classToMap.selectGameComponent.tankBot.translation, i, -10.0, 10.0)
				.name("tposition." + String.fromCharCode("x".charCodeAt(0) + i));
		}

		for (let i = 0; i < 3; i++) {
			this.debug
				.add(this.classToMap.selectGameComponent.tankBot.scale, i, -5.0, 5.0)
				.name("tscale." + String.fromCharCode("x".charCodeAt(0) + i));
		}

		for (let i = 0; i < 3; i++) {
			this.debug
				.add(this.classToMap.selectGameComponent.tankBot.rotation, i, -1.0, 1.0)
				.name("trot." + String.fromCharCode("x".charCodeAt(0) + i));
		}

		for (let i = 0; i < 3; i++) {
			this.debug
				.add(this.classToMap.selectGameComponent.tankTop.translation, i, -1.0, 1.0)
				.name("trot." + String.fromCharCode("x".charCodeAt(0) + i));
		}

		this.debug.add(this.classToMap.selectGameComponent, "_rotate").name("Start/stop rotation");

		// Make debug invisible
		this.debug.hide();
	}

	_createDebug2() {
		this.debug2 = new GUI();

		// Add controllers for needed variables/functions
		for (let i = 0; i < 3; i++) {
			this.debug2
				.add(this.classToMap.mainGameComponent.light.position, i, -200.0, 200.0)
				.name("lightposition." + String.fromCharCode("x".charCodeAt(0) + i));
		}

		for (let i = 0; i < 3; i++) {
			this.debug2
				.add(this.classToMap.mainGameComponent.camera.translation, i, -100.0, 100.0)
				.name("cameraposition." + String.fromCharCode("x".charCodeAt(0) + i));
		}

		for (let i = 0; i < 3; i++) {
			this.debug2
				.add(this.classToMap.mainGameComponent.camera.rotation, i, -1.0, 1.0)
				.name("camerarotaion." + String.fromCharCode("x".charCodeAt(0) + i));
		}

		for (let i = 0; i < 3; i++) {
			this.debug2
				.add(this.classToMap.mainGameComponent.tankBot.translation, i, -100.0, 100.0)
				.name("tankbotposition." + String.fromCharCode("x".charCodeAt(0) + i));
		}

		for (let i = 0; i < 3; i++) {
			this.debug2
				.add(this.classToMap.mainGameComponent.tankBot.rotation, i, -1.0, 1.0)
				.name("trot." + String.fromCharCode("x".charCodeAt(0) + i));
		}

		for (let i = 0; i < 3; i++) {
			this.debug2
				.add(this.classToMap.mainGameComponent.tankTop.translation, i, -100.0, 100.0)
				.name("tanktopposition." + String.fromCharCode("x".charCodeAt(0) + i));
		}

		// Make debug invisible
		this.debug2.hide();
	}

	_showDebug() {
		this.debug.show();
	}

	_hideDebug() {
		this.debug.hide();
	}

	_showDebug2() {
		this.debug2.show();
	}

	_hideDebug2() {
		this.debug2.hide();
	}

	recreateDebug() {
		// Recreate debug - used when swapping tanks to remap variables in debug menu
		this.debug.destroy();
		this._createDebug();
	}