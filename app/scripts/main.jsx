'use strict';

import 'babelify/polyfill'; // provides ES6 polyfills

import AccessoryView from './AccessoryView';
import ElevatorView from './ElevatorView';
import UmlView from './UmlView';
import {Elevator} from './elevator';

const elevator = new Elevator(0, 5);
window.elevator = elevator;

React.render(
	<ElevatorView elevator={elevator}/>,
	document.getElementById('elevator-view-mount')
);

React.render(
	<AccessoryView elevator={elevator}/>,
	document.getElementById('accessory-view-mount')
);

React.render(
	<UmlView elevator={elevator}/>,
	document.getElementById('uml-view-mount')
);
