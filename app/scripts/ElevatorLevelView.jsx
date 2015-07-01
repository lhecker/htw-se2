'use strict';

import Component from './Component';
import {ElevatorProperties} from './elevator';


class ElevatorLevelView extends Component {
	constructor(props) {
		super(props);
	}

	componentWillMount() {
		const elevator = this.props.elevator;

		this._bind(elevator, 'requests:add',    this._onRequest, true);
		this._bind(elevator, 'requests:remove', this._onRequest, false);
		this._bind(elevator, 'door:opening',    this._onDoor,    true);
		this._bind(elevator, 'door:shutting',   this._onDoor,    false);
	}

	render() {
		const elevator = this.props.elevator;
		const level = this.props.level;

		const doorStyle = {
			transitionDuration: ElevatorProperties.doorOpenCloseTimeout + 'ms',
		};

		const displayNone = { display: 'none' };
		const requestUp   = level === elevator.maxLevel ? displayNone : {};
		const requestDown = level === elevator.minLevel ? displayNone : {};

		return (
			<div className="level">
				<div className="request-down glyphicon glyphicon-collapse-down" style={requestDown} onClick={this._request.bind(this, -1)}></div>
				<div className="request-up glyphicon glyphicon-collapse-up"     style={requestUp}   onClick={this._request.bind(this,  1)}></div>
				<div className="door-left"  style={doorStyle}><span className="label">{this.props.level}</span></div>
				<div className="door-right" style={doorStyle}></div>
			</div>
		);
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

ElevatorLevelView.propTypes = {
	elevator: React.PropTypes.object.isRequired,
	level: React.PropTypes.number.isRequired,
};


export default ElevatorLevelView;
