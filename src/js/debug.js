/*global require, _, Backbone*/
require([], function() {
    "use strict";
    $(function() {

    var GpsTracker = Backbone.Model.extend({
        defaults: {
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
});});
