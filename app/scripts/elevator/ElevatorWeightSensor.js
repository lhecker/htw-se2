'use strict';

import ElevatorProperties from './ElevatorProperties';


class ElevatorWeightSensor {
	constructor(elevator) {
		elevator.on('persons:add', this._onPersonsAdd.bind(this));
		elevator.on('persons:remove', this._onPersonsRemove.bind(this));

		this._weight = 0;
	}

	_onPersonsAdd() {
		this._weight += ElevatorProperties.personWeight;
	}

	_onPersonsRemove() {
		this._weight -= ElevatorProperties.personWeight;
	}

	weight() {
		return this._weight;
	}
}


export default ElevatorWeightSensor;
