// Describes to Backbone how to switch between views for each url
define("urlHandler", function(require) {
    "use strict";

    var Backbone = require("backbone"),
        _ = require("underscore"),
        $ = require("jquery"),
        // navBar = require("navBar"),
        gps = require("gps"),
        Mustache = require("mustache"),
        list = require("list"),
        history = require("history"),
        login = require("login"),
        friend = require("friend");

    // I'm not totally sure where we should put this yet. It needs to be
    // initialized ASAP to give the device time to get a GPS fix.
    var gpsTracker = new gps.Tracker({watching: true});

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
            navBarEnabled: true,
            loginProvider: undefined
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
        subView: {close: function() {}}, // The current frontmost subview

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
            $("#top nav").css("display", enabled ? "" : "none");
        },

        login: function() {
            this.subView.close();
            this.subView = new login.LoginView({
                el: $("<div/>").appendTo($("#subview")),
                model: login.model
            });
        },

        track: function() {
            this.subView.close();
            this.subView = new gps.TrackView({
                el: $("<div/>").appendTo($("#subview")),
                model: gpsTracker
            });
        },

        history: function() {
            this.subView.close();
            var Routes = Backbone.Collection.extend({
                model: history.Route,
                url: "/user/1/recent/"
            });
            var routes = new Routes();
            this.subView = new list.ListView({
                el: $("<section/>").appendTo($("#subview")),
                collection: routes,
                shortTemplate: Mustache.compile(
                    $("#route-item-short-templ").html()
                ),
                expandedTemplate: Mustache.compile(
                    $("#route-item-expanded-templ").html()
                )
            });
            routes.fetch({
                success: _.bind(function(collection, response, options) {
                    this.subView.render();
                }, this),
                error: function() {
                    console.log(arguments);
                }
            });
        },

        friends: function() {
            this.subView.close();
            var fakeFriends = [
                {name: "Manuel Bermúdez"},
                {name: "Manuel Bermúdez"},
                {name: "Manuel Bermúdez"},
                {name: "Manuel Bermúdez"},
                {name: "Manuel Bermúdez"},
                {name: "Manuel Bermúdez"},
                {name: "Manuel Bermúdez"},
                {name: "Manuel Bermúdez"},
                {name: "Manuel Bermúdez"},
                {name: "Manuel Bermúdez"},
                {name: "Manuel Bermúdez"},
            ];
            var collection = new Backbone.Collection([], {
                model: friend.Friend
            });
            collection.add(fakeFriends);
            this.subView = new list.ListView({
                el: $("<section/>").appendTo($("#subview")),
                collection: collection,
                shortTemplate: Mustache.compile(
                    $("#friend-item-short-templ").html()
                ),
                expandedTemplate: Mustache.compile(
                    $("#friend-item-expanded-templ").html()
                )
            });
            this.subView.render();
        },

        leaders: function() {
            this.subView.close();
            var fakeFriends = [
                {name: "Manuel Bermúdez"},
                {name: "Manuel Bermúdez"},
                {name: "Manuel Bermúdez"},
                {name: "Manuel Bermúdez"},
                {name: "Manuel Bermúdez"},
                {name: "Manuel Bermúdez"},
                {name: "Manuel Bermúdez"},
                {name: "Manuel Bermúdez"},
                {name: "Manuel Bermúdez"},
                {name: "Manuel Bermúdez"},
                {name: "Manuel Bermúdez"},
            ];
            var collection = new Backbone.Collection([], {
                model: friend.Friend
            });
            collection.add(fakeFriends);
            this.subView = new list.ListView({
                el: $("<section/>").appendTo($("#subview")),
                collection: collection,
                shortTemplate: Mustache.compile(
                    $("#friend-item-short-templ").html()
                ),
                expandedTemplate: Mustache.compile(
                    $("#friend-item-expanded-templ").html()
                )
            });
            this.subView.render();
        }
    });

    // We let [`Backbone.Router`](http://backbonejs.org/#Router) figure out what
    // to load. It intercepts varying URL fragments (eg.
    // `routemaster.com/#track`), and sets the model appropriately.
    var Router = Backbone.Router.extend({
        // Complex parameterized urls
        routes: {
            "login/:provider": "login",
            "login": "login"
        },

        initialize: function() {
            this.model = new State();
            this.view = new PageView({model: this.model});
            // Autogenerate handler for our simple urls
            _.each(["track", "history", "friends", "leaders"],
                function(handler) {
                    this.route(handler, handler, function() {
                        this.model.set("handler", handler);
                    });
                }, this
            );
        },

        // handler functions for complex cases
        login: function(provider) {
            login.model.set("provider", provider);
            this.model.set("handler", "login");
        }
    });

    return {Router: Router, State: State};
});
