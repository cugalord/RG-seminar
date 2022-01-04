import { Enemy } from "../entities/Enemy.js";
import { Player } from "../entities/Player.js";
import { Powerup } from "../entities/Powerup.js";

export class EntityManager {
    constructor() {
        this.entities = new Array();
    }

    init(enemyArray, healthArray, ammoArray, player) {
        // Set all entities to internal array of entities
        this.entities.push(player);

        for (let enemy of enemyArray) {
            this.entities.push(enemy);
        }

        for (let powerup of healthArray) {
            this.entities.push(powerup);
        }

        for (let powerup of ammoArray) {
            this.entities.push(powerup);
        }
    }

    update(dt) {
        // Update every entity
        for (let entity of this.entities) {
            entity.update(dt);
        }
    }

    clear() {
        this.entities.splice(0, this.entities.length);
    }
}
