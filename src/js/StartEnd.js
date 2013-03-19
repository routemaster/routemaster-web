/*global window, Backbone, _, $, console, L*/
$(function() {
    "use strict";

    var GpsTracker = Backbone.Model.extend({
        defaults: {
            isTracking: false,
            startTime: undefined,
            updatedTime: undefined,
            watchPositionId: undefined, // unique id given by watchPosition()
            position: undefined,
            lastError: undefined,
            efficiency: undefined,
            distance: undefined,
            map: undefined
        },

        initialize: function() {
            if(this.get("isTracking")) {
                this.startTracking();
            }
        },

        startTracking: function() {
            var now = Date.now();
            if(this.get("isTracking")) { return; }
            var osmUrl = 'http://{s}.tile.openstreeetmap.org/{z}/{x}/{y}.png';
            var osmAttrib = 'Map data © OpenStreetMap contributors';
            var osm = L.TileLayer(osmUrl, {
                attribution: osmAttrib,
                maxZoom: 12,
                minZoom: 8
            });
            var map = L.Map('map', {
                layers: [osm],
                zoom: 12,
                center: [51.505, -0.09]
            });
            this.set({
                isTracking: true,
                startTime: now,
                updatedTime: now,
                lastError: undefined,
                watchPositionId: navigator.geolocation.watchPosition(
                    _.bind(this.updatePosition, this),
                    _.bind(this.updatePositionError, this),
                    {enableHighAccuracy: true}
                ),
                efficiency: 91,
                distance: 0.7,
                map: map
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
        template: _.template($("#status-tmpl").html()),
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
});
