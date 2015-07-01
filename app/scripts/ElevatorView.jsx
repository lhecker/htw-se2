'use strict';

import Component from './Component';
import ElevatorCarView from './ElevatorCarView';
import ElevatorLevelView from './ElevatorLevelView';


class ElevatorView extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		const elevator = this.props.elevator;
		const minLevel = elevator.minLevel;
		const children = new Array(1 + elevator.levelCount);

		children[0] = <ElevatorCarView elevator={elevator} key="car"/>;

		for (let i = 1, l = elevator.maxLevel; i < children.length; i++, l--) {
			children[i] = <ElevatorLevelView elevator={elevator} level={l} key={l}/>;
		}

		return (
			<div id="elevator-view" className="panel panel-default">
				<div className="panel-body">{children}</div>
			</div>
		);
	}
}

ElevatorView.propTypes = {
	elevator: React.PropTypes.object.isRequired,
};


export default ElevatorView;
