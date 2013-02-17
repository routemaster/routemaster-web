/*global window*/
(function() {
    "use strict";
    var ispathing = false,
        starttime = 0.0,
        pathtime = 0.0,
        watchPosId,
        startbutton = document.getElementById('start-button'),
        endbutton = document.getElementById('end-button'),
        statustext = document.getElementById('status'),
        loctext = document.getElementById('location'),
        updateTimeInterval,

        updateText = function (text) {
            statustext.innerHTML = text;
        },

        toTime = function(timer) {
            if(timer > 9) {
                return timer;
            }
            return "0"+timer;
        },

        convertSeconds = function (seconds) {
            var hours = Math.floor(seconds/3600),
                minutes = Math.floor((seconds % 3600) / 60),
                newseconds = Math.ceil(seconds % 3600 % 60);
            return "Time: " + toTime(hours) + ":" + toTime(minutes)
                + ":" + toTime(newseconds);
        },

        updateTime = function () {
            pathtime = new Date().getTime()/1000 - starttime;
            var pasttime = convertSeconds(pathtime);
            updateText(pasttime);
        },

        updateLoc = function(position) {
            // Dependent on if we're tracking without app being active, may remove
            // and just call updateLoc at the very beginning and leave it running, 
            // with a separate function for map tile checking
            if(!ispathing) {
                return;
            }
            loctext.innerHTML = "Location: "+position.coords.latitude +
                ", " + position.coords.longitude;
            // Insert server code here?
        },

        start = function () {
            window.alert("Start was called"); // Exists for testing purposes
            starttime = new Date().getTime() / 1000;
            startbutton.disabled = true;
            endbutton.disabled = false;
            loctext.style.display = "inline";
            ispathing = true;
            watchPosId = navigator.geolocation.watchPosition(updateLoc);
            updateTimeInterval = window.setInterval(updateTime, 1000);
        },

        end = function () {
            window.alert("The path has ended."); // Exists for testing purposes
            ispathing = false;
            updateText("The path has ended.");
            pathtime = new Date().getTime()/1000 - starttime;
            startbutton.disabled = false;
            endbutton.disabled = true;
            loctext.style.display = "none";
            navigator.geolocation.clearWatch(watchPosId);
            window.clearInterval(updateTimeInterval);
            updateTimeInterval = null;
            // Do something with path time.
        };

    startbutton.onclick = start;
    endbutton.onclick = end;
}());
