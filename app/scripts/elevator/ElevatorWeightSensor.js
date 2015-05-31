'use strict';

import Elevator from './Elevator';


class ElevatorWeightSensor {
	constructor(elevator) {
		elevator.on('persons:add', this._onPersonsAdd.bind(this));
		elevator.on('persons:remove', this._onPersonsRemove.bind(this));

		this._weight = 0;
	}

	_onPersonsAdd() {
		this._weight += Elevator.personWeight;
	}

	_onPersonsRemove() {
		this._weight -= Elevator.personWeight;
	}

	weight() {
		return this._weight;
	}
}


export default ElevatorWeightSensor;
