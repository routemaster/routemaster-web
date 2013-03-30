// Describes to Backbone how to switch between views for each url
define("urlHandler", function(require) {
    "use strict";

    var Backbone = require("backbone"),
        _ = require("underscore"),
        $ = require("jquery"),
        // navBar = require("navBar"),
        gps = require("gps");

    // I'm not totally sure where we should put this yet. It needs to be
    // initialized ASAP to give the device time to get a GPS fix.
    var gpsTracker = new gps.Tracker();

    // It doesn't make sense to store state information in the router, so we
    // make a model that gets configured by the router and read from by the
    // view. The view may indirectly change the model state by changing the page
    // URL.
    var State = Backbone.Model.extend({
        defaults: {
            // The `handler` corresponds to the current page. Additional
            // information from the router should be stored explicitly inside
            // the model
            handler: "login",
            // The nav bar might need to have some state of its own. Maybe this
            // should be its own View and Model in a module.
            navBarEnabled: true
        },

        initialize: function() {
            this.on("change:handler", this.updateNavBar, this);
            this.updateNavBar();
        },

        updateNavBar: function() {
            // Some pages shouldn't show the nav bar
            this.set("navBarEnabled", this.get("handler") !== "login");
        }
    });

    // By setting different subviews, this handles the navigation bar, the logo
    // bar at the top of the page, and switches us between the login page, the
    // tracking page, etc. It subscribes to changes in the `State` model and
    // updates the display automatically.
    var PageView = Backbone.View.extend({
        subView: {close: function() {}}, // Just a stub for now

        initialize: function() {
            this.model.on("change:handler", function(model, handler) {
                this[handler]();
            }, this);
            this.model.on("change:navBarEnabled", this.updateNavBar, this);
            // Load the default page
            this[this.model.get("handler")]();
            this.updateNavBar();
        },

        updateNavBar: function() {
            var enabled = this.model.get("navBarEnabled");
            // This seems a bit hackish. There might be a better way of
            // implementing this.
            $("#top nav").css({"visible": enabled,
                               "display": enabled ? "" : "none"});
        },

        login: function() {
            console.error("login view is not yet implemented");
        },

        track: function() {
            if(this.model.previous("handler") !== "login") {
                this.subView.close();
            }
            var gpsView = new gps.HudView({model: gpsTracker}),
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

    // We let [`Backbone.Router`](http://backbonejs.org/#Router) figure out what
    // to load. It intercepts varying URL fragments (eg.
    // `routemaster.com/#track`), and sets the model appropriately.
    var Router = Backbone.Router.extend({
        initialize: function() {
            this.model = new State();
            this.view = new PageView({model: this.model});
            // Autogenerate handler for our simple urls
            _.each(["login", "track", "history", "friends", "leaderboard"],
                function(handler) {
                    this.route(handler, handler, function() {
                        this.model.set("handler", handler);
                    });
                }, this
            );
            // Complex parameterized urls could be handled here, if we had any
        }
    });

    return {Router: Router, State: State};
});
