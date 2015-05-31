'use strict';

class AccessoryView extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			level: this.props.elevator.level,
			direction: 0,
		};

		this._levelCallback = null;
		this._moveCallback = null;
	}

	componentDidMount() {
		this._levelCallback = this.onElevatorLevel.bind(this);
		this._moveCallback = this.onElevatorMove.bind(this);

		this.props.elevator.on('level', this._levelCallback);
		this.props.elevator.on('move', this._moveCallback);
	}

	componentWillUnmount() {
		this.props.elevator.removeListener('level', this._levelCallback);
		this.props.elevator.removeListener('move', this._moveCallback);
		this._levelCallback = null;
		this._moveCallback = null;
	}

	render() {
		const digits = Math.floor(Math.log10(this.props.elevator.levelCount)) + 1;
		const levelString = String(this.state.level);
		const zeroFilledString = new Array(digits - levelString.length).fill('0').join('') + levelString;

		const glyphiconClassName = classNames({
			'glyphicon': 1,
			'glyphicon-triangle-top': this.state.direction > 0,
			'glyphicon-triangle-bottom': this.state.direction < 0,
		});

		return (
			<div id="accessory-view" className="panel panel-default">
				<div className="panel-heading">Level</div>
				<div className="panel-body"><span className={glyphiconClassName}></span>{zeroFilledString}</div>
			</div>
		);
	}

	onElevatorLevel(level) {
		this.setState({
			level: level,
		});
	}

	onElevatorMove(_, direction) {
		this.setState({
			direction: direction,
		});
	}
}

AccessoryView.propTypes = {
	elevator: React.PropTypes.object.isRequired,
};


export default AccessoryView;
