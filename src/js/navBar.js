// Control and rendering of the top navigation bar
define("navBar", function(require) {
    "use strict";

    var Backbone = require("backbone"),
        _ = require("underscore"),
        $ = require("jquery"),
        Mustache = require("mustache");

    // This lets us figure out which views we should load when swiping.
    var handlerNames = ["track", "history", "friends", "leaders"];

    // Jquery animation speed
    _.extend($.fx.speeds, {
        "swipe-restore": 150
    });

    var Model = Backbone.Model.extend({
        defaults: {
            enabled: false,
            handler: undefined
        },

        initialize: function(options) {
            this.parent = options.parent;
            this.listenTo(this.parent, "change:handler", this.updateHandler);
            this.listenTo(this, "change:handler", this.updateEnabled);
            this.updateHandler();
            this.updateEnabled();
        },

        // links us with our parent
        updateHandler: function() {
            this.set("handler", this.parent.get("handler"));
        },

        updateEnabled: function() {
            this.set("enabled", _.contains(handlerNames, this.get("handler")));
        }
    });

    var View = Backbone.View.extend({
        el: $("#top nav"),
        scrollTop: undefined,
        events: {
            "iswipe:start body": "swipeHandler",
            "iswipe:move body": "swipeHandler",
            "iswipe:end body": "swipeHandler"
        },

        initialize: function(options) {
            this.parent = options.parent;
            this.listenTo(this.model, "change:handler", this.render);
            // setup swipe events
            var swipeHandlerBound = _.bind(this.swipeHandler, this);
            $(document).on({
                "iswipe:start": swipeHandlerBound,
                "iswipe:move": swipeHandlerBound,
                "iswipe:end": swipeHandlerBound
            });
            this.render();
        },

        render: function() {
            var enabled = this.model.get("enabled");
            this.$el.css("display", enabled ? "" : "none");
        },

        swipeHandler: function(event) {
            if(!this.model.get("enabled")) { return; }
            if(event.data.axis !== "horizontal") { return; }
            // We have a valid swipe
            var parentEl = this.parent.$el,
                subViewEl = $(parentEl.children()[0]);
            if(_.contains(["iswipe:start", "iswipe:move"], event.type)) {
                // save scroll position
                if(this.scrollTop === undefined) {
                    this.scrollTop = $(window).scrollTop();
                }
                // We use a 0 ms animation, so that zepto handles browser
                // prefixing issues for us
                this.parent.collapseSubView(undefined, false);
                subViewEl.animate({
                    translateX: event.data.swipeX + "px",
                    // the y transformation has to be re-done because we're
                    // overwriting the whole css `"transform"` property here
                    translateY: -this.scrollTop + "px"
                }, 0);
            } else { // Restore
                event.data.disableClick();
                subViewEl.animate(
                    {
                        translateX: "0px",
                        translateY: -this.scrollTop + "px"
                    },
                    "swipe-restore",
                    "ease-out",
                    _.bind(function() {
                        // expand and restore scroll position
                        subViewEl.animate({translateY: "0px"}, 0);
                        this.parent.expandSubView();
                        // jquery allows passing and argument to scrollTop,
                        // zepto doesn't.
                        window.scrollTo(window.pageXOffset, this.scrollTop);
                        this.scrollTop = undefined;
                    }, this)
                );
            }
        }
    });

    return {
        handlerNames: handlerNames,
        Model: Model,
        View: View
    };
});
