'use strict';

import ElevatorProperties from './elevator/ElevatorProperties';


class ElevatorLevelView extends React.Component {
	constructor(props) {
		super(props);

		this._resetIVars();
	}

	componentDidMount() {
		const elevator = this.props.elevator;

		this._requestAddCallback    = this._onRequest.bind(this, true);
		this._requestRemoveCallback = this._onRequest.bind(this, false);

		this._doorOpeningCallback   = this._onDoor.bind(this, true);
		this._doorShuttingCallback  = this._onDoor.bind(this, false);

		elevator.on('requests:add', this._requestAddCallback);
		elevator.on('requests:remove', this._requestRemoveCallback);

		elevator.on('door:opening', this._doorOpeningCallback);
		elevator.on('door:shutting', this._doorShuttingCallback);
	}

	componentWillUnmount() {
		const elevator = this.props.elevator;

		elevator.removeListener('requests:add', this._requestAddCallback);
		elevator.removeListener('requests:remove', this._requestRemoveCallback);

		elevator.removeListener('door:opening', this._doorOpeningCallback);
		elevator.removeListener('door:shutting', this._doorShuttingCallback);

		this._resetIVars();
	}

	render() {
		const doorStyle = {
			transitionDuration: ElevatorProperties.doorOpenCloseTimeout + 'ms',
		};

		return (
			<div className="level">
				<div className="door-left" style={doorStyle}><span className="label">{this.props.level}</span></div>
				<div className="door-right" style={doorStyle}></div>
				<div className="request down" onClick={this._request.bind(this, -1)}><span className="glyphicon glyphicon-triangle-bottom"></span></div>
				<div className="request up" onClick={this._request.bind(this, 1)}><span className="glyphicon glyphicon-triangle-top"></span></div>
			</div>
		);
	}

	_resetIVars() {
		this._requestAddCallback    = null;
		this._requestRemoveCallback = null;

		this._doorOpeningCallback   = null;
		this._doorShuttingCallback  = null;
	}

	_request(direction) {
		this.props.elevator.request(this.props.level, direction);
	}

	_onRequest(add, level, direction) {
		if (direction && level === this.props.level) {
			const node = React.findDOMNode(this);
			node.children[2 + (direction > 0)].classList.toggle('active', add);
		}
	}

	_onDoor(open, level) {
		if (level === this.props.level) {
			const node = React.findDOMNode(this);
			node.classList.toggle('open', open);
		}
	}
}

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
			const node = React.findDOMNode(this);
			node.offsetTop; // force a relayout before we set the transitionDuration

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
		const node = React.findDOMNode(this);
		const idx = this.props.elevator.maxLevel - level - direction + 1;
		const offsetTop = node.parentNode.children[idx].offsetTop;

		this.setState({
			offsetTop: offsetTop,
		}, cb);
	}
}

ElevatorCarView.propTypes = {
	elevator: React.PropTypes.object.isRequired,
};


class ElevatorView extends React.Component {
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
