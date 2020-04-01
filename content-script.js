document.getElementById('opener').addEventListener("click", function () {
    chrome.storage.sync.get('DID', function (data) {
        var did = data.DID;
        edit(did + '');
    })
}, false);

async function edit(did) {
    document.getElementById('DIDkey').value = did
    document.getElementById('DIDkeyDisplay').value = did.substring(0, 15)
}
