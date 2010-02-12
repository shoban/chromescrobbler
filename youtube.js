var videoID = document.URL.replace(/^[^v]+v.(.{11}).*/,"$1");
var googleURL = "http://gdata.youtube.com/feeds/api/videos/" + videoID + "?alt=json";


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