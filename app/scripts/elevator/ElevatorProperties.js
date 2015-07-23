'use strict';

const timePerLevel         = 5000.0;           // ms
const doorOpenCloseTimeout = 500.0;            // ms
const doorTimeout          = 5000.0;           // ms
const shortestTimeout      = Math.min(timePerLevel, doorOpenCloseTimeout, doorTimeout);
const personWeight         = 80.0;             // kg
const maxWeight            = 8 * personWeight; // kg

export default {
	timePerLevel,
	doorOpenCloseTimeout,
	doorTimeout,
	shortestTimeout,
	personWeight,
	maxWeight,
};
