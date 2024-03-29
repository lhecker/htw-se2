'use strict';

export function pad(val, minLength, pad = '0') {
	const valString = String(val);
	const valStringLength = valString.length;
	const padLength = minLength > valStringLength ? minLength - valStringLength : 0;

	return new Array(padLength).fill(pad).join('') + valString;
}

export function digits(number) {
	return Math.floor(Math.log10(number)) + 1;
}

export function shallowEqual(objA, objB) {
	if (objA === objB) {
		return true;
	}

	var key;

	// Test for A's keys different from B.
	for (key in objA) {
		if (objA.hasOwnProperty(key) &&
				(!objB.hasOwnProperty(key) || objA[key] !== objB[key])) {
			return false;
		}
	}

	// Test for B's keys missing from A.
	for (key in objB) {
		if (objB.hasOwnProperty(key) && !objA.hasOwnProperty(key)) {
			return false;
		}
	}

	return true;
}

export function nextPropsOrStateDifferent(component, nextProps, nextState) {
	return !shallowEqual(component.props, nextProps) || !shallowEqual(component.state, nextState);
}
