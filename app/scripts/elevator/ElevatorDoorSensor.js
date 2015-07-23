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
		this._remainOpen = elevator.isOverweight;

		elevator.on('change:overweight', this._onOverweightChange.bind(this));

		for (let event of ['stop', 'persons:add', 'persons:remove']) {
			elevator.on(event, this.open.bind(this));
		}
	}

	get state() {
		return STATES[this._state][0];
	}

	open() {
		switch (this._state) {
			// do not set timeout in case 1, since we're already opening them in that state
			case 0:
			case 2:
				this._setTimeout();
				break;
			case 3:
				this._state = 0;
				this._nextState();
				break;
		}
	}

	/*
	 * If shouldTestTimeout is true and if the timeout value
	 * of the next state is 0, then it won't schedule it.
	 *
	 * In our case it will stop if the current state is shutting,
	 * since the next state is shut, which has a timeout of 0.
	 */
	_setTimeout(shouldTestTimeout) {
		const timeout = STATES[this._state][1];

		this._clearTimeout();

		if (!this._remainOpen && (!shouldTestTimeout || timeout)) {
			this._timer = setTimeout(this._nextState.bind(this), timeout);
		}
	}

	_clearTimeout() {
		clearTimeout(this._timer);
		this._timer = null;
	}

	_nextState() {
		this._state = (this._state + 1) % STATES.length;

		this._setTimeout(true); // schedule the next state
		this.emit(this.state);
	}

	_onOverweightChange(overweight) {
		this._remainOpen = overweight;
		this.open();
	}
}


export default ElevatorDoorSensor;
