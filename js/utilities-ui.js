var Dropdown = Class.extend({
	init: function(holder, id, options, onChange) {
		this.dropdown = $("<select/>", {
			id: id,
		}).appendTo(holder).change(function() {
			if (onChange)
				onChange($(this).val());
		});

		this.setOptions(options);


	},

	setOptions: function(options) {
		this.dropdown.html(options.map(s => "<option>" + s + "</option>"))
	}
});


var ValueView = Class.extend({
	init: function(holder, label, isInteger, isString) {

		this.isInteger = isInteger;
		this.holder = $("<div/>", {
			class: "valueview-holder"
		}).appendTo(holder);


		this.label = $("<div/>", {
			html: label + ": ",
			class: "valueview-label"
		}).appendTo(this.holder);

		this.value = $("<div/>", {
			class: "valueview-value"
		}).appendTo(this.holder);

		if (isString) {
			this.value.addClass("valueview-value-string");
		}
	},

	update: function(value) {

		if (this.isInteger)
			value = Math.floor(value);


		this.value.html(value);
		this.lastValue = value;
	}
});

var ProgressBar = Class.extend({
	init: function(holder, label, max, isInteger) {
		this.stats = {
			max: max,
			value: max / 2,
			pct: 0,
			rate: 0
		}
		this.isInteger = isInteger;
		this.holder = $("<div/>", {
			class: "progress-holder"
		}).appendTo(holder);

		this.header = $("<div/>", {
			class: "progress-header"
		}).appendTo(this.holder);


		this.label = $("<div/>", {
			html: label,
			class: "progress-label"
		}).appendTo(this.header);

		this.statHolder = $("<div/>", {
			class: "progress-stats"
		}).appendTo(this.header);

		this.value = $("<div/>", {
			class: "progress-value",
		}).appendTo(this.statHolder);

		this.rate = $("<div/>", {
			class: "progress-rate",
		}).appendTo(this.statHolder);


		this.bar = $("<div/>", {
			class: "progress-bar"
		}).appendTo(this.holder);
		this.barBG = $("<div/>", {
			class: "progress-bg"
		}).appendTo(this.bar);
		this.fill = $("<div/>", {
			class: "progress-fill"
		}).appendTo(this.bar);

		this.update(0, 0);

	},

	remove: function() {
		this.holder.remove();
	},

	update: function(value, rate) {
		this.stats.value = Math.min(value, this.stats.max);
		this.stats.rate = rate;
		this.stats.pct = this.stats.value / this.stats.max;
		this.fill.css({
			width: Math.min(100, Math.max(5, (this.stats.pct * 100))) + "%"
		});

		this.rate.html("(" + this.stats.rate.toFixed(2) + "/s)");
		this.value.html(Math.round(this.stats.value) + "/" + this.stats.max);

	},



});

var Section = Class.extend({
	init: function(holder, prefix, title) {
		this.holder = $("<div/>", {
			class: prefix + "-holder section-holder"
		}).appendTo(holder);

		this.header = $("<div/>", {
			class: prefix + "-header section-header"
		}).appendTo(this.holder);

		this.content = $("<div/>", {
			class: prefix + "-content section-content"
		}).appendTo(this.holder);

		this.title = $("<div/>", {
			class: prefix + "-title section-title",
			html: "title"
		}).appendTo(this.header);

		if (title)
			this.title.html(title);

		this.controls = $("<div/>", {
			class: prefix + "-controls section-controls",
			
		}).appendTo(this.header);
	}
})


function resetAllPanels() {
	for (var i = 0; i < allPanels.length; i++) {
		allPanels[i].setPosition(i * 120, i * 10);
	}
}


var allPanels = [];
var panelCount = 0;
var Panel = Class.extend({

	init: function(id, holder, settings) {
		var startPos;
		if (settings === undefined)
			settings = {};
		startPos = settings.startPos;
		var panel = this;
		this.idNumber = panelCount++;
		allPanels.push(this);
		this.order = allPanels.length - 1;

		this.id = "panel-" + id;

		this.div = $("<div/>", {
			class: "panel",
			id: this.id,
		}).appendTo(holder);
		this.div.css({
			position: "absolute"
		})

		this.header = $("<div/>", {
			class: "panel-header",
			html: id
		}).appendTo(this.div);


		if (settings.hasControlBar) {
			this.controlBar = $("<div/>", {
				class: "panel-controlBar",
			}).appendTo(this.div);
		}

		this.content = $("<div/>", {
			class: "panel-content",
		}).appendTo(this.div);

		if (!settings || !settings.disallowMovement) {
			this.div.draggable({
				handle: ".panel-header",
				start: function() {
					panel.bringToFront();
				},
				stop: function(ev, ui) {
					panel.x = ui.position.left;
					panel.y = ui.position.top;
					panel.savePosition();

				}
			}).click(function() {
				panel.bringToFront();
			});


			this.div.resizable({
				stop: function() {
					panel.w = panel.div.width();
					panel.h = panel.div.height();
					panel.savePosition();

				}
			});


			var savedPos = localStorage.getItem(this.id);
			if (savedPos)
				startPos = JSON.parse(savedPos);
		}
		if (startPos === undefined) {
			this.setPosition(this.idNumber * 120, this.idNumber * 20);
		} else {
			this.setPosition(startPos.x, startPos.y, startPos.w, startPos.h);
		}

	},

	bringToFront: function() {
		allPanels.forEach(panel => panel.order = Math.max(1, panel.order - 1));

		this.order = allPanels.length;
		allPanels.forEach(panel => panel.div.css("zIndex", panel.order));
	},

	setPosition: function(x, y, w, h) {
		this.div.css({
			left: x,
			top: y
		});

		this.x = x;
		this.y = y;

		if (w !== undefined) {
			this.div.css({
				width: w,
				height: h
			});
			this.w = w;
			this.h = h;
		}

		// Save pos

		this.savePosition();
	},

	savePosition: function() {
		localStorage.setItem(this.id, JSON.stringify({
			x: this.x,
			y: this.y,
			w: this.w,
			h: this.h
		}));
	}

});

function getRandom(arr) {
	return arr[Math.floor(arr.length * Math.random())];
}