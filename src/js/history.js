define("history", function(require) {
    "use strict";

    var Backbone = require("backbone"),
        _ = require("underscore"),
        $ = require("jquery"),
        Mustache = require("mustache"),
        list = require("list"),
        L = require("leaflet"),
        map = require("map");

    var Route = Backbone.Model.extend({
        defaults: {
            startName: undefined,
            endName: undefined,
            date: undefined,
            distance: undefined,
            efficiency: undefined,
            waypoints: undefined
        },

        url: '/route/',

        initialize: function() {
            // Fetch the waypoints from the server
            var Waypoints = Backbone.Collection.extend({
                url: "/route/" + this.id + "/waypoints/"
            });
            this.waypoints = new Waypoints();
            this.waypoints.fetch({
                success: _.bind(function(collection, response, options) {
                    this.drawPath();
                }, this),
                error: function() {
                    console.log(arguments);
                }
            });
        }
    });

    var RouteItemView = list.ListElementView.extend({
        initialize: function() {
            list.ListElementView.prototype.initialize.apply(this, _.toArray(arguments));
            this.map = new map.MapView({
                el: $("<div/>").appendTo(this.$el)
            });
        },

        render: function() {
            // Add path to the leaflet map
            var points = [];
            _.each(this.model.waypoints, function(waypoint) {
                points.push([waypoint.latitude, waypoint.longitude]);
            });
            var polyline = L.polyline(points).addTo(this.map.leafletMap);
            // Zoom the map to the area containing the path
            this.map.leafletMap.fitBounds(polyline.getBounds());
        }
    });

    return {
        Route: Route,
        RouteItemView: RouteItemView
    };
});
