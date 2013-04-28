define("login", function(require) {
    "use strict";

    var Backbone = require("backbone"),
        _ = require("underscore"),
        $ = require("jquery"),
        Mustache = require("mustache"),
        list = require("list");

    // The framework for the login state
    var LoginModel = Backbone.Model.extend({
        validProviders: ["facebook", "twitter", "openid"],

        defaults: {
            provider: undefined
        },

        initialize: function() {
            // Auto-update boolean providers
            this.on("change:provider", this.onProvider, this);
            this.onProvider();
        },

        // Provide boolean parallels of `provider` for the template. Don't
        // change these values directly.
        onProvider: function() {
            var provider = this.get("provider");
            // restrict inputs to avoid XSS
            if(provider !== undefined &&
                                   !_.contains(this.validProviders, provider)) {
                console.error("Invalid login provider");
                return;
            }
            // Unset all providers but the current one
            _.each(this.validProviders, function(p) {
                this.set(p, false);
            }, this);
            this.set(provider, true);
        }
    });

    // Our singleton model that represents the global "logged in" state
    var model = new LoginModel();

    var LoginView = Backbone.View.extend({
        model: model,
        template: Mustache.compile($("#login-tmpl").html()),

        initialize: function() {
            this.render()=;
            this.on("change:provider", this.render, this);
        },

        render: function() {
            var provider = this.model.get("provider");
            this.$el.html(this.template(this.model.attributes));
        },

        close: function() {
            this.remove();
            this.unbind();
        }
    });

    return {
        LoginView: LoginView,
        LoginModel: LoginModel,
        model: model
    };
});
