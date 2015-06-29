'use strict';

import {Elevator, ElevatorProperties} from '../../app/scripts/elevator';


describe('Elevator Test Suite', () => {
	const DOOR_STATES = [
		['opening',  0],
		['open',     ElevatorProperties.doorOpenCloseTimeout],
		['shutting', ElevatorProperties.doorTimeout],
		['shut',     ElevatorProperties.doorOpenCloseTimeout],
	];
	const DOOR_STATES_duration = DOOR_STATES.reduce((sum, state) => sum + state[1], 0);
	const minLevel = 1;
	const maxLevel = 5;
	let elevator = null;

	beforeEach(() => {
		elevator = new Elevator(minLevel, maxLevel);
	});

	it('Basic getter tests', () => {
		expect(elevator.minLevel).toBe(minLevel);
		expect(elevator.maxLevel).toBe(maxLevel);
		expect(elevator.levelCount).toBe(maxLevel - minLevel + 1);
		expect(elevator.level).toBe(minLevel);
		expect(elevator.direction).toBe(0);
		expect(elevator.isMoving).toBe(false);
		expect(elevator.isDoorUnlocked).toBe(false);
		expect(elevator.isOverweight).toBe(false);
	});

	it('DoorSensor tests', () => {
	});

	it('LevelSensor tests', () => {
	});

	it('WeightSensor tests', () => {
		function assert(overweight, weight) {
			expect(elevator.isOverweight).toBe(overweight);
			expect(elevator._weightSensor._weight).toBe(weight);
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

		elevator.request(elevator.maxLevel, 0);
		expect(elevator.isMoving).toBe(false);

		// due to the ">=" this loop will try to remove one more person after the elevator is already empty
		while (weight >= 0) {
			elevator.removePerson();
			weight -= ElevatorProperties.personWeight;

			assert(false, Math.max(0, weight));
		}

		expect(elevator.isMoving).toBe(true);
	});
});
