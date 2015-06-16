'use strict';

import {Elevator, ElevatorProperties} from '../../app/scripts/elevator';


describe("Elevator Test Suite", function() {
	const levelMin = 1;
	const levelMax = 5;
	const elevator = new Elevator(levelMin, levelMax);

	it("self description consistent and correct", function() {
		expect(elevator.minLevel).toBe(levelMin);
		expect(elevator.maxLevel).toBe(levelMax);
		expect(elevator.levelCount).toBe(levelMax - levelMin + 1);
		expect(elevator.getLevel).toBeGreaterThan(levelMin-1);
		expect(elevator.getLevel).toBeLessThan(levelMax+1);
	});
});
