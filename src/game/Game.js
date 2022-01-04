import { MenuManager } from "../managers/MenuManager.js";
import { SoundManager } from "../managers/SoundManager.js";

import { SelectGameComponent } from "../game_components/SelectGameComponent.js";
import { MainGameComponent } from "../game_components/MainGameComponent.js";
import { EndGameComponent } from "../game_components/EndGameComponent.js";

// Define constants used in this class - used to avoid "magic numbers"
const gameStates = {
    SelectScreen: 0,
    MainScreen: 1,
    EndScreen: 2,
};

const playerNoHealth = -1;

const msFactor = 0.001;

export class Game {
    constructor(canvas, glOptions) {
        // Bind "this" to _update method
        this._update = this._update.bind(this);

        // Store canvas in internal variable
        this.canvas = canvas;

        // Set game state to 0 (main menu), this has to be set
        // in constructor, as it is needed in update and render methods.
        // Start is asynchronous so it would be risky to be set there.
        this.gameState = gameStates.SelectScreen;

        // Set current tank to tank 1, this variable is used to track which tank is currently selected
        // and which tank will be player tank when game starts.
        // Set in constructor for the same reason as gameState
        this.currTank = 0;

        // Initialize WebGL with glOptions
        this._initGL(glOptions);

        // Start game - used for initialization of components
        this.start();

        // Call _update on every animation frame sync
        requestAnimationFrame(this._update);
    }

    _initGL(glOptions) {
        // Set internal variable for WebGL context to null
        this.gl = null;

        // Try to get WebGL2 canvas context
        try {
            this.gl = this.canvas.getContext("webgl2", glOptions);
        } catch (error) {}

        // If context couldn't be obtained, throw error
        if (!this.gl) {
            console.error("Cannot create WebGL 2.0 context");
        }
    }

    _update() {
        // Resize canvas if needed,
        // update objects and handle logic,
        // render models to canvas
        this._resize();
        this.update();
        this.render();

        // Recursively call _update on every animation frame sync
        requestAnimationFrame(this._update);
    }

    _resize() {
        // Store internal variables to constants for safety
        const canvas = this.canvas;
        const gl = this.gl;

        // If canvas isn't fullscreen
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            // Change canvas dimensions
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;

            // Specify affine transformation of x and y from normalized device coords to window coords
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

            // Call main resize method
            this.resize();
        }
    }

    async start() {
        // initialization code (including event handler binding)

        // Create new music manager, used to load background music, controlling volume etc.
        this.soundManager = new SoundManager();

        // Create new instance of select screen component
        // It is used to update and display objects during the select
        // tank screen
        this.selectGameComponent = new SelectGameComponent(this.gl);
        await this.selectGameComponent.init();

        // Create instance of new main game component
        // It contains all of the game's logic and rendering - it is
        // the main part of this project
        this.mainGameComponent = new MainGameComponent(this.gl);
        await this.mainGameComponent.init();

        // Create instance of end game component
        // It is used to display and render the end game screen
        this.endGameComponent = new EndGameComponent(this.gl);
        await this.endGameComponent.init();

        // Create new menu manager - handles creation and swapping of menus
        this.menuManager = new MenuManager(this);

        // Send reference of menu manager to select screen component
        this.selectGameComponent.setMenuManager(this.menuManager);

        // Send reference of menu manager and sound manager to select screen component
        this.mainGameComponent.setMenuManager(this.menuManager);
        this.mainGameComponent.setSoundManager(this.soundManager);

        // Start time counter
        this.time = Date.now();
        this.startTime = this.time;

        // Call resize code to update camera's properties
        this.resize();
    }

    update() {
        // update code (input, animations, AI ...)

        switch (this.gameState) {
            case gameStates.SelectScreen:
                this.selectGameComponent.update();
                break;
            case gameStates.MainScreen:
                // Calculate difference in time
                const t = (this.time = Date.now());
                const dt = (this.time - this.startTime) * msFactor;
                this.startTime = this.time;

                // Update method returns -1 in case player runs ouf of heatlh - game over
                if (this.mainGameComponent.update(dt) == playerNoHealth) {
                    this.swapGameState();
                }
                break;
            case gameStates.EndScreen:
                this.endGameComponent.update();
                break;
            default:
                console.log("Invalid game state - switching to main menu!");
                this.gameState = 0;
        }
    }

    render() {
        // render code (gl API calls)

        switch (this.gameState) {
            case gameStates.SelectScreen:
                this.selectGameComponent.render();
                break;
            case gameStates.MainScreen:
                this.mainGameComponent.render();
                break;
            case gameStates.EndScreen:
                this.endGameComponent.render();
                break;
            default:
                console.log("Invalid game state - switching to main menu!");
                this.gameState = 0;
        }
    }

    resize() {
        // resize code (e.g. update projection matrix)

        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const aspectRatio = w / h;

        if (this.camera) {
            this.camera.camera.aspect = aspectRatio;
            this.camera.camera.updateMatrix();
        }
    }

    async swapGameState() {
        // Clear screen when swapping game state - guarantee fresh draw
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gameState++;

        // If gamestate over 3, reset to 1 and set current tank to first tank
        if (this.gameState > gameStates.EndScreen) {
            // Remove all elements of end game screen
            this.endGameComponent.remove();

            this.gameState = gameStates.SelectScreen;

            // Set first tank on select screen
            this.selectGameComponent.currTank = 2;
            this.selectGameComponent.swapTank();
        } else if (this.gameState == gameStates.MainScreen) {
            // Load necessary variables into main game component
            await this.mainGameComponent.init();
            this.mainGameComponent.load(this.selectGameComponent.unload());

            // Request pointer lock on canvas
            this.enableCamera();
        } else {
            // Load necessary variables into end game component
            this.endGameComponent.load(this.mainGameComponent.unload());

            // Remove all elements of main game
            this.mainGameComponent.remove();
        }

        // Finally swap the menu
        this.menuManager.swapMenu();
    }

    enableCamera() {
        this.canvas.requestPointerLock();
    }

    pause() {
        this.soundManager.pause();
    }

    unpause() {
        this.soundManager.unpause();
    }

    pointerLockChangeHandler() {
        if (!this.mainGameComponent.player) {
            return;
        }

        if (document.pointerLockElement === this.canvas) {
            this.mainGameComponent.player.enable();
        } else {
            this.mainGameComponent.player.disable();
        }
    }
}
