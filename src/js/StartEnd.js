/*global window, Backbone, _, $, console*/
$(function() {
    "use strict";

    var GpsTracker = Backbone.Model.extend({
        defaults: {
		    posList: [],
		    totalDist: undefined,
		    score: undefined,
            isTracking: false,
            startTime: undefined,
            updatedTime: undefined,
            watchPositionId: undefined, // unique id given by watchPosition()
            position: undefined,
            lastError: undefined
        },

        initialize: function() {
            if(this.get("isTracking")) {
                this.startTracking();
            }
        },

        startTracking: function() {
            var now = Date.now();
            if(this.get("isTracking")) { return; }
            this.set({
                isTracking: true,
                startTime: now,
                updatedTime: now,
                lastError: undefined,
                watchPositionId: navigator.geolocation.watchPosition(
                    _.bind(this.updatePosition, this),
                    _.bind(this.updatePositionError, this),
                    {enableHighAccuracy: true}
                )
            });
        },

        stopTracking: function() {
            if(!this.get("isTracking")) { return; }
            navigator.geolocation.clearWatch(this.get("watchPosId"));
            this.set("isTracking", false);
        },

        updatePosition: function(position) {
            // called via navigator.geolocation.watchPosition
		    posList.push(position);
		    this.updateScore();
            this.set({
                position: position,
                updatedTime: Date.now()
            });
        },

        updatePositionError: function(error) {
            this.set("lastError", error);
            this.stopTracking();
        }
    }),

        GpsView = Backbone.View.extend({

        el: $("#gps-status"),
        template: _.template($("#gps-status-tmpl").html()),
        model: new GpsTracker(),
        events: {
            "click #start-button": "startTracking",
            "click #stop-button": "stopTracking"
        },

        initialize: function() {
            this.model.on(
                "change:isTracking change:lastError change:position",
                _.bind(this.render, this)
            );
            this.render();
        },
		
		
		//note that for small distances, pythagorean estimate can suffice
		//this calculation works on a spherical assumption, see haversine formula
		calcDist: function(pos1,pos2) {
		    var lat1 = pos1.coords.latitude;
		    var lat2 = pos2.coords.latitude;
		    var lon1 = pos1.coords.longitude;
		    var lon2 = pos2.coords.longitude;
			
		    var R = 6371; // radius of earth in km
		    var dLat = (lat2-lat1).toRad();
		    var dLon = (lon2-lon1).toRad();
		    var lat1 = lat1.toRad();
		    var lat2 = lat2.toRad();

		    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
		        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
		    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
		    var d = R * c;
		    return d;
		},
		
		updateScore: function(){
		    if (posList.length<=2){score=100; return}//calculation would work fine at length=2 but would be 100 anyway
		    totalDist = totalDist + calcDist(posList[posList.length-1],posList[posList.length-2]);
		    var straightDist = calcDist(posList[0],posList[posList.length-1]);
		    score: 100 * (straightDist/totalDist) * (straightDist/totalDist);
		},
			
			
		
        render: function() {
            var state = _.extend(_.clone(this.model.attributes), {
                formatTime: _.bind(this.formatTime, this)
            });
            this.$el.html(this.template(state));
            if(this.model.get("isTracking")) {
                // Update the time
                _.delay(_.bind(this.render, this), 1000);
            }
        },

        // Takes a time delta (in milliseconds) and templates it
        formatTime: function(ms, template) {
            var f = Math.floor;
            template = template || this.defaultTimeTemplate;
            template = _.isFunction(template) ? template : _.template(template);
            return template({
                hrs: f(ms / 60 / 60 / 1000),
                min: f(ms      / 60 / 1000 % 60),
                sec: f(ms           / 1000 % 60)
            });
        },
        
        defaultTimeTemplate: _.template("<%= hrs %>:<%= min %>:<%= sec %>"),

        startTracking: function() {
            this.model.startTracking();
        },

        stopTracking: function() {
            this.model.stopTracking();
        }
    });

    (function() {
        // kick things off
        var gpsView = new GpsView();
    }());
});
