'use strict';

require('babelify/polyfill');

import Elevator from './elevator/Elevator';

import AccessoryView from './AccessoryView';
import ElevatorView from './ElevatorView';

const elevator = new Elevator(1, 9);
window.elevator = elevator; // TODO

React.render(
	<div className="row">
		<div className="col-sm-4 col-lg-3">
			<ElevatorView elevator={elevator}/>
		</div>
		<div className="col-sm-8 col-lg-9">
			<div className="row">
				<div className="col-xs-12">
					<AccessoryView elevator={elevator}/>
				</div>
			</div>
			<div className="row">
				<div className="col-xs-12">
					<div className="well well-sm">SVG</div>
				</div>
			</div>
		</div>
	</div>,
	document.getElementById('content')
);
