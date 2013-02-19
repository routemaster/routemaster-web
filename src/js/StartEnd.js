/*global window, Backbone, _, $, console*/
$(function() {
    "use strict";

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
            this.renderStatus().renderPosition();
            this.$("#start-button")
                .prop("disabled", this.model.get("isTracking"));
            this.$("#stop-button")
                .prop("disabled", !this.model.get("isTracking"));
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

        renderStatus: function() {
            var elStatus = this.$("#status"),
                dt;
            if(this.model.get("isTracking")) {
                dt = Date.now() - this.model.get("startTime");
                elStatus.html(this.formatTime(dt));
                _.delay(_.bind(this.renderStatus, this), 1000);
            } else {
                elStatus.html("Press \"Start\" to Begin");
            }
            return this;
        },

        renderPosition: function() {
            var elPosition = this.$("#position"),
                modelPostion = this.model.get("position");
            this.$("#position").css("display",
                this.model.get("isTracking") ? "" : "none"
            );
            if(this.model.get("isTracking")) {
                if(modelPostion === undefined) {
                    elPosition.html("Waiting for Location");
                } else {
                    elPosition.html(
                        "Latitude: " + modelPostion.coords.latitude +
                        ", Longitude: " + modelPostion.coords.longitude
                    );
                }
            }
            return this;
        },

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
