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
});
