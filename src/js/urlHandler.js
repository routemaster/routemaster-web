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

    require("iswipe").start(); // use our iswipe jquery plugin

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
        elSubView: $("#subview"),
        elNavBar: $("#top nav"),

        initialize: function() {
            this.model.on("change:handler", function(model, handler) {
                this[handler]();
            }, this);
            this.model.on("change:navBarEnabled", this.updateNavBar, this);
            // disable dragging on the page
            $("body").on("dragstart", function(event) {
                event.preventDefault();
            });
            // Load the default page
            this[this.model.get("handler")]();
            this.swipeHandlerBound = _.bind(this.swipeHandler, this);
            this.updateNavBar();
        },

        updateNavBar: function() {
            var enabled = this.model.get("navBarEnabled");
            // This seems a bit hackish. There might be a better way of
            // implementing this.
            this.elNavBar.css("display", enabled ? "" : "none");
            var ev = _.bind($(document)[enabled ? "on" : "off"], $(document));
            ev("iswipe:start", this.swipeHandlerBound);
            ev("iswipe:end", this.swipeHandlerBound);
            ev("iswipe:move", this.swipeHandlerBound);
        },

        // Makes the given subview element the correct size such that our page
        // height is exactly 100%. This disables vertical scrolling and ensures
        // that elements we're flipping between have the same height. (all
        // without using `overflow: auto`)
        //
        // We can't use `overflow:auto` because not all browsers support it yet.
        // (I'm looking at you, Android 2.x)
        collapseSubView: function(view) {
            view = view || this.elSubView;
            // we use a 0 ms animation, so that zepto handles browser
            // prefixing issues for us
            $(view.children()[0]).animate({
                translateY: -view.scrollTop() + "px"
            }, 0);
            view.addClass("frozen");
            view.css("height", $(window).height() - $("#top").height());
        },

        // Un-does the modifications made by `collapseSubView`.
        expandSubView: function(view) {
            view = view || this.elSubView;
            $(view.children()[0]).animate({
                translateY: "0px"
            }, 0);
            view.removeClass("frozen");
            view.css("height", "");
        },

        swipeHandler: function(event) {
            if(event.data.axis !== "horizontal") { return; }
            if(_.contains(["iswipe:start", "iswipe:move"], event.type)) {
                // we use a 0 ms animation, so that zepto handles browser
                // prefixing issues for us
                this.collapseSubView();
                $(this.elSubView.children()[0]).animate({
                    translateX: event.data.swipeX + "px",
                    // the y transformation has to be re-done because we're
                    // overwriting the whole css `"transform"` property here
                    translateY: -this.elSubView.scrollTop() + "px"
                }, 0);
            } else {
                event.data.disableClick();
                $(this.elSubView.children()[0]).animate(
                    {translateX: "0px"}, 150, "ease-out",
                    _.bind(this.expandSubView, this)
                );
            }
        },

        login: function() {
            this.subView.close();
            this.subView = new login.LoginView({
                el: $("<div/>").appendTo(this.elSubView),
                model: login.model
            });
        },

        track: function() {
            this.subView.close();
            this.subView = new gps.TrackView({
                el: $("<div/>").appendTo(this.elSubView),
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
                el: $("<div/>").appendTo(this.elSubView),
                collection: routes,
                shortTemplate: Mustache.compile(
                    $("#route-item-short-templ").html()
                ),
                expandedTemplate: Mustache.compile(
                    $("#route-item-expanded-templ").html()
                ),
                itemView: history.RouteItemView
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
                el: $("<div/>").appendTo(this.elSubView),
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
                el: $("<div/>").appendTo(this.elSubView),
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
