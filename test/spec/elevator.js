'use strict';

import {Elevator, ElevatorProperties} from '../../app/scripts/elevator';


describe("Elevator Test Suite", function() {

	const level_min = 1;
	const level_max = 5;
	var elevator;	

	beforeAll(function() {
		elevator = new Elevator(level_min,level_max);
	});

	it("self description consistent and correct", function() {
		expect(elevator.minLevel()).toEqual(level_min);
		expect(elevator.maxLevel()).toEqual(level_max);
	});
});