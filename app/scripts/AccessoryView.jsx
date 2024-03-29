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

		this._bind(elevator, 'change:level',      this._onElevatorLevel);
		this._bind(elevator, 'change:overweight', this._onOverweightChange);

		this.setState({
			isOverweight: elevator.isOverweight,
			level       : elevator.level,
		});
	}

	render() {
		const isOverweight = this.state.isOverweight;

		const stateClassName = classNames({
			'btn'        : 1,
			'btn-danger' : isOverweight,
			'btn-success': !isOverweight,
		});

		return (
			<div id="accessory-view">
				<button type="button" className="btn btn-default" id="accessory-level" disabled="disabled">Etage <samp className="label label-primary">{pad(this.state.level, digits(this.props.elevator.levelCount))}</samp></button>
				<button type="button" className="btn btn-primary" id="accessory-panel-button" ref="panelElement" onMouseEnter={this.showPanel.bind(this)}>Innentableau</button>
				<AccessoryPanel elevator={this.props.elevator} ref="panel"/>
				<button type="button" className={stateClassName} id="accessory-state">{isOverweight ? 'Überlast' : 'Normalzustand'}</button>
			</div>
		);
	}

	showPanel(e) {
		this.refs.panel.show(this.refs.panelElement);
	}

	_onElevatorLevel(level) {
		this.setState({
			level,
		});
	}

	_onOverweightChange(isOverweight) {
		this.setState({
			isOverweight,
		});
	}
}

AccessoryView.propTypes = {
	elevator: React.PropTypes.object.isRequired,
};


export default AccessoryView;
