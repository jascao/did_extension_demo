'use strict';
var didAuth = require('@decentralized-identity/did-auth-jose');

var cookies_name = "APID";
var cookies_url = "https://advertising.com/";
var extension_server = "http://localhost:8081/extension/match";
var code_segment = "<link rel=\"publisher\" href=\"https://plus.google.com/+zulily\"";

chrome.runtime.onInstalled.addListener(function () {
    // let uuid;
    // chrome.storage.sync.get('DID', function (data) {
    //     let stored_uuid = data.DID;
    //     if (stored_uuid) {
    //         uuid = stored_uuid;
    //     } else {
    //         uuid = this.uuid();
    //     }
    //     chrome.storage.sync.set({"DID": uuid, "key": uuid + "key"}, function () {
    //         alert("Did is " + uuid);
    //     });
    // });

    chrome.storage.sync.get('DID', function (data) {
        let stored_uuid = data.DID;
        if (stored_uuid) {
            uuid = stored_uuid;
        } else {
            createDid();
        }
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

async function createJwk() {
    const kid = '#key-1';
    const privKey = await didAuth.EcPrivateKey.generatePrivateKey(kid);
    const pubKey = privKey.getPublicKey();
    pubKey.defaultSignAlgorithm = 'ES256K';

    return {"jwkPriv": privKey, "jwkPub": pubKey};
}

async function createDid() {
    const jwk = await createJwk();
    const jwkPriv = jwk.jwkPriv;
    const jwkPub = jwk.jwkPub;
    const kid = '#key-1';
    const privKey = await didAuth.EcPrivateKey.generatePrivateKey(kid);
    const pubKey = privKey.getPublicKey();
    pubKey.defaultSignAlgorithm = 'ES256K';

    const privateKey = didAuth.EcPrivateKey.wrapJwk(jwkPriv.kid, jwkPriv);

    const body = {
        "@context": "https://w3id.org/did/v1",
        publicKey: [
            {
                id: jwkPub.kid,
                type: "Secp256k1VerificationKey2018",
                publicKeyJwk: jwkPub
            }
        ],
        service: [
            {
                id: "IdentityHub",
                type: "IdentityHub",
                serviceEndpoint: {
                    "@context": "schema.identity.foundation/hub",
                    "@type": "UserServiceEndpoint",
                    instance: [
                        "did:test:hub.id",
                    ]
                }
            }
        ],
    };

    const header = {
        alg: jwkPub.defaultSignAlgorithm,
        kid: jwkPub.kid,
        operation:'create',
        proofOfWork:'{}'
    };

    const cryptoFactory = new didAuth.CryptoFactory([new didAuth.Secp256k1CryptoSuite()]);
    const jwsToken = new didAuth.JwsToken(body, cryptoFactory);
    const signedBody = await jwsToken.signAsFlattenedJson(privateKey, {header});

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://beta.ion.microsoft.com/api/1.0/register", true);
    xhr.setRequestHeader("Content-type","application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            var resp = JSON.parse(xhr.responseText);
            let did = resp.id;
            chrome.storage.sync.set({"DID": did}, function () {
                alert(did);
            });
        }
    }
    xhr.send(JSON.stringify(signedBody));
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
