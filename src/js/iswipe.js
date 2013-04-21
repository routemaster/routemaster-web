// A jquery/zepto plugin for "interactive swipe" events. Supports both "mouse"
// and "touch" devices (see `config`). Make sure to call `start` for events to
// enable the listeners.
define("iswipe", function(require) {
    "use strict";

    var _ = require("underscore"),
        $ = require("jquery");

    var config = {
        // minimum number of pixels moved to count as a swipe
        horizonalTriggerDelta: 50,
        verticalTriggerDelta: 30,
        devices: ["mouse", "touch"]
    };

    var state = { // defaults
        down: false,
        triggered: false // have we used our "start" event yet?
    };

    var handler = function(verb, event) {
        // Gets called on all mouse and touch events. `verb` may be `"up"`,
        // `"down"`, or something different, dependent on the source event.
        var down = state.down, // inherit if nothing else
            toggled,
            device = _.isUndefined(event.touches) ? "mouse" : "touch",
            prevState = _.clone(state);

        // ignore certain inputs completely
        if(event === ignoreEvent) return; // see: disableOnElement
        if(state.down && device !== state.device) return; // secondary inputs
        if(!_.contains(config.devices, device)) return;   // unwanted devices

        // Figure out if we're actually down or not. This is a bit of a
        // clusterfuck because we have to support multiple browser APIs.
        if(device === "mouse") {
            if(event.button === 0 && _.contains(["up", "down"], verb)) {
                down = (verb === "down");
            } else if(event.buttons !== undefined) {
                // not all browsers support this
                down = !!(event.buttons & 1);
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
            startEl: down && toggled ? event.target : prevState.startEl,
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
            _.each("device startEl startX startY x y axis direction".split(" "),
                function(el){
                    state[el] = undefined;
                }
            );
            state.triggered = false;
        }
    };

    // Return what axis (`"horizontal"` or `"vertical"`) the swipe is on, using
    // a few heuristics and config.triggerDelta as the threshold. `undefined` is
    // returned if the swipe is too small to determine an axis yet.
    var getAxis = function(state) {
        if(state.axis !== undefined) {
            return state.axis; // axis never changes part-way
        }

        var dx = state.x - state.startX,
            dy = state.y - state.startY,
            dxTrigger = config.horizonalTriggerDelta,
            dyTrigger = config.verticalTriggerDelta;

        // only when we're actually dragging
        if(!state.down) {
            return undefined;
        }

        // too small to trigger
        if(Math.abs(dx) < dxTrigger && Math.abs(dy) < dyTrigger) {
            return undefined;
        }

        // pick the dominant axis
        return Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
    };

    // Assuming we've already computed the axis, tell us if we're left or right,
    // up or down.
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

    // Based on the state, trigger any events necessary
    var triggerEvents = function(baseEvent, state, prevState) {
        var eventType, returnValue = true;

        // determine eventType (or exit if we have nothing to trigger)
        if(!state.triggered && state.axis !== undefined) {
            eventType = "start";
            state.triggered = true;
        } else if(!state.down && prevState.down) {
            eventType = "end";
        } else if(!state.down) {
            return; // not really a swipe
        } else if(state.x !== prevState.x || state.y !== prevState.y) {
            eventType = "move";
        } else {
            return; // we didn't actually move, don't waste time
        }

        // create an event
        $(baseEvent.target).trigger("iswipe:" + eventType,
                                    $.Event(_.extend(_.clone(state), {
            bubbles: true,
            disableClick: function() { disableClick(baseEvent); },
            swipeX: state.x - state.startX,
            swipeY: state.y - state.startY
        })));
    };

    var stopPropogation = function(event) {
        event.stopPropagation();
    };

    // Disable swiping if it happens over a specific element (like an
    // interactive map)
    var ignoreEvent, // the specific event to ignore
        disableOnElementCallback = function(event) { ignoreEvent = event; };
    var disableOnElement = function(el) {
        $(el).on(_.keys(handlerMap).join(" "), disableOnElementCallback);
    };
    var enableOnElement = function(el) {
        $(el).off(_.keys(handlerMap).join(" "), disableOnElementCallback);
    };

    // Disables the next click event from being fired. This is useful to call on
    // "iswipe:end" if you want to ensure a click doesn't fire.
    var disableClick = function(event) {
        // The click only fires if up and down happened on the same element
        if(event.target !== state.startEl) { return; }
        // Intercept the next "click" event, and kill it ASAP.
        // A bit of a hack, but I couldn't find a better way of handling it.
        var intercepted = false;
        var callback = function(ev) {
            if(ev !== undefined) {
                ev.preventDefault();
                ev.stopPropagation();
            }
            if(!intercepted) {
                document.removeEventListener("click", callback, true);
                intercepted = true;
            }
        };
        // The `true` makes the event handler get called on the capture phase
        // (which occurs before the bubbling phase), allowing us to catch and
        // disable the event before anyone else gets the chance.
        // See: <http://w3.org/TR/DOM-Level-3-Events/#event-flow>
        document.addEventListener("click", callback, true);
        // If the "click" didn't fire after a certain time period, we messed up,
        // and we should remove it anyways before we get into more trouble.
        _.delay(callback, 200);
    };

    // Define jQuery handlers for each type of event
    var downHandler = _.partial(handler, "down"),
        moveHandler = _.throttle(_.partial(handler, "move"), 50),
        upHandler = _.partial(handler, "up");

    // Intercept events from `$(document)` and match them up with the
    // appropriate callback.
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

    // Enable mouse and touch event listening. Call me first if you want things
    // to work!
    var start = function() {
        $(document).on(handlerMap);
    };

    // Disable mouse and touch event listening.
    var stop = function() {
        $(document).off(handlerMap);
    };

    return {
        start: start,
        stop: stop,
        disableClick: disableClick,
        disableOnElement: disableOnElement,
        enableOnElement: enableOnElement
    };
});
