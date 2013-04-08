define("friend", function(require) {
    "use strict";

    var Backbone = require("backbone"),
        _ = require("underscore"),
        $ = require("jquery");

    var Friend = Backbone.Model.extend({
        defaults: {
            name: undefined
        }
    });

    return { Friend: Friend };
});
