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
        },

        drawPath: function() {
            // Add path to the leaflet map
            var points = [];
            _.each(this.model.waypoints.models, function(waypoint) {
                var w = waypoint.attributes;
                points.push([w.latitude, w.longitude]);
            });
            this.polyline = L.polyline(points).addTo(this.map.leafletMap);
        },

        zoomPath: function() {
            // Zoom the map to the area containing the path
            this.map.leafletMap.fitBounds(this.polyline.getBounds());
        },

        render: function() {
            this.$el.html(this.shortTemplate(this.model.attributes));
            if(this.expanded) {
                if(this.map === undefined) {
                    this.map = new map.MapView({
                        el: $("<div/>"),
                        isStatic: true
                    });
                    this.drawPath();
                }
                var expandedElement =
                    $(this.expandedTemplate(this.model.attributes));
                this.$el.append(expandedElement);
                expandedElement.append(this.map.$el);
                // zooming must happen after map is drawn (so that leaflet can
                // figure out the size of the map it's working with)
                this.map.render();
                this.zoomPath();
            } else {
                this.map = undefined;
            }
        }
    });

    return {
        Route: Route,
        RouteItemView: RouteItemView
    };
});
