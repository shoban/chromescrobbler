var sessionID = "";
var song = {};
var nowPlayingTab = null;
var nowPlayingURL = "http://post.audioscrobbler.com:80/np_1.2";
var submissionURL =  "http://post2.audioscrobbler.com:80/protocol_1.2";

function handshake() {
	console.log('handshake(): ');
	var username = localStorage.username;
	var password = localStorage.password;
	var currentTime = parseInt(new Date().getTime() / 1000.0);
	var token = MD5(password + currentTime);
	var http_request = new XMLHttpRequest();
	http_request.onreadystatechange = function() {
		if (http_request.readyState == 4 && http_request.status == 200) {
			response = http_request.responseText.split("\n")[0];
			console.log('handshake(): ' + http_request.responseText);
			if (response != "OK") {
				console.log('handshake(): failed. ' + response);
			}
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

function nowPlaying(sender) {
	var params = "s=" + sessionID + "&a=" + song.artist + "&t=" + song.track + "&b=";
	if (song.duration != 0) {
		params += "&l=" + song.duration;
	} else {
		params += "&l=";
	}
	params += "&m=&n=";
	console.log('nowPlaying(): params=' + params);
	var http_request = new XMLHttpRequest();
	http_request.onreadystatechange = function() {
		if (http_request.readyState == 4 && http_request.status == 200)
			console.log('nowPlaying(): rsp=' + http_request.responseText);
			if (http_request.responseText.split("\n")[0] == "BADSESSION") {handshake(); nowPlaying();}
			else {
				//Executes updateTitle function in youtube.js, only when there is a successfull session id. If user had wrong pass or uname, it will not update the title
				chrome.tabs.sendRequest(sender.tab.id, {type: "updateTitle"});
			}
	};	
	http_request.open("POST", nowPlayingURL, true);
	http_request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	http_request.send(params);
}

function submit() {
	nowPlayingTab = null;
	var playTime = parseInt(new Date().getTime() / 1000.0) - song.startTime;
	if (playTime > 30 && playTime > Math.min(240, song.duration / 2)) {
		var params = "s=" + sessionID + "&a[0]=" + song.artist;
		params += "&t[0]=" + song.track;
		params += "&i[0]=" + song.startTime;
		params += "&o[0]=" + song.source;
		params += "&r[0]=";
		if (song.duration != 0) {
			params += "&l[0]=" + song.duration;
		} else {
			params += "&l[0]=";
		}
		params += "&b[0]=&m[0]=&n[0]=";
		console.log('submit(): params=' + params);
		var http_request = new XMLHttpRequest();
		http_request.onreadystatechange = function() {
			if (http_request.readyState == 4 && http_request.status == 200)
				console.log('submit(): rsp=' + http_request.responseText);
				if (http_request.responseText.split("\n")[0] == "BADSESSION") {handshake(); submit();}
			};
		http_request.open("POST", submissionURL, true);
		http_request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		http_request.send(params);
	}
}

chrome.extension.onRequest.addListener( function(request, sender, sendResponse) {
		switch(request.type) {
		case "nowPlaying":
		if (nowPlayingTab != null) submit();
		nowPlayingTab = sender.tab.id;
		song = {	"artist"	:	request.artist,
					"track"		:	request.track,
					"duration"	:	request.duration,
					"source"	:	request.source,
					"startTime"	:	parseInt(new Date().getTime() / 1000.0)};
		if (sessionID == "") handshake();
		nowPlaying(sender);
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
