'use strict';

import ElevatorProperties from './ElevatorProperties';
import EventEmitter from 'events';

/*
 * Contains the state machine data of the ElevatorDoorSensor.
 *
 * The former value of the tuples in the array contain the current state name.
 * The latter value is the duration until the next state in the array is triggered
 * (i.e. the following array entry modulo to the array length).
 */
var STATES = [
	['shut',     0],
	['opening',  ElevatorProperties.doorOpenCloseTimeout],
	['open',     ElevatorProperties.doorTimeout],
	['shutting', ElevatorProperties.doorOpenCloseTimeout],
];


class ElevatorDoorSensor extends EventEmitter {
	constructor(elevator) {
		super();

		this._state = 0
		this._timer = null;

		elevator.on('stop', this._onStop.bind(this));
	}

	_setTimeout() {
		const timeout = STATES[this._state][1];

		if (timeout) {
			this._timer = setTimeout(this._nextState.bind(this), timeout);
		}
	}

	_nextState() {
		this._state = (this._state + 1) % STATES.length;

		this._setTimeout(); // schedule the next state
		this.emit(STATES[this._state][0]);
	}

	_onStop() {
		clearTimeout(this._timer);
		this._timer = null;

		switch (this._state) {
			case 0:
				this._nextState();
				break;
			case 2:
				this._setTimeout();
				break;
			case 3:
				this._state = 0;
				this._nextState();
				break;
		}
	}

	state() {
		return STATES[this._state][0];
	}
}


export default ElevatorDoorSensor;
