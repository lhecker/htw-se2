'use strict';

import AccessoryPanel from './AccessoryPanel';
import Component from './Component';
import {pad, digits} from './utils';


class AccessoryView extends Component {
	constructor(props) {
		super(props);
	}

	componentWillMount() {
		const elevator = this.props.elevator;

		this._bind(elevator, 'move', this._onElevatorMove);
		this._bind(elevator, 'change:level', this._onElevatorLevel);

		this.setState({
			level: elevator.level,
			direction: elevator.direction,
		});
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

	_onElevatorMove(level, direction) {
		this.setState({
			level    : level,
			direction: direction,
		});
	}

	_onElevatorLevel(level) {
		this.setState({
			level: level,
		});
	}
}

AccessoryView.propTypes = {
	elevator: React.PropTypes.object.isRequired,
};


export default AccessoryView;
