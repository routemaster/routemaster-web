define("gps", function(require) {
    "use strict";

    var Backbone = require("backbone"),
        _ = require("underscore"),
        $ = require("jquery"),
        Mustache = require("mustache"),
        L = require("leaflet"),
        map = require("map"),
        time = require("time");

    var Tracker = Backbone.Model.extend({
        defaults: {
            posList: [],
            totalDist: undefined,
            score: undefined,
            watching: false, // GPS is on
            tracking: false, // We are actively logging GPS positions
            startTime: undefined,
            updatedTime: undefined,
            watchPositionId: undefined, // unique id given by watchPosition()
            position: undefined,
            lastError: undefined
        },

        initialize: function() {
            this.on("change:watching", this.onWatching, this);
            this.on("change:tracking", this.onTracking, this);
            this.onWatching();
            this.onTracking();
        },

        // Starts watching the GPS position, but doesn't start recording
        // anything. This gives the GPS time to "warm up" before the user
        // needs it
        onWatching: function() {
            if(this.get("watching")) {
                this.set("watchPositionId",
                    navigator.geolocation.watchPosition(
                        _.bind(this.updatePosition, this),
                        _.bind(this.updatePositionError, this),
                        {enableHighAccuracy: true, maximumAge: 0}
                    )
                );
            } else {
                var watchPositionId = this.get("watchPositionId");
                if(watchPositionId !== undefined) {
                    navigator.geolocation.clearWatch(watchPositionId);
                }
                this.set({tracking: false, watchPositionId: undefined});
            }
        },

        // Actively update the posList
        onTracking: function() {
            if(this.get("tracking")) {
                this.set({
                    startTime: Date.now(),
                    totalDist: 0,
                    posList: []
                });
            } else {
                // Nothing
            }
        },

        // Called via navigator.geolocation.watchPosition
        updatePosition: function(position) {
            this.set({
                // We can't mutate posList. If we did, the `change` event would
                // never get triggered. Instead, we have to make a new posList.
                posList: this.get("posList").concat([position]),
                position: position,
                updatedTime: Date.now()
            });
            this.updateScore();
        },

        updatePositionError: function(error) {
            this.set({
                lastError: error,
                watching: false
            });
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
        },

        close: function() {
            console.error("Tracker.close not yet implemented");
        }
    });

    var HudView = Backbone.View.extend({
        template: Mustache.compile($("#status-tmpl").html()),
        events: {
            "click #start-button": "startTracking",
            "click #stop-button": "stopTracking"
        },

        initialize: function() {
            this.model.on(
                "change:tracking change:lastError change:position",
                this.render, this
            );
            this.render();
        },

        render: function() {
            var state = _.extend(_.clone(this.model.attributes), {
                formattedTime: time.relative(this.model.get("startTime"),
                                             Date.now())
            });
            this.$el.html(this.template(state));
            if(this.model.get("tracking")) {
                // Update the time
                _.delay(_.bind(this.render, this), 1000);
            }
        },

        startTracking: function() {
            this.model.set("tracking", true);
        },

        stopTracking: function() {
            this.model.set("tracking", false);
        },

        close: function() {
            this.remove();
            this.unbind();
            this.model.off(
                "change:tracking change:lastError change:position",
                this.render, this
            );
        }
    });

    var MapView = map.MapView.extend({
        marker: undefined,

        initialize: function() {
            map.MapView.prototype.initialize.apply(this, _.toArray(arguments));
            this.model.on("change:position", this.render, this);
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
                    this.marker.addTo(this.leafletMap);
                    // Draw an accuracy circle around the marker
                    this.circle = new L.Circle(leafletPosition,
                                               position.coords.accuracy);
                    this.circle.addTo(this.leafletMap);
                } else {
                    this.marker.update(leafletPosition);
                    this.circle.setLatLng(leafletPosition);
                    this.circle.setRadius(position.coords.accuracy);
                }
                this.leafletMap.panTo(leafletPosition);
            }
        },

        close: function() {
            map.MapView.prototype.close.call(this);
            this.model.off("change:position", this.render, this);
        }
    });

    // Combine the MapView and HudView into one
    var TrackView = Backbone.View.extend({
        initialize: function() {
            this.map = new MapView({
                model: this.model,
                el: $("<div/>").appendTo(this.$el)
            });
            this.hud = new HudView({
                model: this.model,
                el: $("<div/>").appendTo(this.$el)
            });
            this.$el.attr("id", "track");
        },

        close: function() {
            this.remove();
            this.unbind();
            this.map.close();
            this.hud.close();
        }
    });

    return {
        Tracker: Tracker,
        HudView: HudView,
        MapView: MapView,
        TrackView: TrackView
    };
});
