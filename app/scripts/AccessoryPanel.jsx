'use strict';

import initStaticPopover from './StaticPopover';
import {pad, digits, nextPropsOrStateDifferent} from './utils';


class AccessoryPanel extends React.Component {
	constructor(props) {
		super(props);

		const elevator = this.props.elevator;
		const levelCount = elevator.levelCount;
		const minLevel = elevator.minLevel;
		const requests = new Array(levelCount);

		for (let i = 0; i < levelCount; i++) {
			requests[i] = elevator.hasRequestOnLevel(i + minLevel);
		}

		this.state = {
			requests: requests,
		};

		this._resetIVars();
	}

	componentDidMount() {
		const elevator = this.props.elevator;

		this._requestAddCallback    = this._onRequest.bind(this, true);
		this._requestRemoveCallback = this._onRequest.bind(this, false);

		elevator.on('requests:add', this._requestAddCallback);
		elevator.on('requests:remove', this._requestRemoveCallback);
	}

	componentWillUnmount() {
		const elevator = this.props.elevator;
		const panel = this._panel;

		elevator.removeListener('requests:add', this._requestAddCallback);
		elevator.removeListener('requests:remove', this._requestRemoveCallback);

		if (panel) {
			panel.destroy();
		}

		this._resetIVars();
	}

	shouldComponentUpdate(nextProps, nextState) {
		return nextPropsOrStateDifferent(this, nextProps, nextState) || this.state.requests.some((value, i) => value !== nextState[i]);
	}

	render() {
		const COLUMNS = 3;
		const elevator = this.props.elevator;
		const levelCount = elevator.levelCount;
		const minLevel = elevator.minLevel;
		const rows = new Array(Math.ceil(levelCount / COLUMNS));

		for (let i = 0; i < levelCount; i += COLUMNS) {
			const cols = new Array(COLUMNS);

			for (let j = 0, l = Math.min(levelCount - i, COLUMNS); j < l; j++) {
				const idx = i + j;
				const level = idx + minLevel;
				const className = classNames({
					'btn': 1,
					'btn-block': 1,
					'btn-lg': 1,
					'btn-default': 1,
					'active': this.state.requests[idx],
				});

				cols[j] = (
					<div className="col-xs-4" key={j}><button className={className} onClick={this._onButtonClick.bind(this, level)}>{pad(level, digits(levelCount))}</button></div>
				);
			}

			rows[i] = (
				<div className="row" key={i}>{cols}</div>
			);
		}

		return (
			<div id="accessory-panel" className="popover" ref="panel">
				<div className="arrow"></div>
				<h3 className="popover-title text-center">Elevator Control Panel</h3>
				<div className="popover-content container-fluid">{rows}</div>
			</div>
		);
	}

	show(panelElement) {
		let panel = this._panel;

		if (this._panelElement !== panelElement) {
			this._panelElement = panelElement;

			panel = this._panel = initStaticPopover(React.findDOMNode(panelElement), {
				tipNode: React.findDOMNode(this.refs.panel),
			});

			const $element = panel.$element;
			$element.on('show.bs.popover', function () {
				setTimeout(function () {
					const $viewport = panel.$viewport;
					const $tip = panel.$tip;

					const tipWidth = $tip.outerWidth();
					const tipHeight = $tip.outerHeight();

					/*
					 * We add/sub. the height of the $element (which is the button) since
					 * the tip is placed below the button and should be visible
					 * as long as the cursor is above the button.
					 */
					const delta = $element.outerHeight() + panel.$arrow.outerHeight();

					$viewport.on('mousemove', function (e) {
						const pageX = e.pageX;
						const pageY = e.pageY;

						const tipOffset = $tip.offset();
						const minX = tipOffset.left - delta;
						const maxX = tipWidth + minX + 2 * delta;
						const minY = tipOffset.top - delta;
						const maxY = tipHeight + minY + 2 * delta;

						if (pageX < minX || pageX > maxX || pageY < minY || pageY > maxY) {
							panel.hide();
							$viewport.off('mousemove');
						}
					});
				},  0);
			});
		}

		panel.show();
	}

	_onButtonClick(level, e) {
		this.props.elevator.request(level, 0);
		e.target.blur();
	}

	_onRequest(add, level, direction) {
		const elevator = this.props.elevator;
		const requests = Array.from(this.state.requests);

		requests[level - elevator.minLevel] = add;

		this.setState({
			requests: requests,
		});
	}

	_resetIVars() {
		this._requestAddCallback    = null;
		this._requestRemoveCallback = null;

		this._panel = null;
	}
}

AccessoryPanel.propTypes = {
	elevator: React.PropTypes.object.isRequired,
};


export default AccessoryPanel;

