define("friend", function(require) {
    "use strict";

    var Backbone = require("backbone"),
        _ = require("underscore"),
        $ = require("jquery"),
        Mustache = require("mustache"),
        list = require("list");

    var Friend = Backbone.Model.extend({
        defaults: {
            name: undefined
        },
	url: '/user/'
    });

    return { Friend: Friend };
});
