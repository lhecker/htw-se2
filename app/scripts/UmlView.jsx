'use strict';

import Component from './Component';
import ElevatorCarView from './ElevatorCarView';
import ElevatorLevelView from './ElevatorLevelView';

/*
uml-door-open
uml-door-opening
uml-door-shut
uml-door-shutting
uml-initial
uml-move-down
uml-move-up
uml-moved-down
uml-moved-up
uml-overload
uml-standby
uml-subautomata
uml-subautomata-final
uml-subautomata-initial
*/
/*

*/

class UmlView extends Component {
	constructor(props) {
		super(props);
	}

	componentDidMount() {
		const self = this;
		const elevator = this.props.elevator;

		function setActive(id) {
			const nodes = React.findDOMNode(self).querySelectorAll('.active');

			for (let node of nodes) {
				node.classList.remove('transition-zero', 'active');
			}

			const node = document.getElementById(id);
			const classList = document.getElementById(id).classList;
			classList.add('transition', 'transition-zero', 'active');
		}

		function createCb(id) {
			return setActive.bind(self, id);
		}


		const assoc = {
			'door:open'        : 'uml-door-open',
			'door:opening'     : 'uml-door-opening',
			'door:shut'        : 'uml-door-shut',
			'door:shutting'    : 'uml-door-shutting',
			'idle'             : 'uml-idle',
			'change:overweight': 'uml-overweight',
		};

		for (let eventName in assoc) {
			self._on(elevator, eventName, createCb(assoc[eventName]));
		}


		self._on(elevator, 'level', () => {
			setActive('uml-moved-' + (elevator.direction > 0 ? 'up' : 'down'));
		});

		self._on(elevator, 'move', (level, direction) => {
			setActive('uml-move-' + (direction > 0 ? 'up' : 'down'));
		});

		self._on(elevator, 'stop', () => {
		});


		$(React.findDOMNode(this)).load('../images/uml.svg', () => {
			setActive('uml-initial');
		});
	}

	render() {
		return (
			<div id="uml-container"></div>
		);
	}
}

UmlView.propTypes = {
	elevator: React.PropTypes.object.isRequired,
};


export default UmlView;
