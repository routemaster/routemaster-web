// A jquery/zepto plugin for "interactive swipe" events. Supports both "mouse"
// and "touch" devices (see `config`).
define("iswipe", function(require) {
    "use strict";

    var _ = require("underscore"),
        $ = require("jquery");

    var config = {
        triggerDelta: 30, // minimum number of pixels moved to count as a swipe
        devices: ["mouse", "touch"]
    };

    var state = { // defaults
        down: false
    };

    var handler = function(verb, event) {
        // Gets called on all mouse and touch events. `verb` may be `"up"`,
        // `"down"`, or something different, dependent on the source event.
        var down, toggled,
            device = _.isUndefined(event.touches) ? "mouse" : "touch",
            prevState = _.clone(state);

        // ignore certain inputs completely
        if(state.down && device !== state.device) return; // secondary inputs
        if(!_.contains(config.devices, device)) return;   // unwanted devices

        // Figure out if we're actually down or not. This is a bit of a
        // clusterfuck because we have to support multiple browser APIs.
        if(device === "mouse") {
            if(event.button === 1 && _.contains(["up", "down"], verb)) {
                down = (verb === "down");
            } else {
                down = event.buttons & 1;
            }
        } else { // device === "touch"
            if(event.touches.length > 1) {
                down = false; // don't mess with pinch gestures
            } else {
                down = (verb !== "up");
            }
        }

        // did `down` change?
        toggled = down !== prevState.down;

        // find mouse or touch position
        var screenInfo = event.touches === undefined ? event : event.touches[0],
            x = screenInfo.screenX,
            y = screenInfo.screenY;

        // update state
        _.extend(state, {
            down: down,
            device: device,
            startX: down && toggled ? x : prevState.startX,
            startY: down && toggled ? y : prevState.startY,
            x: x,
            y: y
        });
        state.axis = getAxis(state);
        state.direction = getDirection(state);

        triggerEvents(event, state, prevState);

        // clean up state after `up`
        if(!down) {
            _.each("device startX startY x y axis direction".split(" "),
                function(el){
                    state[el] = undefined;
                }
            );
        }
    };

    var getAxis = function(state) {
        if(state.axis !== undefined) {
            return state.axis; // axis never changes part-way
        }
        var dx = state.x - state.startX,
            dy = state.y - state.startY;

        // too small to trigger
        if(Math.abs(dx) < config.triggerDelta) {
            return undefined;
        } else if(Math.abs(dy) < config.triggerDelta) {
            return undefined;
        }

        // pick the dominant axis
        return Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
    };

    var getDirection = function(state) {
        switch(state.axis) {
            case "horizontal":
                return state.x < state.startX ? "left" : "right";
            case "vertical":
                return state.y < state.startY ? "up" : "down";
            default:
                return undefined; // we need an axis to find a direction
        }
    };

    var triggerEvents = function(baseEvent, state, prevState) {
        var toggled = state.down !== prevState.down,
            eventType;

        // determine eventType (or exit if we have nothing to trigger)
        if(state.down && toggled) {
            eventType = "start";
        } else if(!state.down && toggled) {
            eventType = "stop";
        } else if(!state.down) {
            return; // not really a swipe
        } else if(state.x !== prevState.x || state.y !== prevState.y) {
            eventType = "move";
        } else {
            return; // we didn't actually move
        }

        // create an event
        $(baseEvent.target).trigger("iswipe:" + eventType,
                                    $.Event(_.extend(_.clone(state), {
            bubbles: true,
            swipeX: state.x - state.startX,
            swipeY: state.y - state.startY
        })));
    };

    var downHandler = _.partial(handler, "down"),
        moveHandler = _.partial(handler, "move"),
        upHandler = _.partial(handler, "up");

    var handlerMap = {
        mousedown:   downHandler,
        mousemove:   moveHandler,
        mouseup:     upHandler,
        touchstart:  downHandler,
        touchmove:   moveHandler,
        touchend:    upHandler,
        touchcancel: upHandler,
        touchleave:  upHandler
    };

    var start = function() {
        _.each(_.pairs(handlerMap), _.partial($(document).on.apply,
                                              $(document).on));
    };

    var stop = function() {
        _.each(_.pairs(handlerMap), _.partial($(document).off.apply,
                                              $(document).off));
    };

    return { start: start, stop: stop };
});
