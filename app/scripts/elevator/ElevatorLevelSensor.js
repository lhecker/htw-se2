'use strict';

import EventEmitter from 'events';
import Elevator from './elevator';


class ElevatorLevelSensor extends EventEmitter {
	constructor(elevator, level) {
		super();

		this._level = level;

		elevator.on('move', this.onMove.bind(this));
	}

	onMove(level, direction) {
		if ((level + direction) === this._level) {
			setTimeout(this.emit.bind(this, 'contact'), Elevator.timePerLevel);
		}
	}
}


export default ElevatorLevelSensor;
