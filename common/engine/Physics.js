import { vec3, mat4, quat, vec4, mat3 } from "../../lib/gl-matrix-module.js";

export class Physics {
    constructor(scene, player) {
        // Set references to needed nodes
        this.scene = scene;
        this.player = player;
        this.camera = this.player.camera;
    }

    update(dt) {
        // Traverse all nodes in scene
        this.scene.traverse((node) => {
            // If node has mesh and node is entity and has mesh, traverse again
            if (node.mesh && node.isEntity) {
                this.scene.traverse((other) => {
                    // If nodes arent't same, node has mesh and node isn't player
                    if (
                        node !== other &&
                        other.mesh &&
                        other != this.player.top &&
                        other != this.player.bot
                    ) {
                        // If nodes aren't linked in scene tree structure - resolve collision
                        if (!node.children.includes(other) && !other.children.includes(node)) {
                            this.resolveCollision(node, other);
                        }

                        // All these steps are neccessary to reduce the amount of collision resolving,
                        // thus increasing optimization. They ensure that collisions are resolved
                        // only between a) 2 entities, b) entity and non-entity, c) never between
                        // parent and child.
                        // It also ensures that player is always node a - important in our collision
                        // resolving method, as it makes it easier to calculate new player positions.
                    }
                });
            }
        });
    }

    intervalIntersection(min1, max1, min2, max2) {
        return !(min1 > max2 || min2 > max1);
    }

    aabbIntersection(aabb1, aabb2) {
        return (
            this.intervalIntersection(aabb1.min[0], aabb1.max[0], aabb2.min[0], aabb2.max[0]) &&
            this.intervalIntersection(aabb1.min[1], aabb1.max[1], aabb2.min[1], aabb2.max[1]) &&
            this.intervalIntersection(aabb1.min[2], aabb1.max[2], aabb2.min[2], aabb2.max[2])
        );
    }

    resolveCollision(a, b) {
        // Update bounding boxes with global translation.
        const ta = a.getGlobalTransform();
        const tb = b.getGlobalTransform();

        const posa = mat4.getTranslation(vec3.create(), ta);
        const posb = mat4.getTranslation(vec3.create(), tb);

        let mina = 0;
        let maxa = 0;

        let minb = 0;
        let maxb = 0;

        let isColliding = false;

        // Loop through all primitives in mesh of model a and check if primitive's min and max
        // attributes are defined - check if bounding box exists
        for (let i = 0; i < a.mesh.primitives.length; i++) {
            if (
                a.mesh.primitives[i].attributes.POSITION.min !== undefined &&
                a.mesh.primitives[i].attributes.POSITION.max !== undefined
            ) {
                mina = vec3.add(vec3.create(), posa, a.mesh.primitives[i].attributes.POSITION.min);
                maxa = vec3.add(vec3.create(), posa, a.mesh.primitives[i].attributes.POSITION.max);

                // Loop through all primitives in mesh of model b and check if primitive's min and max
                // attributes are defined - check if bounding box exists
                for (let j = 0; j < b.mesh.primitives.length; j++) {
                    if (
                        b.mesh.primitives[j].attributes.POSITION.min !== undefined &&
                        b.mesh.primitives[j].attributes.POSITION.max !== undefined
                    ) {
                        minb = vec3.add(
                            vec3.create(),
                            posb,
                            b.mesh.primitives[j].attributes.POSITION.min
                        );
                        maxb = vec3.add(
                            vec3.create(),
                            posb,
                            b.mesh.primitives[j].attributes.POSITION.max
                        );

                        // Check if bounding boxes intersect
                        const collision = this.aabbIntersection(
                            {
                                min: mina,
                                max: maxa,
                            },
                            {
                                min: minb,
                                max: maxb,
                            }
                        );

                        // If collision found, stop checking for this mesh
                        if (collision) {
                            isColliding = true;
                            break;
                        }
                    }
                }
                if (isColliding) {
                    break;
                }
            }
        }

        if (!isColliding) {
            return;
        }

        // Move node A minimally to avoid collision.
        const diffa = vec3.sub(vec3.create(), maxb, mina);
        const diffb = vec3.sub(vec3.create(), maxa, minb);

        let minDiff = Infinity;
        let minDirection = [0, 0, 0];
        if (diffa[0] > 0 && diffa[0] < minDiff) {
            minDiff = diffa[0];
            minDirection = [minDiff, 0, 0];
        }
        if (diffa[1] > 0 && diffa[1] < minDiff) {
            minDiff = diffa[1];
            minDirection = [0, minDiff, 0];
        }
        if (diffa[2] > 0 && diffa[2] < minDiff) {
            minDiff = diffa[2];
            minDirection = [0, 0, minDiff];
        }
        if (diffb[0] > 0 && diffb[0] < minDiff) {
            minDiff = diffb[0];
            minDirection = [-minDiff, 0, 0];
        }
        if (diffb[1] > 0 && diffb[1] < minDiff) {
            minDiff = diffb[1];
            minDirection = [0, -minDiff, 0];
        }
        if (diffb[2] > 0 && diffb[2] < minDiff) {
            minDiff = diffb[2];
            minDirection = [0, 0, -minDiff];
        }

        minDirection[1] = 0;

        if (a == this.player.bot) {
            // If node a is bottom part of tank, move only camera as top will be moved with top
            // due to their parent - child relationship

            // Stop any movement occuring
            this.player.defaults.velocity = [0, 0, 0];

            vec3.add(this.player.camera.translation, this.player.camera.translation, minDirection);
            this.player.camera.updateMatrix();
        } else if (a == this.player.top) {
            // If node a is top part of tank, move camera and bottom, as it's transformations don't
            // impact bottom and camera

            // Stop any movement occuring
            this.player.defaults.velocity = [0, 0, 0];

            vec3.add(this.player.bot.translation, this.player.bot.translation, minDirection);
            this.player.bot.updateMatrix();

            vec3.add(this.player.camera.translation, this.player.camera.translation, minDirection);
            this.player.camera.updateMatrix();
        }

        if (a != this.player.top) {
            vec3.add(a.translation, a.translation, minDirection);
            a.updateMatrix();
        }

        // If powerup node was hit, increase appropriate statistic
        if (a == this.player.top || a == this.player.bot) {
            if (b.isHealth != null) {
                if (b.isHealth) {
                    this.player.addHealth(25);
                } else {
                    this.player.addAmmo(5);
                }

                this.scene.removeNode(b);
            }
        }
    }
}
