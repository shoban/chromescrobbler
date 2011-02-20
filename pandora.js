function Log(type, str)
{
	console.log(type.toUpperCase() + ': ' + str);
}
function LogD(str) { Log('debug', str); }
function LogE(str) { Log('error', str); }

var g_song = "";
var g_artist = "";
var g_playedDuration = 0;
var g_startTime = 0;
var g_songPaused = false;

function getTime()
{
	var d = new Date();
	return d.getTime();
}

function pandoraClearSong()
{
	g_song = "";
	g_artist = "";
	g_playedDuration = 0;
	g_startTime = 0;
	g_songPaused = false;
}

function pandoraSongPauseEvent()
{
	LogD('PauseEvent: ');
	var ev_div = document.getElementById('pandoraInjEventsDiv');
	if (!ev_div) {
		return;
	}

	song = ev_div.getAttribute('song');
	artist = ev_div.getAttribute('artist');

	LogD('PauseEvent: ' + artist + ' - ' + song);
	if (song == g_song && artist == g_artist) {
		g_songPaused = true;
		g_playedDuration += getTime() - g_startTime;
		g_startTime = 0;
	}
}

function pandoraSongPlayEvent()
{
	LogD('PlayEvent: ');

	var ev_div = document.getElementById('pandoraInjEventsDiv');
	if (!ev_div) {
		return;
	}

	song = ev_div.getAttribute('song');
	artist = ev_div.getAttribute('artist');

	LogD('PlayEvent: ' + artist + ' - ' + song);
	if (g_song == "" && g_artist == "") {
		// New song start.
		g_song = song;
		g_artist = artist;
		g_playedDuration = 0;
		g_startTime = getTime();
		g_songPaused = false;
		pandoraSendNowPlaying();
	} else {
		// Continuation of same song.
		g_startTime = getTime();
	}
}

function pandoraSongEndEvent()
{
	LogD('EndEvent: ');
	var ev_div = document.getElementById('pandoraInjEventsDiv');
	if (!ev_div) {
		return;
	}

	song = ev_div.getAttribute('song');
	artist = ev_div.getAttribute('artist');

	LogD('EndEvent: ' + artist + ' - ' + song);

	if (song == g_song && artist == g_artist) {
		g_playedDuration += getTime() - g_startTime;

		// Only submit songs which have played more than 2mins.
		LogD('EndEvent: g_playedDuration=' + g_playedDuration);
		if (g_playedDuration > 120000) {
			pandoraSendPlayed();
		}
	}

	pandoraClearSong();
}

function pandoraInitialize()
{
	LogD('pandoraInitialize(): ');
	if (!document.getElementById("tunerEventListenerDiv")) {
		var api = document.createElement('script');
		api.setAttribute('language', 'javascript');
		api.setAttribute('type', 'text/javascript');
		api.setAttribute('src', 'http://www.pandora.com/include/PandoraAPIv2.js');
		api.setAttribute('id', 'evntjs');
		document.getElementsByTagName('head')[0].appendChild(api);
		LogD('Injecting PandoraAPIv2.js');
	}

	var ev_div = document.createElement('div');
	ev_div.setAttribute('style', 'display:none');
	ev_div.setAttribute('id', 'pandoraInjEventsDiv');
	document.getElementsByTagName('body')[0].appendChild(ev_div);
	LogD('pandoraInjEventsDiv: created.');

	ev_div.addEventListener('pandoraInjPlayEvent', function() {
			pandoraSongPlayEvent();
			});
	ev_div.addEventListener('pandoraInjPauseEvent', function() {
			pandoraSongPauseEvent();
			});
	ev_div.addEventListener('pandoraInjEndEvent', function() {
			pandoraSongEndEvent();
			});
	LogD('pandoraInjEventsDiv: events registered.');

	var lfm_inj = document.createElement('script');
	lfm_inj.setAttribute('language', 'javascript');
	lfm_inj.setAttribute('type', 'text/javascript');
	lfm_inj.setAttribute('src',
			chrome.extension.getURL('pandora-lfm-inject.js'));
	lfm_inj.setAttribute('id', 'lfminjjs');
	document.getElementsByTagName('head')[0].appendChild(lfm_inj);
	LogD('Injecting pandora-lfm-inject.js');

	pandoraClearSong();
}


function pandoraSendNowPlaying()
{
	var validationURL = "http://ws.audioscrobbler.com/2.0/?" +
		"method=track.getinfo" +
		"&api_key=44c7aeb27b91eb0e4e913098a9dc2378" +
		"&artist="+ g_artist + "&track=" + g_song;
	LogD('pandoraSendNowPlaying(): ');
	LogD('pandoraSendNowPlaying(): validationURL=' + validationURL);

	chrome.extension.sendRequest({type: "xhr", url: validationURL},
			function(response) {
				if (response.text != "You must supply either an artist and track name OR a musicbrainz id.") {
					LogD('pandoraSendNowPlaying(): send nowPlaying.');
					chrome.extension.sendRequest({type: "nowPlaying",
						artist: g_artist, track: g_song, duration: 0,
						source: "R"});
				};
			});
	LogD('pandoraSendNowPlaying(): auth.');
}

function pandoraSendPlayed()
{
	LogD('pandoraSendPlayed(): ');
	chrome.extension.sendRequest({type: "submit"},
			function(r) {
				LogD('pandoraSendPlayed(): submitted.');
			});
}

pandoraInitialize();
