'use strict';
var cookies_name = "DFTT_END_USER_PREV_BOOTSTRAPPED";
var cookies_url = "https://liveramp.com/";
var extension_server = "http://localhost:8081/extension/match";
var code_segment = "https://liveramp.com/wp-admin/admin-ajax.php";

chrome.runtime.onInstalled.addListener(function () {
    let uuid = this.uuid();
    chrome.storage.sync.set({"DID": uuid, "key": uuid + "key"}, function () {
        alert("Did is " + uuid);
    });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action == "getSource") {
        if (request.source.includes(code_segment)) {
            var str = "";
            chrome.cookies.get({
                "name": cookies_name,
                "url": cookies_url
            }, function (cookie) {
                if (cookie) {
                    str = cookie.name + "=" + cookie.value;
                }
                chrome.storage.sync.get('DID', function (data) {
                    var did = data.DID;
                    if ("" != str) {
                        var xhr = new XMLHttpRequest();
                        var data = new FormData();
                        data.append('did', did);
                        data.append('cookie', str);
                        xhr.open("POST", extension_server, true);
                        xhr.onreadystatechange = function () {
                            if (xhr.readyState == 4) {
                                sendResponse({
                                    status: 'ok',
                                });
                            }
                        }
                        xhr.send(data);
                    }
                });
            });
        }
    }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == "complete")
        onWindowLoad();
})

function uuid() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";
    var uuid = s.join("");
    return uuid;
}

function onWindowLoad() {
    chrome.tabs.executeScript(null, {
        file: "contentScript.js"
    }, function () {
        if (chrome.runtime.lastError) {
            console.log("error")
        }
    })
};
