define("error", function(require) {
    "use strict";

    var Backbone = require("backbone"),
        Mustache = require("mustache");

    var ErrorView = Backbone.View.extend({
        template: Mustache.compile($("#error-templ").html()),

        close: function() {
            this.remove();
            this.unbind();
        },

        initialize: function(options) {
            this.message = options.message;
            this.render();
        },

        render: function() {
            this.$el.html(this.template({message: this.message}));
        }
    });

    return {
        ErrorView: ErrorView
    };
});
