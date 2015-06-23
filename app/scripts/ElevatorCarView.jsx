'use strict';

import {ElevatorProperties} from './elevator';


class ElevatorCarView extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			transitionDuration: 0,
			offsetTop: 0,
		};

		this._moveCallback = null;
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
			<div id="elevator-car" style={style}></div>
		);
	}

	_updateOffsetTop(level, direction, cb) {
		const idx = this.props.elevator.maxLevel - level - direction + 2;
		const offsetTop = $('#elevator-view .level:nth-of-type(' + idx + ')')[0].offsetTop;

		this.setState({
			offsetTop: offsetTop,
		}, cb);
	}
}

ElevatorCarView.propTypes = {
	elevator: React.PropTypes.object.isRequired,
};


export default ElevatorCarView;
