'use strict';

import ElevatorDoorSensor from './ElevatorDoorSensor';
import ElevatorLevelSensor from './ElevatorLevelSensor';
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
		console.assert((maxLevel - minLevel) >= 0);


		super();

		this.setMaxListeners(0);


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
		 * This variable will be true from the time a "move"
		 * event until the next "stop" event is emitted
		 * (it thus helps to track the state).
		 */
		this._isMoving = false;

		this._isDoorOpen = false;

		/*
		 * An array of boolean tuples (i.e. an array of size 2).
		 * Each tuple represents a level of the evelator.
		 * level[0] stands for a down request, and level[1] for a up request.
		 */
		const levels = new Array(this.levelCount);

		for (let i = 0; i < levels.length; i++) {
			levels[i] = [false, false];

			const l = i + this._minLevel;
			const sensor = new ElevatorLevelSensor(this, l);
			sensor.on('contact', this._onLevelContact.bind(this, l));
		}

		this._levels = levels;

		/*
		 * Contains the amount of levels to stop at in sum,
		 * above/below the level for the down/up direction.
		 *
		 * Keeping track of the amount of stops helps us making
		 * this an O(1) instead of an O(n) algorithm.
		 */
		this._stops = [
			[0, 0],
			[0, 0],
		];

		const doorSensor = new ElevatorDoorSensor(this);
		doorSensor.on('shut', this._onDoorShut.bind(this));

		/*
		 * Forward door events:
		 * "open"  => "door:open"
		 * "close" => "door:close"
		 */
		 for (let name of ['opening', 'open', 'shutting', 'shut']) {
			const eventName = 'door:' + name;

			doorSensor.on(name, () => {
				this.emit(eventName, this.level);
			});
		}

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

	get isOverweight() {
		return this._weightSensor.weight() > Elevator.maxWeight;
	}

	addPerson() {
		this.emit('persons:add');
	}

	removePerson() {
		this.emit('persons:remove');
	}

	_levelData(level) {
		return this._levels[level - this._minLevel];
	}

	/*
	 * direction < 0 --> down request on "level"
	 * direction = 0 --> internal request (from inside the elevator), since those are "up & down" at once
	 * direction > 0 --> up request on "level"
	 */
	request(level, direction) {
		if (level >= this._minLevel && level <= this._maxLevel) {
			if (direction) {
				this._request(level, direction);
			} else {
				this._request(level, -1);
				this._request(level,  1);
			}

			const stops = this._stops;
			const stopsBelow = stops[0][0] + stops[0][1];
			const stopsAbove = stops[1][0] + stops[1][1];

			// only begin moving if the simulator is idle and if there are no stops
			if (!this._direction && (stopsBelow + stopsAbove) > 0) {
				// set the direction to be the one with more stops
				this._direction = 2 * (stopsBelow < stopsAbove) - 1;
				this._emitMove();
			}
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

	_onDoorShut() {
		const idx = tupleIdx(this._direction);
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
		const idx = tupleIdx(this._direction);
		const l = this._levelData(this._level);
		const s = this._stops[idx];

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
}

Elevator.timePerLevel         = 500.0;                     // ms
Elevator.doorOpenCloseTimeout = 500.0;                     // ms
Elevator.doorTimeout          = 1000.0;                    // ms
Elevator.personWeight         = 80.0;                      // kg
Elevator.maxWeight            = 8 * Elevator.personWeight; // kg


export default Elevator;
