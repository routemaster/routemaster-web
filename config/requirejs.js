require.config({
    baseUrl: "../src/js",
    dir: "../bin/js",

    paths: {
        almond: "../../lib/js/almond",
        backbone: "../../lib/js/backbone",
        underscore: "../../lib/js/underscore",
        jquery: "../../lib/js/zepto",
        mustache: "../../lib/js/mustache",
        leaflet: "../../lib/js/leaflet"
    },

    modules: [
        {
            name: "main"
        }
    ],

    shim: {
        backbone: {
            exports: "Backbone",
            deps: ["underscore", "jquery"]
        },
        underscore: {
            exports: "_"
        },
        jquery: {
            exports: "$"
        },
        leaflet: {
            exports: "L"
        }
    }
});
