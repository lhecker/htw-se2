'use strict';

const timePerLevel         = 500.0;            // ms
const doorOpenCloseTimeout = 500.0;            // ms
const doorTimeout          = 1000.0;           // ms
const personWeight         = 80.0;             // kg
const maxWeight            = 8 * personWeight; // kg

export default {
	timePerLevel,
	doorOpenCloseTimeout,
	doorTimeout,
	personWeight,
	maxWeight,
};
