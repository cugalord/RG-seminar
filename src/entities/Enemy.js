import { Entity } from "./Entity.js";
import { mat4, quat, vec3 } from "../../lib/gl-matrix-module.js";
import { Utils } from "../../common/engine/Utils.js";

//link nodeIDs to path names (path and it's neighbours)
const pathIdsToNameMap = {
	144 : "path.06.03,05,07",
	145 : "path.05.02,06",
	146 : "path.02.01,03,05",
	147 : "path.03.02,04,06",
	148 : "path.07.06,08,12",
	149 : "path.08.07,09",
	150 : "path.09.08,10",
	151 : "path.10.09,11",
	152 : "path.11.10,12",
	153 : "path.12.07,11",
	154 : "path.04.03",
	155 : "path.01.02"
}

//link pathnums to nodeIDs
const pathNumToIdMap = {
	6 : 144,
	5 : 145,
	2 : 146,
	3 : 147,
	7 : 148,
	8 : 149,
	9 : 150,
	10 : 151,
	11 : 152,
	12 : 153,
	4 : 154,
	1 : 155 
}

//distances for enemy movement
const breakingDist = 9;
const stopDist = 2.5;

export class Enemy extends Entity {
	constructor(preset, top, bot, path_nodes, soundManager, destroyedTop, destroyedBot){
		// Explicity call constructor of parent class
		super();

		this.top = top;
		this.bot = bot;

		this.destroyedTop=destroyedTop;
		this.destroyedBot=destroyedBot;

		this.presets = [
			[100, 1, 10],
			[75, 1.5, 8],
			[200, 0.75, 20],
		];

		this.soundManager = soundManager;
		this.maxHealth = this.presets[preset][0];
		this.speed = this.presets[preset][1];
		this.damage = this.presets[preset][2];

		this.defaults = {
			mouseSensitivity: 0.0002,
			maxSpeed: 0.005,
			friction: 0.02,
			acceleration: 2 * this.speed,
			velocity: [0, 0, 0],
		};
		
		this.currHealth = this.maxHealth;

		this.desroyed = false;
		this.lockOn = false;
		
		// import path nodes into object
		this.path_nodes=path_nodes;

		// finds first node (tank spawn)
		this.current_node=this._findStartingNode();

		// declare previous and next node
		this.previous_node=this.current_node;
		this.next_node=this._findAndSelectNeighbourNode();
	}

	_findStartingNode(){
		let closest;
		let distance=999999;
		for(let i=0; i < this.path_nodes.length; i++){
			if(vec3.distance(this.bot.translation, this.path_nodes[i].translation) < distance){
				closest = this.path_nodes[i];
				distance = vec3.distance(this.bot.translation, this.path_nodes[i].translation);
			}
		}
		return closest;
	}

	_findAndSelectNeighbourNode(){
		let neighbours = this._getNodeInfoFromId(this.current_node.id);
		neighbours.splice(0, 1);
		let rnd = Math.floor(Math.random() * neighbours.length)

		for(let i=0; i < this.path_nodes.length; i++){
			if(this.path_nodes[i].id == pathNumToIdMap[parseInt(neighbours[rnd])]){
				return this.path_nodes[i]
			}
		}
	}

	_getNodeInfoFromId(id){
		let nodes = new Array();
		let string = pathIdsToNameMap[id];

		// retarded regex
		string=string.split("path.")[1];
		nodes.push(string.split(".")[0]);
		string=string.split(".")[1];
		nodes.push(...string.split(","));

		return nodes;
		
	}


	update(dt) {
		if (!this.destroyed) {
			// Get forward vector of bottom part
			//const forward = this._getForward(this.bot, false);
			const forward = Utils.getForward(this.bot, false);

			// 1: add movement acceleration & rotation
			let acc = vec3.create();
			vec3.add(acc, acc, forward);

			// 2: update velocity
			vec3.scaleAndAdd(
				this.defaults.velocity,
				this.defaults.velocity,
				acc,
				dt * this.defaults.acceleration
			);
			
			// 4: limit speed
			const len = vec3.len(this.defaults.velocity);
			if (len > this.maxSpeed) {
				vec3.scale(
					this.defaults.velocity,
					this.defaults.velocity,
					this.defaults.maxSpeed / len
				);
			}



			/*
			// start braking
			if (vec3.distance(this.bot.translation, this.next_node.translation) < breakingDist){
				vec3.scale(
					this.defaults.velocity,
					this.defaults.velocity,
					1 - this.defaults.friction
				);
			}
			
			// stop tank
			if(vec3.distance(this.bot.translation, this.next_node.translation) > stopDist){
				this._moveBot(dt);
			}
			else{
				// get next node -- START ROTATING <- TODO
				let tmp=this.current_node;
				this.current_node=this.next_node;
				// declare previous and next node
				this.previous_node=tmp;
				this.next_node=this._findAndSelectNeighbourNode();
			}
			*/
		}
	}

	_moveBot(dt) {
		// Translate tank's bottom part and camera by velocity vector and scale by time difference (dt)
		vec3.scaleAndAdd(this.bot.translation, this.bot.translation, this.defaults.velocity, dt);
		vec3.scaleAndAdd(this.top.translation, this.top.translation, this.defaults.velocity, dt);

		// Update matrices - we have to update top matrix as well, as it is bot's child node
		this.bot.updateMatrix();
		this.top.updateMatrix();
	}

	reduceHealth(damage) {
		this.currHealth -= damage;

		if(this.currHealth <= 0){
			this.desroyed=true;
			this.soundManager.playBoom();

		
			// swap with destroyed model
			let tmpBot=mat4.clone(this.destroyedBot.matrix);
			let tmpTop=mat4.clone(this.destroyedTop.matrix);
			mat4.copy(this.destroyedBot.matrix, this.bot.matrix);
			mat4.copy(this.destroyedTop.matrix, this.top.matrix);
			mat4.copy(this.bot.matrix, tmpBot);
			mat4.copy(this.top.matrix, tmpTop);

			this.destroyedBot.updateTransform();
			this.destroyedTop.updateTransform();
			this.bot.updateTransform();
			this.top.updateTransform();
		}
	}
}
