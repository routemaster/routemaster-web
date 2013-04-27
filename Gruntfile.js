_ = require("underscore");
module.exports = function(grunt) {
    "use strict";

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                jshintrc: "config/jshint.json"
            },
            all: ["Gruntfile.js", "src/js/**/*.js"]
        },
        copy: {
            all: {
                files: [
                    {
                        expand: true,
                        cwd: "src/html/",
                        src: ["**"],
                        dest: "bin/"
                    },
                    {
                        expand: true,
                        cwd: "src/",
                        src: ["img/**"],
                        dest: "bin/"
                    },
                    {
                        expand: true,
                        cwd: "lib/",
                        src: ["css/**", "js/almond.js"],
                        dest: "bin/"
                    },
                    {
                        expand: true,
                        cwd: "share/",
                        src: ["font/**"],
                        dest: "bin/"
                    }
                ]
            }
        },
        requirejs: {
            all: {
                options: {
                    mainConfigFile: "config/requirejs.js",
                    optimize: "none"
                }
            }
        },
        sass: {
            all: {
                options: {
                    style: "compressed",
                    unixNewlines: true
                },
                files: {
                    "bin/css/global.css": "src/sass/global.sass"
                }
            }
        },
        clean: ["bin"]
    });

    _.each([
        "grunt-contrib-clean",
        "grunt-contrib-copy",
        "grunt-contrib-jshint",
        "grunt-contrib-requirejs",
        "grunt-contrib-sass"
    ], grunt.loadNpmTasks, grunt);

    grunt.registerTask("lint",    ["clean", "jshint", "sass"]);
    grunt.registerTask("default",
                       ["clean", "jshint", "requirejs", "sass", "copy"]);
};
