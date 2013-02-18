(function() 
{
"use strict";
var ispathing = false;
var starttime = 0.0;
var pathtime = 0.0;
var watchPosId;
var startbutton = document.getElementById('StartButton');
var endbutton = document.getElementById('EndButton');
var resultsbutton = document.getElementById('ResultsButton');
var statustext = document.getElementById('Status');
var loctext = document.getElementById('Location');

var start = function ()
{
	alert("Start was called"); //Exists for testing purposes
	starttime = new Date().getTime() / 1000;
	startbutton.disabled = true;
	endbutton.disabled = false;
	resultsbutton.style.display = "none";
	loctext.style.display = "inline";
	ispathing = true;
	updateTime();
	watchPosId = navigator.geolocation.watchPosition(updateLoc);
}
var end = function ()
{
	alert("The path has ended."); //Exists for testing purposes
	ispathing = false;
	updateText("The path has ended.");
	pathtime = new Date().getTime()/1000 - starttime;
	startbutton.disabled = false;
	endbutton.disabled = true;
	resultsbutton.style.display = "inline";
	loctext.style.display = "none";
	navigator.geolocation.clearWatch(watchPosId);
	/*
		Do something with path time.
	*/
}
var updateText = function (text)
{
    statustext.innerHTML = text;
}
var updateLoc = function(position)
{
	//Dependent on if we're tracking without app being active, may remove
	//and just call updateLoc at the very beginning and leave it running, 
	//with a separate function for map tile checking
	if(!ispathing)
		return; 
	loctext.innerHTML = "Location: "+position.coords.latitude + 
		", " + position.coords.longitude;
	/*
		Insert server code here?
	*/
}
var updateTime = function ()
{
    if(!ispathing)
        return;
	pathtime = new Date().getTime()/1000 - starttime;
	var pasttime = convertSeconds(pathtime);
	updateText(pasttime);
	setTimeout(updateTime, 1000);	
}
var convertSeconds = function (seconds)
{
	var hours = Math.floor(seconds/3600);
	var minutes = Math.floor((seconds % 3600) / 60);
	var newseconds = Math.ceil(seconds % 3600 % 60);
	return "Time: " + toTime(hours) + ":" + toTime(minutes) 
		+ ":" + toTime(newseconds);
}
var results = function()
{
	//DummyText
	document.write("Results logged.");
}
var toTime = function(timer)
{
	if(timer > 9)
		return timer;
	return "0"+timer;
}
startbutton.onclick = start;
endbutton.onclick = end;
resultsbutton.onclick = results;
}());