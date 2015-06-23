'use strict';

import ElevatorDoorSensor from './ElevatorDoorSensor';
import ElevatorLevelSensor from './ElevatorLevelSensor';
import ElevatorProperties from './ElevatorProperties';
import ElevatorWeightSensor from './ElevatorWeightSensor';
import EventEmitter from 'events';


const ENUM_REQUEST_NONE     = 0;
const ENUM_REQUEST_INTERNAL = 1;
const ENUM_REQUEST_EXTERNAL = 2;


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

		const self = this;


		self.setMaxListeners(0);


		/*
		 * The following code will create the initial values of some properties of the class.
		 * They will be described at their assignment to this._* farther below.
		 */
		const requests = new Array(maxLevel - minLevel + 1);


		for (let i = 0; i < requests.length; i++) {
			requests[i] = [0, 0, 0];

			const l = i + minLevel;
			const sensor = new ElevatorLevelSensor(self, l);
			sensor.on('contact', self._onLevelContact.bind(self, l));
		}


		const stops = [
			[0, 0, 0],
			[0, 0, 0],
		];


		const doorSensor = new ElevatorDoorSensor(self);
		doorSensor.on('shut', self._tryMove.bind(self));

		// Forward door events:
		for (let name of ['opening', 'open', 'shutting', 'shut']) {
			const eventName = 'door:' + name;

			doorSensor.on(name, () => {
				self.emit(eventName, self._level);
			});
		}


		/*
		 * Min/max level of the elevator (inclusive).
		 */
		self._minLevel = minLevel;
		self._maxLevel = maxLevel;

		/*
		 * The current level the elevator is at.
		 */
		self._level = minLevel;

		/*
		 * direction = +1 => moving downwards
		 * direction =  0 => idle
		 * direction = -1 => moving upwards
		 */
		self._direction = 0;

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
		self._requests = requests;

		/*
		 * Contains the amount of levels to stop at in sum,
		 * above/below the level for the down/up direction.
		 *
		 * Keeping track of the amount of stops helps us making
		 * this an O(1) instead of an O(n) algorithm.
		 */
		self._stops = stops;

		/*
		 * The following properties will help tracking the state of the lift.
		 */
		self._isMoving = false;

		/*
		 * The following properties contain references
		 * to (simulated) active sensors.
		 */
		self._doorSensor = doorSensor;
		self._weightSensor = new ElevatorWeightSensor(self);
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
		return this._doorSensor.state() === 'open';
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

	hasRequestOnLevel(level) {
		const r = this._requestData(level);
		return r[0] || r[1];
	}

	/*
	 * direction < 0 --> down request on "level"
	 * direction = 0 --> internal request (from inside the elevator), since those are "up & down" at once
	 * direction > 0 --> up request on "level"
	 */
	request(level, direction) {
		function apply(idx) {
			// only increment if the level has not already been accounted for
			if (!r[idx]) {
				r[idx] = 1;
				s[idx]++;
			}
		}

		/*
		 * Contains the relative direction of "level" to the current level.
		 * If the level is equal to level, it will check if the elevator is
		 * currently moving and use it's current direction in that case.
		 */
		const self = this;
		const relativePosition = (level - self._level) || (self._isMoving && -self._direction);
		const r = self._requestData(level);
		const s = self._stops[tupleIdx(relativePosition)];

		if (!self._isMoving && self._level === level) {
			self._emitStop();
		} else if (relativePosition) {
			direction = Math.sign(direction);

			if (direction) {
				apply(tupleIdx(direction));
			} else {
				apply(2);
			}

			self.emit('requests:add', level, direction);
			self._tryMove();
		}
	}

	_tryMove() {
		const self = this;

		if (!self.isMoving && !self.isDoorOpen) {
			let direction = self._direction;

			if (!direction) {
				const stops = self._stops;
				const stopsBelow = stops[0][0] + stops[0][1] + stops[0][2];
				const stopsAbove = stops[1][0] + stops[1][1] + stops[1][2];

				if (!stopsBelow && !stopsAbove) {
					// if !direction && !stops then this elevator was already and can remain being idle
					return;
				}

				// set the direction to be the one with more stops
				self._direction = direction = 2 * (stopsBelow < stopsAbove) - 1;
			}

			const idx = tupleIdx(direction);
			const s = self._stops[idx];

			if (s[0] || s[1] || s[2]) {
				// there are stops in d.
				self._emitMove();
			} else {
				const oidx = 1 - idx;
				const os = self._stops[oidx];

				self._direction *= -1;

				if (os[0] || os[1] || os[2]) {
					self._emitMove();
				} else {
					self._emitIdle();
				}
			}
		}
	}

	_onLevelContact(level, isOppositeCheck) {
		const self = this;
		const idx = tupleIdx(self._direction);
		const oidx = 1 - idx;
		const r = self._requestData(level);
		const s = self._stops[idx];

		self._level = level;
		self._emitLevel();

		/*
		 * "self._direction" will be abbreviated as "d." in the comments below,
		 * while the opposite of self "direction" will be called "od.".
		 */
		if (r[2] || r[idx]) {
			// there is a stop in d. on self level
			self._emitStop();
		} else {
			// there is no stop in d. on self level

			if (s[2] || s[idx]) {
				// but there are other stops in d. for d.
				self._emitMove();
			} else {
				// and no further stops in d. for d.

				if (s[oidx]) {
					// but there are other stops in d. for od.

					if (r[oidx]) {
						// if self would be a stop in od.

						if (s[oidx] > 1) {
							// if there are stops farther in d. for od.
							self._emitMove();
						} else {
							// or if self is the farthest
							self._emitStop();
						}
					} else {
						// or if self level has no requests at all
						self._emitMove();
					}
				} else {
					// or no further stops in d. at all

					if (isOppositeCheck) {
						// if self "is opposite check" we have finished checking both directions --> idle
						self._emitIdle();
					} else {
						// or if it isn't we still need to check the opposite direction for stops
						self._direction *= -1;
						self._onLevelContact(level, true);
					}
				}
			}
		}
	}

	_emitLevel() {
		const self = this;
		self.emit('level', self._level);
	}

	_emitMove() {
		const self = this;
		const idx = tupleIdx(self._direction);
		const oidx = 1 - idx;

		if (self._requestData(self._level)[oidx]) {
			/*
			 * We are skipping a request for self level in the opposite direction
			 * --> account for it when we come back
			 */
			self._stops[idx][oidx]--;
			self._stops[oidx][oidx]++;
		}

		self._isMoving = true;
		self.emit('move', self._level, self._direction);
	}

	_emitStop() {
		function emit(direction) {
			self.emit('requests:remove', level, direction);
		}

		function apply(idx) {
			if (r[idx]) {
				r[idx] = 0;
				s[idx]--;

				if (idx === 2) {
					emit(0);
				} else {
					emit(2 * idx - 1);
				}
			}
		}

		const self = this;
		const level = self._level;
		const r = self._requestData(level);
		const s = self._stops[tupleIdx(self._direction)];

		self._isMoving = false;

		apply(0);
		apply(1);
		apply(2);

		self.emit('stop', level);
	}

	_emitIdle() {
		const self = this;
		self._direction = 0;
		self.emit('idle', self._level);
	}

	_requestData(level) {
		const self = this;
		return self._requests[level - self._minLevel];
	}
}


export default Elevator;
