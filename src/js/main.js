/*global window, console*/
define(function(require) {
    "use strict";

    var Backbone = require("backbone"),
        _ = require("underscore"),
        $ = require("jquery"),
        Mustache = require("mustache"),
        L = require("leaflet");

    L.Icon.Default.imagePath = "img/leaflet";

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
            lastError: undefined,
        },

        initialize: function() {
            if(this.get("isTracking")) {
                this.startTracking();
            }
        },

        startTracking: function() {
            if(this.get("isTracking")) { return; }
            var now = Date.now();
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
                totalDist: 0,
            });
        },

        stopTracking: function() {
            if(!this.get("isTracking")) { return; }
            navigator.geolocation.clearWatch(this.get("watchPosId"));
            this.set("isTracking", false);
        },

        updatePosition: function(position) {
            // called via navigator.geolocation.watchPosition
            this.get("posList").push(position);
            this.updateScore();
            this.set({
                position: position,
                updatedTime: Date.now()
            });
        },

        updatePositionError: function(error) {
            this.set("lastError", error);
            this.stopTracking();
        },

        // Note that for small distances, pythagorean estimate can suffice
        // This calculation works on a spherical assumption, see haversine
        // formula
        calcDist: function(pos1, pos2) {
            var lat1 = pos1.coords.latitude,
                lat2 = pos2.coords.latitude,
                lon1 = pos1.coords.longitude,
                lon2 = pos2.coords.longitude,

                R = 6371, // radius of earth in km
                dLat = (lat2 - lat1).toRad(),
                dLon = (lon2 - lon1).toRad();

            lat1 = lat1.toRad();
            lat2 = lat2.toRad();

            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) *
                    Math.cos(lat2),
                c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
                d = R * c;
            return d;
        },

        updateScore: function() {
            var posList = this.get("posList");
            if(posList.length <= 2) {
                // Calculation would work fine at length=2 but would be 100
                // anyway
                this.set("score", 100);
                return;
            }
            var totalDist = this.get("totalDist") + this.calcDist(
                    posList[posList.length - 1], posList[posList.length - 2]);
            this.set("totalDist", totalDist);
            var straightDist = this.calcDist(posList[0],
                                             posList[posList.length-1]);
            this.set("score", 100 * (straightDist / totalDist) *
                                    (straightDist / totalDist));
        }
    });

    var GpsView = Backbone.View.extend({
        el: $("#gps-status"),
        template: Mustache.compile($("#status-tmpl").html()),
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
                formattedTime:
                    this.formatTime(Date.now() - this.model.get("startTime"))
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

        defaultTimeTemplate: Mustache.compile("{{hrs}}:{{min}}:{{sec}}"),

        startTracking: function() {
            this.model.startTracking();
        },

        stopTracking: function() {
            this.model.stopTracking();
        }
    });

    // This is intended to be a generic view for a leaflet map. This has no
    // associated model, and data should be supplied to it by an extended view.
    var MapView = Backbone.View.extend({
        osmUrl: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        osmAttr: "&copy;" + (new Date()).getFullYear() +
                 " OpenStreetMap Contributors",

        initialize: function() {
            this.osm = new L.TileLayer(this.osmUrl, {
                attribution: this.osmAttrib,
                maxZoom: 17,
                minZoom: 8
            });
            this.map = new L.Map(this.el, {
                layers: [this.osm],
                zoom: 16,
                // hide zoom controls on multitouch devices
                zoomControl: !L.Browser.touch || L.Browser.android23,
                center: [51.505, -0.09]
            });
        },
    });

    var GpsMapView = MapView.extend({
        marker: undefined,

        initialize: function(options) {
            MapView.prototype.initialize.apply(this, _.toArray(arguments));
            this.model.on("change:position", _.bind(this.render, this));
            this.render();
        },

        render: function() {
            var position = this.model.get("position");
            if(position !== undefined) {
                var leafletPosition = new L.LatLng(
                    position.coords.latitude, position.coords.longitude
                );
                // Render the marker
                if(this.marker === undefined) {
                    this.marker = new L.Marker(leafletPosition,
                                               {clickable: false});
                    this.marker.addTo(this.map);
                    // Draw an accuracy circle around the marker
                    this.circle = new L.Circle(leafletPosition,
                                               position.coords.accuracy);
                    this.circle.addTo(this.map);
                } else {
                    this.marker.update(leafletPosition);
                    this.circle.setLatLng(leafletPosition);
                    this.circle.setRadius(position.coords.accuracy);
                }
                this.map.panTo(leafletPosition);
            }
        }
    });

    // kick things off
    // TODO: Use Backbone.Router for this
    var gpsTracker = new GpsTracker(),
        gpsView = new GpsView({model: gpsTracker}),
        mapView = new GpsMapView({el: $("#map"), model: gpsTracker});
});

// A magic little helper module that delays execution of our code until the DOM
// is ready
define("documentReady", function(require) {
    "use strict";
    require("jquery")(function() { require("main"); });
});

require(["documentReady"], function() {});
