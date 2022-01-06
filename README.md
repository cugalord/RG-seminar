# ES6/WebGL 2.0 Game
An ES6/WebGL 2.0 based video game for a CS Undergraduate course in computer graphics.

# Building and running
The code does not need to be built, but requires a server
capable of serving static files (WebGL+CORS restrictions). A basic Node.js
implementation is available in `bin/server.js`.

# Project structure
The project is structured as follows:

- The root directory contains `index.html`, the project's front page that
  is used for showcasing code.
- The `lib` directory holds the libraries. We use libraries when something
  is too tedious or prone to error if written by hand or out of the scope of
  this project.
- The `common` directory contains all the code and resources that are used
  in multiple systems of this project.
  - The `engine` directory contains all elements that interact directly with 
    WebGL, GLTF or simulate physics.
  - The `gltf_components` directory contains implementations of all GLTF 
    components, which are used in the project. They are mainly needed in
    the GLTFLoader implementation.
  - The `images` directory contains images that are used to draw HUDs.
  - The `models` directory contains GLTF files and all other files that
    represent 3D models.
  - The `sounds` directory contains sounds used in the Sound Manager implementation.  
- The `src` directory contains all the code that provides the functionality of 
  the program.
  - The `DEBUG` directory contains code that was used to debug certain parts of
    code. It mainly contains different sliders and menu options and instructions
    for how to include them in your code.
  - The `entities` directory contains implementations of player and enemies.
  - The `game` directory contains the implementation of the main Game class.
  - The `game_components` directory contains implementations of specific
    game components, such as select screen, or actual game.
  - The `managers` directory contains implementations of entity manager, sound
    manager and menu manager.
  - The `menus` directory contains implementations of a basic menu and all other
    HUD displays.
  - The `shaders` directory contains implementations of shaders.
