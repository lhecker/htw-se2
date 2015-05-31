'use strict';

import EventEmitter from 'events';
import Elevator from './Elevator';


class ElevatorDoorSensor extends EventEmitter {
	constructor(elevator) {
		super();

		this._openTimer = null;

		elevator.on('stop', this._onStop.bind(this));
	}

	reset() {
		clearTimeout(this._openTimer);
		this._openTimer = setTimeout(this._onOpenTimeout.bind(this), Elevator.doorTimeout);
	}

	_onStop() {
		this.emit('opening');
		setTimeout(this._onOpeningTimeout.bind(this), Elevator.doorOpenCloseTimeout);
	}

	_onOpeningTimeout() {
		this.emit('open');
		this.reset();
	}

	_onOpenTimeout() {
		this._openTimer = null;
		this.emit('shutting');
		setTimeout(this._onShuttingTimeout.bind(this), Elevator.doorOpenCloseTimeout);
	}

	_onShuttingTimeout() {
		this.emit('shut');
	}
}


export default ElevatorDoorSensor;
