// Functions for handling time that aren't in `Date`.
define("time", function(require) {
    "use strict";

    var _ = require("underscore");

    var deltaUnits = ["week", "day", "hour", "minute", "second"];

    var getDelta = function(from, to) {
        var f = Math.floor;
        var ms = Math.abs(to - from);
        return {
            past:   from < to,
            week:   f(ms / 7 / 24 / 60 / 60 / 1000),
            day:    f(ms     / 24 / 60 / 60 / 1000 % 7),
            hour:   f(ms          / 60 / 60 / 1000 % 24),
            minute: f(ms               / 60 / 1000 % 60),
            second: f(ms                    / 1000 % 60),
            raw:    f(ms)
        };
    };

    // "Smart" pluralization of time units.
    // - `pluralize("second")` -> `"seconds"`
    // - `pluralize("minute", 5)` -> `"minutes"`
    // - `pluralize("hour", 1)` -> `"hour"`
    var pluralize = function(name, number) {
        if(_.isUndefined(number)) number = 2;
        if(number === 1) return name;
        // special cases could be handled here (if we had any)
        return name + "s";
    };

    // A KISS (Keep It Simple, Stupid!) implementation that generates relative
    // human-readable fuzzy time strings, such as "5 minutes ago".
    var relative = function(from, to, what) {
        // object with information about the time delta
        var delta = getDelta(from, to),
            base;

        // if it just happened don't bother computing a time
        if(delta.raw < 5000) return "just now";

        for(var i = 0; i < deltaUnits.length; i++) {
            var unit = deltaUnits[i];
            if(delta[unit] === 0) continue;
            // Write as: "N units"
            base = delta[unit].toString() + " " + pluralize(unit, delta[unit]);
            break;
        }

        // Generate and return final string
        if(delta.past) {
            what = what || "happened";
            return what + " " + base + " ago";
        } else {
            if(!what) {
                return "after " + base;
            } else {
                return what + " in " + base;
            }
        }
    };

    return { getDelta: getDelta, relative: relative };
});
