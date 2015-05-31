'use strict';

require("babelify/polyfill");

import Elevator from './elevator/Elevator';

import AccessoryView from './AccessoryView';
import ElevatorView from './ElevatorView';

const elevator = new Elevator(1, 9);
window.elevator = elevator; // TODO

React.render(
	<div className="row">
		<div className="col-sm-2">
			<ElevatorView elevator={elevator}/>
		</div>
		<div className="col-sm-10">
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
