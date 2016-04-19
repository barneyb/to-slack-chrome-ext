function sendUrl(hook, payload) {
    payload = JSON.stringify(payload);
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {};
    xhr.open("POST", hook, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.send(payload);
}
function rebuild(targets) {
    var json = parseTargets(targets);
    chrome.contextMenus.removeAll();
    for (var n in json) if (json.hasOwnProperty(n)) {
        (function(n, hook) {
            chrome.contextMenus.create({
                title: n + " image",
                contexts: ["image"],
                onclick: function(info, tab) {
                    sendUrl(hook, {
                        text: "<" + info.srcUrl + ">"
                    });
                }
            });
            chrome.contextMenus.create({
                title: n + " link",
                contexts: ["link"],
                onclick: function(info, tab) {
                    sendUrl(hook, {
                        text: "<" + info.linkUrl + ">",
                        unfurl_media: true,
                        unfurl_links: true
                    });
                }
            });
            chrome.contextMenus.create({
                title: n + " page",
                contexts: ["page"],
                onclick: function(info, tab) {
                    sendUrl(hook, {
                        text: "<" + info.pageUrl + ">",
                        unfurl_media: true,
                        unfurl_links: true
                    });
                }
            });
        }(n, json[n]));
    }
}
// listen for changes
chrome.storage.onChanged.addListener(function(changes, area) {
    if (area != 'sync' || ! changes.hasOwnProperty('targets')) {
        return;
    }
    rebuild(changes.targets.newValue);
});
// initialize
chrome.storage.sync.get({
    targets: null
}, function(items) {
    rebuild(items.targets);
});
