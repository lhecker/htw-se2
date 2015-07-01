'use strict';

import {nextPropsOrStateDifferent} from './utils';


class Component extends React.Component {
	constructor(props) {
		super(props);

		this._cbs = [];
	}

	_on(ee, name, cb) {
		ee.on(name, cb);
		this._cbs.push([ee, name, cb]);
	}

	_bind(ee, name, cb, ...args) {
		this._on(ee, name, cb.bind(this, ...args));
	}

	_off() {
		for (let [ee, name, cb] of this._cbs) {
			ee.removeListener(name, cb);
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		return nextPropsOrStateDifferent(this, nextProps, nextState);
	}

	componentWillUnmount() {
		this._off();
	}
}


export default Component;
