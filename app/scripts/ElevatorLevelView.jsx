'use strict';

import Component from './Component';
import {ElevatorProperties} from './elevator';


class ElevatorLevelView extends Component {
	constructor(props) {
		super(props);
	}

	componentWillMount() {
		const {elevator, level} = this.props;

		this.setState({
			hasDown: elevator.hasRequest(level, -1),
			hasUp  : elevator.hasRequest(level,  1),
			open   : level === elevator.level && ['opening', 'open'].indexOf(elevator.doorState) > -1,
		});

		this._bind(elevator, 'requests:add',    this._onRequest, true);
		this._bind(elevator, 'requests:remove', this._onRequest, false);
		this._bind(elevator, 'door:opening',    this._onDoor,    true);
		this._bind(elevator, 'door:shutting',   this._onDoor,    false);
	}

	render() {
		const elevator = this.props.elevator;
		const level = this.props.level;

		const className = classNames({
			'level': 1,
			'open' : this.state.open,
		});

		const classNameDown = classNames({
			'glyphicon'              : 1,
			'glyphicon-collapse-down': 1,
			'request-down'           : 1,
			'hidden'                 : level === elevator.minLevel,
			'active'                 : this.state.hasDown,
		});

		const classNameUp = classNames({
			'glyphicon'              : 1,
			'glyphicon-collapse-up'  : 1,
			'request-up'             : 1,
			'hidden'                 : level === elevator.maxLevel,
			'active'                 : this.state.hasUp,
		});

		const doorStyle = {
			transitionDuration: ElevatorProperties.doorOpenCloseTimeout + 'ms',
		};

		return (
			<div className={className}>
				<div className={classNameDown} onClick={this._request.bind(this, -1)}></div>
				<div className={classNameUp}   onClick={this._request.bind(this,  1)}></div>
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
			this.setState({
				['has' + (direction > 0 ? 'Up' : 'Down')]: add,
			});
		}
	}

	_onDoor(open) {
		if (this.props.elevator.level === this.props.level) {
			this.setState({
				open,
			});
		}
	}
}

ElevatorLevelView.propTypes = {
	elevator: React.PropTypes.object.isRequired,
	level: React.PropTypes.number.isRequired,
};


export default ElevatorLevelView;
