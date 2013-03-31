// Only the most top-level code should go in here. This should spawn the
// top-level views for the application. That's it. All other code should go into
// an appropriate module.
define(function(require) {
    "use strict";

    var Backbone = require("backbone"),
        _ = require("underscore"),
        $ = require("jquery"),
        L = require("leaflet"),
        urlHandler = require("urlHandler");

    L.Icon.Default.imagePath = "img/leaflet";

    // Kick things off
    new urlHandler.Router();

    // Handling HTML5's pushState would require work on the web server, and it's
    // just not worth it right now. We'll use #fragments instead.
    Backbone.history.start({pushState: false});
});

// A magic little helper module that delays execution of our code until the DOM
// is ready
define("documentReady", function(require) {
    "use strict";
    require("jquery")(function() { require("main"); });
});

require(["documentReady"], function() {});
