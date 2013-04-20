define("history", function(require) {
    "use strict";

    var Backbone = require("backbone"),
        _ = require("underscore"),
        $ = require("jquery"),
        Mustache = require("mustache"),
        list = require("list");

    var Route = Backbone.Model.extend({
        defaults: {
            startName: undefined,
            endName: undefined,
            date: undefined,
            distance: undefined,
            efficiency: undefined
        },
        url: '/route/'
    });

    return { Route: Route };
});
