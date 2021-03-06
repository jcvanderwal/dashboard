(function( $, undefined ) {

$.widget( "ui.dashboardStatusTableMaster", {

	options: {
		projects: {},
		projectKeys: [],
		maxProjects: 5,
		dataUrl: "",
		secondsBetweenScroll: 15,
		secondsBetweenRotate: 5
	},

	_create: function() {
		this.element.addClass( "ui-dashboard-status-table ui-widget" );
		this.element.parent().addClass("alert-enabled");

		this._initDraw();
		this._initHeartBeat();
	},

	destroy: function() {
		this.element.removeClass( "ui-dashboard-status-table ui-widget" );
		this.element.parent().removeClass("alert-enabled");

		$.Widget.prototype.destroy.apply( this, arguments );
	},

	_setOption: function( key, value ) {
		if ( key === "projects" ) {
			this.options.projects = value;
		}
		else if ( key === "dataUrl" ) {
			this.options.dataUrl = value;
		}
		else if ( key === "secondsBetweenScroll" ) {
			this.options.secondsBetweenScroll = value;
		}
		else if ( key === "secondsBetweenRotate" ) {
			this.options.secondsBetweenRotate = value;
		}

		$.Widget.prototype._setOption.apply( this, arguments );
	},

	_initDraw: function() {
		var self = this;
		this.element.hover(function() {
			self.hover = true;
		}, function() {
			self.hover = false;
		});
		this.element.empty();
		$("<h3/>").append("&nbsp;").appendTo(this.element);
		var data = $("<div class='data' />").appendTo(this.element);
		data.append("<div class='prev button row'><div class='inner-row'>&#9650;</div></div>");
		data.append("<div class='next button row'><div class='inner-row'>&#9660;</div></div>");
		data.find(".prev.button").click(function() {
			if (!$("body").hasClass("project-transition"))
				return self._scrollUp.apply( self, [true] );
		});
		data.find(".next.button").click(function() {
			if (!$("body").hasClass("project-transition"))
				return self._scrollDown.apply( self, [true] );
		});
		var startProjects = new Array();
		this.options.projectKeys = new Array();
		var index = 0;
		$.each(this.options.projects, function(key, value) {
			self.options.projectKeys[index] = key;
			if (index < self.options.maxProjects) {
				var row = $("<div class='row'><div class='inner-row'>"+value+"</div></div>");
				row.addClass(key);
				data.append(row);
				startProjects[index] = key;
			}
			index++;
		});
		$(document).data("dashboard-table-projects", startProjects);
	},

	_initHeartBeat: function() {
		var self = this;
		var response = function() {
			return self._updateData.apply( self, arguments );
		};
		$.getJSON(this.options.dataUrl, response);
		
		var scrollDown = function() {
			return self._scrollDown.apply( self, [false] );
		};
		$(document)
			.data("dashboard-table-project-index", this.options.projectKeys.length-1)
			.bind("dashboard-heartbeat",
					function(event, count) {
						if (self.hover)
							return;
						if (count % self.options.secondsBetweenRotate == 0) {
							$(document).triggerHandler("dashboard-table-rotate");
							$.getJSON(self.options.dataUrl, response);
							// resync alert blinking
							$(document).oneTime("900ms", function() {
								self.element.parent().removeClass("alert-enabled");
								self.element.parent().find(".alert-yellow").removeClass("alert-yellow");
								self.element.parent().find(".alert-red").removeClass("alert-red");
							});
							$(document).oneTime("1000ms", function() {
								self.element.parent().addClass("alert-enabled");
								$.each(self.options.projects, function(key, value) {
									var color = self.projectAlerts[key];
									if (color != undefined) {
										self.element.parent().find("."+key).addClass("alert-"+color.toLowerCase());
									}
								});								
							});
						}
						if (count % self.options.secondsBetweenScroll == 2 && count > 2) {
							scrollDown();
						}
					});
	},
	
	_updateData: function(data) {
		this.projectAlerts = data;
	},
	
	_scrollUp: function(fast) {
		var newProjectIndex = $(document).data("dashboard-table-project-index");
		var newProjects = $(document).data("dashboard-table-projects");
		for (var count=0; count<this.options.maxProjects-1; count++) {
			newProjects[count] = newProjects[count+1];
		}	
		newProjectIndex++;
		newProjectIndex = newProjectIndex % this.options.projectKeys.length;
		newProjects[this.options.maxProjects-1] =
			this.options.projectKeys[ (newProjectIndex+this.options.maxProjects) % this.options.projectKeys.length];
		var projectKey = newProjects[this.options.maxProjects-1];
		$(document).data("dashboard-table-projects", newProjects);
		$(document).data("dashboard-table-project-index", newProjectIndex);
		$(document).triggerHandler("dashboard-table-insert-project", [projectKey, false]);

		$("body").addClass("project-transition animate");
		if (fast)
			$("body").addClass("fast");
		var dataDiv = this.element.find(".data");
		dataDiv.find(".button").appendTo(dataDiv);
		var row = $("<div class='row'><div class='inner-row'>"+
				this.options.projects[projectKey]+"</div></div>");
		row.addClass(projectKey);
		dataDiv.append(row);
		var color = this.projectAlerts[projectKey];
		if (color != undefined) {
			this.element.parent().find("."+projectKey).addClass("alert-"+color.toLowerCase());
		}
		// a small delay is need, because elements need to be rendered before
		// animations can start
		$(document).oneTime("10ms", function() {
			$("body").removeClass("animate");
		});
		$(document).oneTime(fast ? "550ms" : "1100ms", function() {
			$("body").removeClass("project-transition fast");
			$(".ui-dashboard-status-table .data .row:first-child").remove();
		});
	},

	_scrollDown: function(fast) {
		var newProjectIndex = $(document).data("dashboard-table-project-index");
		var newProjects = $(document).data("dashboard-table-projects");
		for (var count=this.options.maxProjects-1; count>0; count--) {
			newProjects[count] = newProjects[count-1];
		}
		newProjects[0] = this.options.projectKeys[newProjectIndex];
		newProjectIndex--;
		if (newProjectIndex < 0)
			newProjectIndex = this.options.projectKeys.length-1;	
		var projectKey = newProjects[0];
		$(document).data("dashboard-table-projects", newProjects);
		$(document).data("dashboard-table-project-index", newProjectIndex);
		$(document).triggerHandler("dashboard-table-insert-project", [projectKey, true]);
 
		$("body").addClass("project-transition");
		if (fast)
			$("body").addClass("fast");
		var dataDiv = this.element.find(".data");
		dataDiv.find(".button").prependTo(dataDiv);
		var row = $("<div class='row'><div class='inner-row'>"+
				this.options.projects[projectKey]+"</div></div>");
		row.addClass(projectKey);
		dataDiv.prepend(row);
		var color = this.projectAlerts[projectKey];
		if (color != undefined) {
			this.element.parent().find("."+projectKey).addClass("alert-"+color.toLowerCase());
		}
		// a small delay is need, because elements need to be rendered before
		// animations can start
		$(document).oneTime("10ms", function() {
			$("body").addClass("animate");
		});
		$(document).oneTime(fast ? "550ms" : "1100ms", function() {
			$("body").removeClass("project-transition animate fast");
			$(".ui-dashboard-status-table .data .row:last-child").remove();
		});
	}
});

$.extend( $.ui.dashboardmaster, {
	version: "1.8.4"
});

})( jQuery );
