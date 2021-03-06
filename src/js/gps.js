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
        url: "/route/",

        defaults: {
            waypoints: [],
            distance: undefined,
            time: 0,
            waypointsLengthOnLastUpdate: 1,
            efficiency: 100,
            watching: false, // GPS is on
            tracking: false, // We are actively logging GPS positions
            startTime: undefined,
            updatedTime: undefined,
            watchPositionId: undefined, // unique id given by watchPosition()
            position: undefined,
            lastError: undefined,
            startName: undefined,
            endName: undefined,
            disqualified: false,
            userId: 1, // hard-coded for now
            date: undefined,
            locationGuess: ""
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

        onTracking: function() {
            if(this.get("tracking")) {
                var startName = window.prompt("Where are you starting?",
                                              this.get("locationGuess"));
                startName = startName ? startName : "unspecified";
                this.set({
                    startTime: Date.now(),
                    distance: 0,
                    waypoints: [],
                    waypointsLengthOnLastUpdate: 1,
                    efficiency: 100,
                    time: 0,
                    startName: startName,
                    date: Date.now()
                });
            } else {
                if(this.get("waypoints").length > 1) {
                    var endName = window.prompt("Where are you ending?",
                                                this.get("locationGuess"));
                    endName = endName ? endName : "unspecified";
                    this.set({
                        time: this.get("updatedTime") - this.get("startTime"),
                        endName: endName
                    });
                    // Send to the server
                    this.save();
                }
            }
        },

        // Called via navigator.geolocation.watchPosition
        updatePosition: function(position) {
            // It looks like firefox pools the position object between updates
            // so the position never actually *changes*,
            position = _.clone(position);
            this.set({
                // We can't mutate waypoints. If we did, the `change` event
                // would never get triggered. Instead, we have to make a new
                // waypoints.
                waypoints: this.get("waypoints").concat([position.coords]),
                position: position,
                updatedTime: Date.now()
            });
            this.updateScore();
            // Update our location name guess
            var c = position.coords,
                url = "/waypoint/near/" + c.latitude + "," + c.longitude + "/";
            $.get(url, _.bind(function(name) {
                this.set({locationGuess: name});
            }, this));
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
            var lat1 = pos1.latitude,
                lat2 = pos2.latitude,
                lon1 = pos1.longitude,
                lon2 = pos2.longitude,
                R = 6371, // radius of earth in km
                dLat = (lat2 - lat1) * Math.PI / 180,
                dLon = (lon2 - lon1) * Math.PI / 180,
                lat1Deg = lat1 * Math.PI / 180,
                lat2Deg = lat2 * Math.PI / 180;

            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.sin(dLon / 2) * Math.sin(dLon / 2) *
                    Math.cos(lat1Deg) * Math.cos(lat2Deg),
                c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
                d = R * c;
            return d * 1000; // Distance in meters
        },

        updateScore: function() {
            var waypoints = this.get("waypoints"),
                newPosStart = this.get("waypointsLengthOnLastUpdate");
            if(waypoints.length <= 2) {
                // Calculation would work fine at length=2 but would be 100
                // anyway
                this.set("efficiency", 100);
                return;
            }
            var distance = this.get("distance");
            for(var i = newPosStart; i < waypoints.length; i++) {
                distance += this.calcDist(waypoints[i - 1], waypoints[i]);
            }
            this.set("waypointsLengthOnLastUpdate", waypoints.length);
            this.set("distance", distance);
            var straightDist = this.calcDist(waypoints[0],
                                             waypoints[waypoints.length-1]);
            this.set("efficiency", Math.ceil(100 * Math.pow(straightDist, 2) /
                                             Math.pow(distance, 2)));
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
                                             Date.now()),
                formattedDistance: this.model.get("distance") !== undefined ?
                    this.model.get("distance").toFixed(2) : undefined
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
                    // Draw a line showing our progress
                    this.line = new L.Polyline([], {clickable: false});
                    this.line.addTo(this.leafletMap);
                } else {
                    this.marker.setLatLng(leafletPosition);
                    this.circle.setLatLng(leafletPosition);
                    this.circle.setRadius(position.coords.accuracy);
                    this.line.setLatLngs(_.map(
                        this.model.get("waypoints"),
                        function(coords) {
                            return new L.LatLng(coords.latitude,
                                                coords.longitude);
                        }
                    ));
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
