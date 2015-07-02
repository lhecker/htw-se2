'use strict';

const timePerLevel         = 1000.0;           // ms
const doorOpenCloseTimeout = 1000.0;           // ms
const doorTimeout          = 3000.0;           // ms
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
