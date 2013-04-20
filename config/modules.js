{
    baseUrl: "${basedir}/src/js", // module names are relative to baseUrl
    dir: "${basedir}/bin/js", // the output directory
    optimize: "none", // can be "uglify2" or "closure"
    waitSeconds: 30, // maven is _really_ slow

    paths: {
        almond: "${basedir}/lib/js/almond",
        backbone: "${basedir}/lib/js/backbone",
        underscore: "${basedir}/lib/js/underscore",
        jquery: "${basedir}/lib/js/zepto", // called jquery for compatibility
        mustache: "${basedir}/lib/js/mustache",
        plusone: "${basedir}/lib/js/plusone",
        leaflet: "${basedir}/lib/js/leaflet"
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
        },
        plusone: {
            exports: "gapi",
            deps: ["jquery"]
        }
    }
}
