'use strict';

const TooltipConstructor = $.fn.tooltip.Constructor;

function StaticPopover(element, options) {
	this.init('popover', element, options);
}

StaticPopover.DEFAULTS = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, {
	placement: 'bottom',
	trigger: '',
});

StaticPopover.prototype = $.extend({}, TooltipConstructor.prototype);
StaticPopover.prototype.constructor = StaticPopover;

StaticPopover.prototype.getDefaults = function () {
	return StaticPopover.DEFAULTS;
};

StaticPopover.prototype.setContent = function () {
		var $tip    = this.tip();

	$tip.removeClass('fade top bottom left right in');

	// IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
	// this manually by checking the contents.
	if (!$tip.find('.popover-title').html()) {
		$tip.find('.popover-title').hide();
	}
};

StaticPopover.prototype.hasContent = function () {
	return true;
};

StaticPopover.prototype.tip = function () {
	let $tip = this.$tip;

	if (!$tip) {
		$tip = this.$tip = $(this.options.tipNode);

		// prevent detach/attach/... modifications by Bootstrap Tooltip
		$tip.detach =
		$tip.appendTo =
		$tip.insertAfter =
			function () {
				return this;
			};
	}

	return $tip;
};

StaticPopover.prototype.arrow = function () {
	return (this.$arrow = this.$arrow || this.tip().find('.arrow'));
};

StaticPopover.prototype.getUID = function (prefix) {
	return this.tip().attr('id') || TooltipConstructor.prototype.getUID(prefix);
};

StaticPopover.prototype.hide = function (callback) {
	var that = this;
	var $tip = this.tip();
	var e    = $.Event('hide.bs.' + this.type);

	function complete() {
		$tip.hide();
		that.$element
			.removeAttr('aria-describedby')
			.trigger('hidden.bs.' + that.type);

		callback && callback();
	}

	this.$element.trigger(e);

	if (e.isDefaultPrevented()) {
		return;
	}

	$tip.removeClass('in');

	$.support.transition && $tip.hasClass('fade')
		? $tip
			.one('bsTransitionEnd', complete)
			.emulateTransitionEnd(TooltipConstructor.TRANSITION_DURATION)
		: complete();

	this.hoverState = null;

	return this;
};

function initStaticPopover($this, option) {
	$this = $($this);

	const options = typeof option == 'object' && option;
	let data = $this.data('bs.popover');

	if (!data && /destroy|hide/.test(option)){
		return;
	}

	if (!data) {
		data = new StaticPopover($this, options);
		$this.data('bs.popover', data);
	}

	if (typeof option == 'string') {
		data[option]();
	}

	return data;
}


export default initStaticPopover;
