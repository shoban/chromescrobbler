function saveOptions() {	
	localStorage.username = document.getElementById("username").value;
	localStorage.password = MD5(document.getElementById("password").value);
	chrome.extension.sendRequest({type: "newSession"});
}

function deleteOptions() {
	localStorage.clear();
	chrome.extension.sendRequest({type: "newSession"});
}