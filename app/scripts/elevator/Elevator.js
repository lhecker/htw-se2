'use strict';

import ElevatorDoorSensor from './ElevatorDoorSensor';
import ElevatorLevelSensor from './ElevatorLevelSensor';
import ElevatorProperties from './ElevatorProperties';
import ElevatorWeightSensor from './ElevatorWeightSensor';
import EventEmitter from 'events';


/*
 * Helper method for access to the stops and levels tuples.
 *
 * The first value of those tuples contains a value meant
 * for the down and the second value for the up direction.
 * This method will generate the index (0 or 1)
 * for the direction (lt. 0 or gt. 0).
 */
function tupleIdx(direction) {
	return +(direction > 0);
}


class Elevator extends EventEmitter {
	constructor(minLevel, maxLevel) {
		super();
		this.setMaxListeners(0);


		/*
		 * The following code will create the initial values of some properties of the class.
		 * They will be described at their assignment to this._* farther below.
		 */

		const levels = new Array(maxLevel - minLevel + 1);

		for (let i = 0; i < levels.length; i++) {
			levels[i] = [false, false];

			const l = i + minLevel;
			const sensor = new ElevatorLevelSensor(this, l);
			sensor.on('contact', this._onLevelContact.bind(this, l));
		}


		const stops = [
			[0, 0],
			[0, 0],
		];


		const doorSensor = new ElevatorDoorSensor(this);

		doorSensor.on('opening', () => {
			this._isDoorOpen = true;
		});

		doorSensor.on('shut', () => {
			this._isDoorOpen = false;
			this._tryMove();
		});

		// Forward door events:
		for (let name of ['opening', 'open', 'shutting', 'shut']) {
			const eventName = 'door:' + name;

			doorSensor.on(name, () => {
				this.emit(eventName, this.level);
			});
		}


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
		 * An array of boolean tuples (i.e. an array of size 2).
		 * Each tuple represents a level of the evelator.
		 * level[0] stands for a down request, and level[1] for a up request.
		 */
		this._levels = levels;

		/*
		 * Contains the amount of levels to stop at in sum,
		 * above/below the level for the down/up direction.
		 *
		 * Keeping track of the amount of stops helps us making
		 * this an O(1) instead of an O(n) algorithm.
		 */
		this._stops = stops;

		/*
		 * The following properties will help tracking the state of the lift.
		 */
		this._isMoving = false;
		this._isDoorOpen = false;

		/*
		 * The following properties contain references
		 * to (simulated) active sensors.
		 */
		this._doorSensor = doorSensor;
		this._weightSensor = new ElevatorWeightSensor(this);
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

	get isMoving() {
		return this._isMoving;
	}

	get isDoorOpen() {
		return this._isDoorOpen;
	}

	get isOverweight() {
		return this._weightSensor.weight() > ElevatorProperties.maxWeight;
	}

	addPerson() {
		this.emit('persons:add');
	}

	removePerson() {
		this.emit('persons:remove');
	}

	/*
	 * direction < 0 --> down request on "level"
	 * direction = 0 --> internal request (from inside the elevator), since those are "up & down" at once
	 * direction > 0 --> up request on "level"
	 */
	request(level, direction) {
		console.assert(level >= this._minLevel && level <= this._maxLevel);

		if (!this._isMoving && this.level === level) {
			this._emitStop();
		} else {
			if (direction) {
				this._request(level, direction);
			} else {
				this._request(level, -1);
				this._request(level,  1);
			}

			this._tryMove();
		}
	}

	_request(level, direction) {
		/*
		 * Contains the relative direction of "level" to the current level.
		 * If the level is equal to level, it will check if the elevator is
		 * currently moving and use it's current direction in that case.
		 */
		const relativePosition = (level - this._level) || (this._isMoving && -this._direction);

		// only increment if the level has not already been accounted for
		if (relativePosition) {
			const l = this._levelData(level);
			const s = this._stops[tupleIdx(relativePosition)];
			const idx = tupleIdx(direction);

			if (!l[idx]) {
				l[idx] = true;
				s[idx]++;
				this.emit('requests:add', level, direction);
			}
		}
	}

	_tryMove() {
		if (!this._isMoving && !this._isDoorOpen) {
			let direction = this._direction;

			if (!direction) {
				const stops = this._stops;
				const stopsBelow = stops[0][0] + stops[0][1];
				const stopsAbove = stops[1][0] + stops[1][1];

				if (!stopsBelow && !stopsAbove) {
					// if !direction && !stops then this elevator was already and can remain being idle
					return;
				}

				// set the direction to be the one with more stops
				this._direction = direction = 2 * (stopsBelow < stopsAbove) - 1;
			}

			const idx = tupleIdx(direction);
			const s = this._stops[idx];

			if (s[0] || s[1]) {
				// there are stops in d.
				this._emitMove();
			} else {
				const oidx = 1 - idx;
				const os = this._stops[oidx];

				this._direction *= -1;

				if (os[0] || os[1]) {
					this._emitMove();
				} else {
					this._emitIdle();
				}
			}
		}
	}

	_onLevelContact(level, isOppositeCheck) {
		const idx = tupleIdx(this._direction);
		const oidx = 1 - idx;
		const l = this._levelData(level);
		const s = this._stops[idx];

		this._level = level;
		this._emitLevel();

		/*
		 * "this._direction" will be abbreviated as "d." in the comments below,
		 * while the opposite of this "direction" will be called "od.".
		 */
		if (l[idx]) {
			// there is a stop in d. on this level
			this._emitStop();
		} else {
			// there is no stop in d. on this level

			if (s[idx]) {
				// but there are other stops in d. for d.
				this._emitMove();
			} else {
				// and no further stops in d. for d.

				if (s[oidx]) {
					// but there are other stops in d. for od.

					if (l[oidx]) {
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
		this.emit('level', this.level);
	}

	_emitMove() {
		const idx = tupleIdx(this._direction);
		const oidx = 1 - idx;

		if (this._levelData(this._level)[oidx]) {
			/*
			 * We are skipping a request for this level in the opposite direction
			 * --> account for it when we come back
			 */
			this._stops[idx][oidx]--;
			this._stops[oidx][oidx]++;
		}

		this._isMoving = true;
		this.emit('move', this.level, this.direction);
	}

	_emitStop() {
		const l = this._levelData(this._level);
		const s = this._stops[tupleIdx(this._direction)];

		this._isMoving = false;

		if (l[0]) {
			l[0] = false;
			s[0]--;
			this.emit('requests:remove', this.level, -1);
		}

		if (l[1]) {
			l[1] = false;
			s[1]--;
			this.emit('requests:remove', this.level, 1);
		}

		this.emit('stop', this.level);
	}

	_emitIdle() {
		this._direction = 0;
		this.emit('idle', this.level);
	}

	_levelData(level) {
		return this._levels[level - this._minLevel];
	}
}


export default Elevator;
