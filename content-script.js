document.getElementById('opener').addEventListener("click", function () {
    chrome.storage.sync.get('DID', function (data) {
        var did = data.DID;
        edit(did + '');
    })
}, false);

async function edit(did) {
    document.getElementById('DIDkey').value = did
    document.getElementById('DIDkeyDisplay').innerText = did.substring(13, 36)
}
