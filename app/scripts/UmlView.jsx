'use strict';

import Component from './Component';
import url from 'url';
import {ElevatorProperties} from './elevator';

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
const transitionTimerKey = Symbol('transition');


const activeNodes = [];
const activeNodesMax = 3;
let popActiveTimer = null;

function removeActiveClasses(node) {
	node.className.baseVal = node.className.baseVal.replace(/(?:^|\s)active-\S+(?:$|\s)/g, '');
}

function pushActive(id) {
	if (id) {
		const node = document.getElementById(id);
		const existingIdx = activeNodes.indexOf(node);

		/*
		 * If we currently have [a,b,c,d,e,f] and unshift() b again,
		 * we would get an array containing [b,a,b,c,d,...].
		 *
		 * This would result in:
		 *   #b.active-0.active-2
		 *   #a.active-1
		 *
		 * Correct would be
		 *   #b.active-0
		 *   #a.active-1
		 *   #c.active-2
		 * instead.
		 *
		 * => splice() it out and unshift it again.
		 */
		if (existingIdx > -1 && existingIdx < (activeNodesMax - 1)) {
			activeNodes.splice(existingIdx, 1)
		}

		activeNodes.unshift(node);
	} else if (activeNodes.length > 1) {
		removeActiveClasses(activeNodes.pop());
	}

	// iterates through the last ${activeNodesMax} nodes in activeNodes
	const activeBeginIdx = Math.max(0, activeNodes.length - activeNodesMax);

	for (let i = activeBeginIdx; i < activeNodes.length; i++) {
		const node = activeNodes[i];
		const activePos = i - activeBeginIdx;

		removeActiveClasses(node);
		node.classList.add('active-' + activePos);
	}

	if (activeNodes.length <= 1) {
		clearInterval(popActiveTimer);
		popActiveTimer = null;
	} else if (!popActiveTimer) {
		popActiveTimer = setInterval(pushActive, ElevatorProperties.shortestTimeout *  2/3);
	}
}


class UmlView extends Component {
	constructor(props) {
		super(props);
	}

	componentDidMount() {
		const thisNode = React.findDOMNode(this);
		const mountNode = document.getElementById('uml-view-mount');
		const svgUrl = url.resolve(document.location.href, mountNode.dataset.umlUrl);

		jQuery.ajax({
			type: 'GET',
			url: svgUrl,
			dataType: "html",
		}).done((responseText) => {
			thisNode.innerHTML = responseText;

			function createCb(id) {
				return pushActive.bind(null, id);
			}

			const elevator = this.props.elevator;
			const assoc = {
				'change:overweight': 'uml-overweight',
				'door:open'        : 'uml-door-open',
				'door:opening'     : 'uml-door-opening',
				'door:shut'        : 'uml-door-shut',
				'door:shutting'    : 'uml-door-shutting',
				'idle'             : 'uml-idle',
			};

			for (let eventName in assoc) {
				this._on(elevator, eventName, createCb(assoc[eventName]));
			}

			this._on(elevator, 'change:level', () => {
				pushActive('uml-moved-' + (elevator.direction > 0 ? 'up' : 'down'));
			});

			this._on(elevator, 'move', (level, direction) => {
				pushActive('uml-move-' + (direction > 0 ? 'up' : 'down'));
			});

			this._on(elevator, 'stop', () => {
				pushActive('uml-subautomata');
				pushActive('uml-subautomata-initial');
			});

			this._on(elevator, 'door:shut', () => {
				pushActive('uml-subautomata-final');
			});

			pushActive('uml-initial');
			pushActive('uml-idle');
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
