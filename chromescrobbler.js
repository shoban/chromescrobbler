var sessionID = "";
var song = {};
var nowPlayingTab = null;
var nowPlayingURL = "http://post.audioscrobbler.com:80/np_1.2";
var submissionURL =  "http://post2.audioscrobbler.com:80/protocol_1.2";

function handshake() {
	var username = localStorage.username;
	var password = localStorage.password;
	var currentTime = parseInt(new Date().getTime() / 1000.0);
	var token = MD5(password + currentTime);
	var http_request = new XMLHttpRequest();
	http_request.onreadystatechange = function() {
		if (http_request.readyState == 4 && http_request.status == 200) {
			sessionID = http_request.responseText.split("\n")[1];
			nowPlayingURL = http_request.responseText.split("\n")[2];
			submissionURL = http_request.responseText.split("\n")[3];
		}
	}
	http_request.open(
		"GET",
		"http://post.audioscrobbler.com/?hs=true&p=1.2.1&c=chr&v=0.1&u=" + username + "&t=" + currentTime + "&a=" + token,
		false);
	http_request.setRequestHeader("Content-Type", "application/xml");
	http_request.send(null);
}

function nowPlaying() {
	var params = "s=" + sessionID + "&a=" + song.artist + "&t=" + song.track +	"&b=&l=" + song.duration + "&m=&n=";
	var http_request = new XMLHttpRequest();
	http_request.onreadystatechange = function() {
		if (http_request.readyState == 4 && http_request.status == 200)
			if (http_request.responseText.split("\n")[0] == "BADSESSION") {handshake(); nowPlaying();}
	};	
	http_request.open("POST", nowPlayingURL, true);
	http_request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	http_request.send(params);
}

function submit() {
	nowPlayingTab = null;
	var playTime = parseInt(new Date().getTime() / 1000.0) - song.startTime;
	if (playTime > 30 && playTime > Math.min(240, song.duration / 2)) {
		var params = "s=" + sessionID + "&a[0]=" + song.artist + "&t[0]=" + song.track + "&i[0]=" + song.startTime + "&o[0]=P&r[0]=&l[0]=" + song.duration + "&b[0]=&m[0]=&n[0]=";
		var http_request = new XMLHttpRequest();
		http_request.onreadystatechange = function() {
			if (http_request.readyState == 4 && http_request.status == 200)
				if (http_request.responseText.split("\n")[0] == "BADSESSION") {handshake(); submit();}
			};
		http_request.open("POST", submissionURL, true);
		http_request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		http_request.send(params);
	}
}

chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
		switch(request.type) {
		case "nowPlaying":
		if (nowPlayingTab != null) submit();
		nowPlayingTab = sender.tab.id;
		song = {	"artist"	:	request.artist,
					"track"		:	request.track,
					"duration"	:	request.duration,
					"startTime"	:	parseInt(new Date().getTime() / 1000.0)};
		if (sessionID == "") handshake();
		nowPlaying();
		sendResponse({});
		break;
		case "submit":
		if (sessionID == "") handshake();
		submit();
		sendResponse({});
		break;
		case "xhr":
		var http_request = new XMLHttpRequest();
		http_request.open("GET", request.url, true);
		http_request.onreadystatechange = function() {
			if (http_request.readyState == 4 && http_request.status == 200)
				sendResponse({text: http_request.responseText});
		};
		http_request.send(null);
		break;
		case "newSession":
		sessionID = "";
		break;
		}
	}
);

chrome.tabs.onUpdated.addListener(function(tabID, changeInfo, tab) {
	if (tabID == nowPlayingTab)
		if (changeInfo.url) submit();
});

chrome.tabs.onRemoved.addListener(function(tabID) {
	if (tabID == nowPlayingTab) submit();
});