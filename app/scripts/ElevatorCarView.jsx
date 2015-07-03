'use strict';

import Component from './Component';
import {ElevatorProperties} from './elevator';


class ElevatorCarView extends Component {
	constructor(props) {
		super(props);
	}

	componentWillMount() {
		const elevator = this.props.elevator;

		this._bind(elevator, 'move',           this._updateOffsetTop);
		this._bind(elevator, 'persons:add',    this._onPersons,  true);
		this._bind(elevator, 'persons:remove', this._onPersons,  false);
		this._bind(elevator, 'door:open',      this._onDoorOpen, true);
		this._bind(elevator, 'door:shutting',  this._onDoorOpen, false);

		this.setState({
			offsetTop         : 0,
			personCount       : 0,
			transitionDuration: 0,
		});
	}

	componentDidMount() {
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

	render() {
		const elevator = this.props.elevator;
		const style = {
			transitionDuration: this.state.transitionDuration,
			top               : this.state.offsetTop + 'px',
			zIndex            : +this.state.doorOpen,
		};

		return (
			<div id="elevator-car" style={style}>
				<div>{this.state.personCount} <span className="glyphicon glyphicon-user"></span></div>
				<div className="btn-group btn-group-sm">
					<button type="button" className="btn btn-default" onClick={elevator.removePerson.bind(elevator)}>
						<span className="glyphicon glyphicon-minus"></span>
					</button>
					<button type="button" className="btn btn-default" onClick={elevator.addPerson.bind(elevator)}>
						<span className="glyphicon glyphicon-plus"></span>
					</button>
				</div>
			</div>
		);
	}

	_updateOffsetTop(level, direction, cb) {
		const idx = this.props.elevator.maxLevel - level - direction + 2;
		const offsetTop = $('#elevator-view .level:nth-of-type(' + idx + ')')[0].offsetTop;

		this.setState({
			offsetTop,
		}, cb);
	}

	_onPersons(add) {
		this.setState({
			personCount: this.state.personCount + (2 * add - 1),
		});
	}

	_onDoorOpen(doorOpen) {
		this.setState({
			doorOpen,
		});
	}
}

ElevatorCarView.propTypes = {
	elevator: React.PropTypes.object.isRequired,
};


export default ElevatorCarView;
