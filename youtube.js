var videoID = document.URL.replace(/^[^v]+v.(.{11}).*/,"$1");
var googleURL = "http://gdata.youtube.com/feeds/api/videos/" + videoID + "?alt=json";

//Send
chrome.extension.sendRequest({type: "xhr", url: googleURL}, function(response) {
	var info = JSON.parse(response.text);
	var artist = info.entry.title.$t.split("-")[0].replace(/^\s+|\s+$/g,"");
	var track = info.entry.title.$t.split("-")[1].replace(/^\s+|\s+$/g,"");
	var duration = info.entry.media$group.media$content[0].duration;
	var validationURL = "http://ws.audioscrobbler.com/2.0/?method=track.getinfo&api_key=44c7aeb27b91eb0e4e913098a9dc2378&artist="+ artist + "&track=" + track;
	chrome.extension.sendRequest({type: "xhr", url: validationURL}, function(response) {
		if (response.text != "You must supply either an artist and track name OR a musicbrainz id.") {
			chrome.extension.sendRequest({type: "nowPlaying", artist: artist, track: track, duration: duration});
		};
	});	
});



//Listen
chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
		switch(request.type) {
		case "updateTitle":
			//Gets called from chromescrobbler.js when there is a song playing and is scrobbling.
			//This will add "Scrobbling:" to the video title, to indicate to the user that it is scrobbling.
			var current_title = document.getElementById("watch-headline-title").getElementsByTagName("span")[0]
			current_title.innerHTML='<span id="chrome-scrobbler-status">Scrobbling:</span>'+current_title.innerText
			
			//Add highlight to scrobble box (connot do in CSS because of path)
			document.getElementById("chrome-scrobbler-status").style.backgroundImage="url('"+chrome.extension.getURL("highlight.png")+"')";
			sendResponse({});
		break;
	}
});
