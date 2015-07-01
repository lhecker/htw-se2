'use strict';

import ElevatorProperties from './ElevatorProperties';
import EventEmitter from 'events';


class ElevatorWeightSensor extends EventEmitter {
	constructor(elevator) {
		super();

		elevator.on('persons:add',    this._update.bind(this, true));
		elevator.on('persons:remove', this._update.bind(this, false));

		this._weight = 0;
	}

	_update(add) {
		const newWeight = Math.max(0, this._weight + (2 * add - 1) * ElevatorProperties.personWeight);
		const wasOverweight = this._weight > ElevatorProperties.maxWeight;
		const isOverweight = newWeight > ElevatorProperties.maxWeight;

		this._weight = newWeight;

		if (wasOverweight != isOverweight) {
			this.emit('change', isOverweight);
		}
	}
}


export default ElevatorWeightSensor;
