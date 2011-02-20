// alert('pandora-lfm-inject.js load');

var pandoraInjApiTries = 0;

function pandoraInjApiLoaded()
{
	// alert('pandoraInjApiLoaded()');
	if (pandoraInjApiTries < 30) {
		if (typeof(Pandora) == "undefined") {
			pandoraInjApiTries++;
			window.setTimeout("pandoraInjApiLoaded()", 5000);
		} else {
			pandoraInjInitialize();
		}
	} else {
		// error unable to register event handlers.
	}
}

window.setTimeout("pandoraInjApiLoaded()", 5000);

function pandoraInjInitialize()
{
	if (typeof(Pandora) == "undefined") {
		// error unable to register event handlers.
		return;
	}
	// alert('pandoraInjInitialize()');

	Pandora.setEventHandler("SongPlayed", function(data) {
			pandoraInjSongPlayEvent(data.songName, data.artistName);
			});
	Pandora.setEventHandler("SongPaused", function(data) {
			pandoraInjSongPauseEvent(data.songName, data.artistName);
			});
	Pandora.setEventHandler("SongEnded", function(data) {
			pandoraInjSongEndEvent(data.songName, data.artistName);
			});
}

function pandoraInjSendEvent(e, song, artist)
{
	var comDiv = document.getElementById('pandoraInjEventsDiv');
	if (!comDiv) {
		// error unable to send event.
		alert('ERROR: pandoraInjEventsDiv not found.');
		return;
	}

	comDiv.setAttribute('song', song);
	comDiv.setAttribute('artist', artist);
	comDiv.dispatchEvent(e);
}

var pandoraInjPlayEventObj  = document.createEvent('Event');
var pandoraInjPauseEventObj = document.createEvent('Event');
var pandoraInjEndEventObj   = document.createEvent('Event');
pandoraInjPlayEventObj.initEvent('pandoraInjPlayEvent', true, true);
pandoraInjPauseEventObj.initEvent('pandoraInjPauseEvent', true, true);
pandoraInjEndEventObj.initEvent('pandoraInjEndEvent', true, true);

function pandoraInjSongPlayEvent(song, artist)
{
	// alert('PLAY: ' + artist + ' - ' + song);
	pandoraInjSendEvent(pandoraInjPlayEventObj,
			song, artist);
}

function pandoraInjSongPauseEvent(song, artist)
{
	// alert('PAUSE: ' + artist + ' - ' + song);
	pandoraInjSendEvent(pandoraInjPauseEventObj,
			song, artist);
}

function pandoraInjSongEndEvent(song, artist)
{
	// alert('END: ' + artist + ' - ' + song);
	pandoraInjSendEvent(pandoraInjEndEventObj,
			song, artist);
}
