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
            this.waypoints.fetch();
        }
    });

    var RouteItemView = list.ListElementView.extend({
        initialize: function() {
            list.ListElementView.prototype.initialize.apply(
                this, _.toArray(arguments));
            this.map = new map.MapView({
                el: $("<div/>")
            });
        },

        drawPath: function() {
            // Add path to the leaflet map
            var points = [];
            _.each(this.model.waypoints.models, function(waypoint) {
                var w = waypoint.attributes;
                points.push([w.latitude, w.longitude]);
            });
            var polyline = L.polyline(points).addTo(this.map.leafletMap);
            // Zoom the map to the area containing the path
            this.map.leafletMap.fitBounds(polyline.getBounds());
        },

        render: function() {
            this.$el.html(this.shortTemplate(this.model.attributes));
            if(this.expanded) {
                this.$el.append(this.expandedTemplate(this.model.attributes));
                this.$el.append(this.map.el);
                this.drawPath();
            }
        }
    });

    return {
        Route: Route,
        RouteItemView: RouteItemView
    };
});
