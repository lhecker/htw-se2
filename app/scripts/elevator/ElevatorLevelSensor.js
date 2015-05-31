'use strict';

import ElevatorProperties from './ElevatorProperties';
import EventEmitter from 'events';


class ElevatorLevelSensor extends EventEmitter {
	constructor(elevator, level) {
		super();

		this._level = level;

		elevator.on('move', this._onMove.bind(this));
	}

	_onMove(level, direction) {
		if ((level + direction) === this._level) {
			setTimeout(this.emit.bind(this, 'contact'), ElevatorProperties.timePerLevel);
		}
	}
}


export default ElevatorLevelSensor;
