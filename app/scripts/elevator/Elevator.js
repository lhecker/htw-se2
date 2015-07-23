'use strict';

import ElevatorDoorSensor from './ElevatorDoorSensor';
import ElevatorLevelSensor from './ElevatorLevelSensor';
import ElevatorProperties from './ElevatorProperties';
import ElevatorWeightSensor from './ElevatorWeightSensor';
import EventEmitter from 'events';


/*
 * Helper method for access to the stops and levels tuples.
 */
function directionToTupleIdx(direction) {
	return direction < 0 ? 0 : direction > 0 ? 1 : 2;
}

function tupleIdxToDirection(idx) {
	return [-1, 1, 0][idx];
}


class Elevator extends EventEmitter {
	constructor(minLevel, maxLevel) {
		console.assert(minLevel < maxLevel);

		super();

		this.setMaxListeners(0);


		/*
		 * Min/max level of the elevator (inclusive).
		 */
		this._minLevel = minLevel;
		this._maxLevel = maxLevel;

		/*
		 * The current level the elevator is at.
		 */
		this._level = minLevel;

		/*
		 * direction = +1 => moving downwards
		 * direction =  0 => idle
		 * direction = -1 => moving upwards
		 */
		this._direction = 0;

		/*
		 * An array of integral 3-tuples (i.e. an array of size 3).
		 * Each tuple represents a level of the evelator,
		 * while the first/second/third tuple value is greater zero
		 * if that particular level has a down/up/internal request (respectively):
		 *
		 * _requests[x][0] == 1 --> external down request
		 * _requests[x][1] == 1 --> external up request
		 * _requests[x][2] == 1 --> internal request
		 */
		this._requests = new Array(this._maxLevel - this._minLevel + 1);

		/*
		 * Contains the amount of levels to stop at in sum,
		 * above/below the level for the down/up direction.
		 *
		 * Keeping track of the amount of stops helps us making
		 * this an O(1) instead of an O(n) algorithm.
		 */
		this._stops = [
			[0, 0, 0],
			[0, 0, 0],
		];

		/*
		 * The following properties will help tracking the state of the lift.
		 */
		this._isMoving = false;
		this._isOverweight = false;


		for (let i = 0; i < this._requests.length; i++) {
			this._requests[i] = [0, 0, 0];

			const l = i + this._minLevel;
			const sensor = new ElevatorLevelSensor(this, l);
			sensor.on('contact', this._onLevelContact.bind(this, l));
		}


		this._weightSensor = new ElevatorWeightSensor(this);
		this._weightSensor.on('change', (isOverweight) => {
			this._isOverweight = isOverweight;
			this.emit('change:overweight', isOverweight);
		});


		this._doorSensor = new ElevatorDoorSensor(this);

		// Forward door events:
		for (let name of ['opening', 'open', 'shutting', 'shut']) {
			this._doorSensor.on(name, this.emit.bind(this, 'door:' + name));
		}

		/*
		 * IMPORTANT:
		 *  move/idle events are triggered in _onDoorShut().
		 *  --> This .on() must be bound AFTER the above handlers forwarding events
		 */
		this._doorSensor.on('shut', this._onDoorShut.bind(this));
	}

	get minLevel() {
		return this._minLevel;
	}

	get maxLevel() {
		return this._maxLevel;
	}

	get levelCount() {
		return this._maxLevel - this._minLevel + 1;
	}

	get level() {
		return this._level;
	}

	get direction() {
		return this._direction;
	}

	get doorState() {
		return this._doorSensor.state;
	}

	get isDoorUnlocked() {
		return this.doorState !== 'shut';
	}

	get isMoving() {
		return this._isMoving;
	}

	get isOverweight() {
		return this._isOverweight;
	}

	addPerson() {
		if (this.isDoorUnlocked) {
			this.emit('persons:add');
		}
	}

	removePerson() {
		if (this._weightSensor.weight > 0) {
			this.emit('persons:remove');
		}
	}

	hasRequest(level, direction) {
		const r = this._requestData(level);
		return !!(direction ? r[directionToTupleIdx(direction)] : (r[0] || r[1]));
	}

	/*
	 * direction < 0 --> down request on "level"
	 * direction = 0 --> internal request (from inside the elevator), since those are "up & down" at once
	 * direction > 0 --> up request on "level"
	 */
	request(level, direction) {
		/*
		 * Contains the relative direction of "level" to the current level.
		 * If the level is equal to level, it will check if the elevator is
		 * currently moving and use it's current direction in that case.
		 */
		const relativePosition = (level - this._level) || (this._isMoving && -this._direction);

		if (this._level === level && !this.isMoving) {
			this._doorSensor.open();
		} else if (relativePosition) {
			direction = Math.sign(direction);

			const r = this._requestData(level);
			const s = this._stops[directionToTupleIdx(relativePosition)];
			const idx = direction ? directionToTupleIdx(direction) : 2;

			// only increment if the level has not already been accounted for
			if (!r[idx]) {
				r[idx] = 1;
				s[idx]++;
			}

			this.emit('requests:add', level, direction);

			if (!this.direction && !this.isDoorUnlocked && !this.isOverweight) {
				this._beginMoving();
			}
		}
	}

	_beginMoving() {
		const stops = this._stops;
		const stopsBelow = stops[0][0] + stops[0][1] + stops[0][2];
		const stopsAbove = stops[1][0] + stops[1][1] + stops[1][2];

		if (stopsBelow || stopsAbove) {
			this._direction = 2 * (stopsBelow < stopsAbove) - 1;
			this._emitMove();
		}
	}

	_onDoorShut() {
		if (!this.isOverweight) {
			if (!this._direction) {
				this._beginMoving();
			} else {
				const idx = directionToTupleIdx(this._direction);
				const s = this._stops[idx];

				if (s[0] || s[1] || s[2]) {
					// there are stops in d.
					this._emitMove();
				} else {
					const oidx = 1 - idx;
					const os = this._stops[oidx];

					this._direction *= -1;

					if (os[0] || os[1] || os[2]) {
						this._emitMove();
					}
				}
			}
		}

		if (!this.isMoving) {
			this._emitIdle();
		}
	}

	_onLevelContact(level, isOppositeCheck) {
		const idx = directionToTupleIdx(this._direction);
		const oidx = 1 - idx;
		const r = this._requestData(level);
		const s = this._stops[idx];

		this._level = level;
		this._emitLevel();

		/*
		 * "this._direction" will be abbreviated as "d." in the comments below,
		 * while the opposite of this "direction" will be called "od.".
		 */
		if (r[2] || r[idx]) {
			// there is a stop in d. on this level
			this._emitStop();
		} else {
			// there is no stop in d. on this level

			if (s[2] || s[idx]) {
				// but there are other stops in d. for d.
				this._emitMove();
			} else {
				// and no further stops in d. for d.

				if (s[oidx]) {
					// but there are other stops in d. for od.

					if (r[oidx]) {
						// if this would be a stop in od.

						if (s[oidx] > 1) {
							// if there are stops farther in d. for od.
							this._emitMove();
						} else {
							// or if this is the farthest
							this._emitStop();
						}
					} else {
						// or if this level has no requests at all
						this._emitMove();
					}
				} else {
					// or no further stops in d. at all

					if (isOppositeCheck) {
						// if this "is opposite check" we have finished checking both directions --> idle
						this._emitIdle();
					} else {
						// or if it isn't we still need to check the opposite direction for stops
						this._direction *= -1;
						this._onLevelContact(level, true);
					}
				}
			}
		}
	}

	_emitLevel() {
		this.emit('change:level', this._level);
	}

	_emitMove() {
		const idx = directionToTupleIdx(this._direction);
		const oidx = 1 - idx;

		if (this._requestData(this._level)[oidx]) {
			/*
			 * We are skipping a request for this level in the opposite direction
			 * --> account for it when we come back
			 */
			this._stops[idx][oidx]--;
			this._stops[oidx][oidx]++;
		}

		this._isMoving = true;
		this.emit('move', this._level, this._direction);
	}

	_emitStop() {
		const level = this._level;
		const r = this._requestData(level);
		const s = this._stops[directionToTupleIdx(this._direction)];

		this._isMoving = false;

		for (let idx = 0; idx < r.length; idx++) {
			if (r[idx]) {
				r[idx] = 0;
				s[idx]--;

				this.emit('requests:remove', level, idx === 2 ? 0 : (2 * idx - 1));
			}
		}

		this.emit('stop', level);
	}

	_emitIdle() {
		this._direction = 0;
		this.emit('idle', this._level);
	}

	_requestData(level) {
		return this._requests[level - this._minLevel];
	}
}


export default Elevator;
