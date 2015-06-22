'use strict';

import {Elevator, ElevatorProperties} from '../../app/scripts/elevator';


describe('Elevator Test Suite', function () {
	const levelMin = 1;
	const levelMax = 5;
	let elevator = null;

	beforeEach(function() {
		elevator = new Elevator(levelMin, levelMax);
	});

	it('Basic getter tests', function () {
		expect(elevator.minLevel).toBe(levelMin);
		expect(elevator.maxLevel).toBe(levelMax);
		expect(elevator.levelCount).toBe(levelMax - levelMin + 1);
		expect(elevator.level).toBe(levelMin);
		expect(elevator.direction).toBe(0);
		expect(elevator.isMoving).toBe(false);
		expect(elevator.isDoorOpen).toBe(false);
		expect(elevator.isOverweight).toBe(false);
	});

	it('DoorSensor tests', function () {
	});

	it('LevelSensor tests', function () {
	});

	it('WeightSensor tests', function () {
		function assert(overweight, weight) {
			expect(elevator.isOverweight).toBe(overweight);
			expect(elevator._weightSensor.weight()).toBe(weight);
		}

		const personCount = ElevatorProperties.maxWeight / ElevatorProperties.personWeight;
		expect(personCount).not.toBeNaN();

		let weight = 0;

		while (weight <= ElevatorProperties.maxWeight) {
			assert(false, weight);

			elevator.addPerson();
			weight += ElevatorProperties.personWeight;
		}

		// at this point the elevator should contain exactly one person more than maximally allowed
		assert(true, weight);

		// due to the ">=" this loop will try to remove one more person after the elevator is already empty
		while (weight >= 0) {
			elevator.removePerson();
			weight -= ElevatorProperties.personWeight;

			assert(false, Math.max(0, weight));
		}
	});
});
