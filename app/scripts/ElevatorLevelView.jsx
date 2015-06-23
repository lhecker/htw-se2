'use strict';

import {ElevatorProperties} from './elevator';


class ElevatorLevelView extends React.Component {
	constructor(props) {
		super(props);

		this._resetIVars();
	}

	componentDidMount() {
		const elevator = this.props.elevator;

		this._requestAddCallback    = this._onRequest.bind(this, true);
		this._requestRemoveCallback = this._onRequest.bind(this, false);

		this._doorOpeningCallback   = this._onDoor.bind(this, true);
		this._doorShuttingCallback  = this._onDoor.bind(this, false);

		elevator.on('requests:add', this._requestAddCallback);
		elevator.on('requests:remove', this._requestRemoveCallback);

		elevator.on('door:opening', this._doorOpeningCallback);
		elevator.on('door:shutting', this._doorShuttingCallback);
	}

	componentWillUnmount() {
		const elevator = this.props.elevator;

		elevator.removeListener('requests:add', this._requestAddCallback);
		elevator.removeListener('requests:remove', this._requestRemoveCallback);

		elevator.removeListener('door:opening', this._doorOpeningCallback);
		elevator.removeListener('door:shutting', this._doorShuttingCallback);

		this._resetIVars();
	}

	render() {
		const doorStyle = {
			transitionDuration: ElevatorProperties.doorOpenCloseTimeout + 'ms',
		};

		return (
			<div className="level">
				<div className="request-up" onClick={this._request.bind(this, 1)}><span className="glyphicon glyphicon-triangle-top"></span></div>
				<div className="request-down" onClick={this._request.bind(this, -1)}><span className="glyphicon glyphicon-triangle-bottom"></span></div>
				<div className="door-left" style={doorStyle}><span className="label">{this.props.level}</span></div>
				<div className="door-right" style={doorStyle}></div>
			</div>
		);
	}

	_resetIVars() {
		this._requestAddCallback    = null;
		this._requestRemoveCallback = null;

		this._doorOpeningCallback   = null;
		this._doorShuttingCallback  = null;
	}

	_request(direction) {
		this.props.elevator.request(this.props.level, direction);
	}

	_onRequest(add, level, direction) {
		if (direction && level === this.props.level) {
			const node = React.findDOMNode(this);

			$('.request-' + (direction > 0 ? 'up' : 'down'), node).toggleClass('active', add);
		}
	}

	_onDoor(open, level) {
		if (level === this.props.level) {
			$(React.findDOMNode(this)).toggleClass('open', open);
		}
	}
}


export default ElevatorLevelView;
