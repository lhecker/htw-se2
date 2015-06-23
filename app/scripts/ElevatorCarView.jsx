'use strict';

import {ElevatorProperties} from './elevator';


class ElevatorCarView extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			offsetTop         : 0,
			personCount       : 0,
			transitionDuration: 0,
		};

		this._moveCallback = null;

		const elevator = this.props.elevator;
		elevator.on('persons:add',    this._onPersons.bind(this, true));
		elevator.on('persons:remove', this._onPersons.bind(this, false));
	}

	componentDidMount() {
		const elevator = this.props.elevator;

		this._moveCallback = this._updateOffsetTop.bind(this);
		this.props.elevator.on('move', this._moveCallback);

		/*
		 * The first render pass we will use the initial transitionDuration of 0 seconds
		 * and thus set the initial car position (seemingly) without an animation.
		 * After that we can set the transitionDuration of the node to the actual value.
		 */
		this._updateOffsetTop(elevator.level, elevator.direction, function () {
			// force a relayout before we set the transitionDuration
			React.findDOMNode(this).offsetTop;

			this.setState({
				transitionDuration: ElevatorProperties.timePerLevel + 'ms',
			});
		});
	}

	componentWillUnmount() {
		this.props.elevator.removeListener('move', this._moveCallback);
		this._moveCallback = null;
	}

	render() {
		const style = {
			transitionDuration: this.state.transitionDuration,
			top: this.state.offsetTop + 'px',
		};

		return (
			<div id="elevator-car" style={style}>{this.state.personCount} <span className="glyphicon glyphicon-user"></span></div>
		);
	}

	_updateOffsetTop(level, direction, cb) {
		const idx = this.props.elevator.maxLevel - level - direction + 2;
		const offsetTop = $('#elevator-view .level:nth-of-type(' + idx + ')')[0].offsetTop;

		this.setState({
			offsetTop: offsetTop,
		}, cb);
	}

	_onPersons(add) {
		this.setState({
			personCount: this.state.personCount + (2 * add - 1),
		});
	}
}

ElevatorCarView.propTypes = {
	elevator: React.PropTypes.object.isRequired,
};


export default ElevatorCarView;
