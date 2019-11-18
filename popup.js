'use strict';

let texts = document.getElementById('text');

chrome.storage.sync.get('DID', function(data) {
    console.log('Value currently is ' + data.DID);
    texts.innerText = data.DID;
});
