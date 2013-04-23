define("map", function(require) {
    "use strict";

    var Backbone = require("backbone"),
        L = require("leaflet"),
        _ = require("underscore");

    // This is intended to be a generic view for a leaflet map. This has no
    // associated model, and data should be supplied to it by an extended view.
    var MapView = Backbone.View.extend({
        osmUrl: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        osmAttr: "&copy;" + (new Date()).getFullYear() +
                 " OpenStreetMap Contributors",

        // settings that get overridden when we're in "static" mode
        staticOptions: {
            dragging: false,
            touchZoom: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            closePopupOnClick: false,
            keyboard: false,
            zoomControl: false
        },

        initialize: function(options) {
            options = _.defaults(options, {
                isStatic: false
            });
            this.osm = new L.TileLayer(this.osmUrl, {
                attribution: this.osmAttr,
                maxZoom: 17,
                minZoom: 8
            });
            this.leafletMap = new L.Map(this.el, _.extend({
                layers: [this.osm],
                zoom: 16,
                // hide zoom controls on multitouch devices
                zoomControl: !L.Browser.touch || L.Browser.android23,
                center: [51.505, -0.09]
            }, options.isStatic ? this.staticOptions : {}));
            // hide the "powered by Leaflet" text
            this.leafletMap.attributionControl.setPrefix(false);
            // Apply any css we might have for `.map`
            this.$el.addClass("map");

            // workaround for leaflet bug. We don't use an events hash, as it
            // might get overridden in extension.
            var fixMapEvents = {};
            _.each(
                ["show", "toggle", "toggleClass", "addClass", "removeClass"],
                function(e) {
                    fixMapEvents[e] = _.bind(this.fixMapDisplay, this);
                }, this
            );
            this.delegateEvents(fixMapEvents);
            this.fixMapDisplay();
        },

        // Due to a bug in leaflet: http://stackoverflow.com/q/10762984/130598
        fixMapDisplay: function() {
            this.leafletMap.invalidateSize(false);
        },

        close: function() {
            this.remove();
            this.unbind();
        }
    });

    return { MapView: MapView };
});
