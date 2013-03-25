// Only the most top-level code should go in here. This should spawn the
// top-level views for the application. That's it. All other code should go into
// an appropriate module.
define(function(require) {
    "use strict";

    var Backbone = require("backbone"),
        _ = require("underscore"),
        $ = require("jquery"),
        L = require("leaflet"),
        gps = require("gps");

    L.Icon.Default.imagePath = "img/leaflet";

    // kick things off
    // TODO: Use Backbone.Router for this
    var gpsTracker = new gps.Tracker(),
        gpsView = new gps.HudView({model: gpsTracker}),
        mapView = new gps.MapView({el: $("#map"), model: gpsTracker});
});

// A magic little helper module that delays execution of our code until the DOM
// is ready
define("documentReady", function(require) {
    "use strict";
    require("jquery")(function() { require("main"); });
});

require(["documentReady"], function() {});
