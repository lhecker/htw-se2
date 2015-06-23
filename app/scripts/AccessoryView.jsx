'use strict';

import AccessoryPanel from './AccessoryPanel';
import {pad, digits, nextPropsOrStateDifferent} from './utils';


class AccessoryView extends React.Component {
	constructor(props) {
		super(props);

		const elevator = this.props.elevator;

		this.state = {
			level: elevator.level,
			direction: elevator.direction,
		};

		this._resetIVars();
	}

	componentDidMount() {
		this._levelCallback = this._onElevatorLevel.bind(this);
		this._moveCallback = this._onElevatorMove.bind(this);

		this.props.elevator.on('level', this._levelCallback);
		this.props.elevator.on('move', this._moveCallback);
	}

	componentWillUnmount() {
		this.props.elevator.removeListener('level', this._levelCallback);
		this.props.elevator.removeListener('move', this._moveCallback);

		const panel = this._panel;

		if (panel) {
			panel.destroy();
		}

		this._resetIVars();
	}

	shouldComponentUpdate(nextProps, nextState) {
		return nextPropsOrStateDifferent(this, nextProps, nextState);
	}

	render() {
		const glyphiconClassName = classNames({
			'glyphicon'                : 1,
			'glyphicon-triangle-top'   : this.state.direction > 0,
			'glyphicon-triangle-bottom': this.state.direction < 0,
		});

		return (
			<div id="accessory-view">
				<button type="button" className="btn btn-default" id="accessory-level" disabled="disabled">Current Level<samp className="label label-primary">{pad(this.state.level, digits(this.props.elevator.levelCount))}</samp></button>
				<button type="button" className="btn btn-primary" id="accessory-panel-button" ref="panelElement" onMouseEnter={this.showPanel.bind(this)}>Elevator Panel</button>
				<AccessoryPanel elevator={this.props.elevator} ref="panel"/>
			</div>
		);
	}

	showPanel(e) {
		this.refs.panel.show(this.refs.panelElement);
	}

	_onElevatorLevel(level) {
		this.setState({
			level: level,
		});
	}

	_onElevatorMove(_, direction) {
		this.setState({
			direction: direction,
		});
	}

	_resetIVars() {
		this._levelCallback = null;
		this._moveCallback = null;
		this._panel = null;
	}
}

AccessoryView.propTypes = {
	elevator: React.PropTypes.object.isRequired,
};


export default AccessoryView;
