/*! Generic leaflet tools */
/*! Define the `map` module */
define("map", function(require) {
    "use strict";

    var Backbone = require("backbone"),
        L = require("leaflet");

    /*!
    This is intended to be a generic view for a leaflet map. This has no
    associated model, and data should be supplied to it by an extended view.
    */
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
            this.leafletMap = new L.Map(this.el, {
                layers: [this.osm],
                zoom: 16,
                /*! Hide zoom controls on multitouch devices */
                zoomControl: !L.Browser.touch || L.Browser.android23,
                center: [51.505, -0.09]
            });
        }
    });

    return { MapView: MapView };
});
