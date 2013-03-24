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

    // We let Backbone.Router figure out what view to display
    // http://backbonejs.org/#Router
    var Router = Backbone.Router.extend({
        routes: {
            "login": "login",
            "track": "track",
            "history": "history",
            "friends": "friends",
            "leaderboards": "leaderboards"
        },

        initialize: function() {
            this.track();
        },

        login: function() {
            console.error("login view is not yet implemented");
        },

        track: function() {
            var gpsTracker = new gps.Tracker(),
                gpsView = new gps.HudView({model: gpsTracker}),
                mapView = new gps.MapView({el: $("#map"), model: gpsTracker});
        },

        history: function() {
            console.error("history view not yet implemented");
        },

        friends: function() {
            console.error("friends view not yet implemented");
        },

        leaderboards: function() {
            console.error("leaderboards view not yet implemented");
        }
    });

    // Handling HTML5's pushState would require work on the web server, and it's
    // just not worth it right now. We'll use #fragments instead.
    Backbone.history.start({pushState: false});

    // Kick things off
    new Router();
});

// A magic little helper module that delays execution of our code until the DOM
// is ready
define("documentReady", function(require) {
    "use strict";
    require("jquery")(function() { require("main"); });
});

require(["documentReady"], function() {});
