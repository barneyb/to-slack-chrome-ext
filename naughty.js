function sendUrl(payload) {
    payload = JSON.stringify(payload);
    console.log("sending", payload);
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {};
    xhr.open("POST", "https://hooks.slack.com/services/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", true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.send(payload);
}
chrome.contextMenus.create({
    title: "Send image to #naughty",
    contexts: ["image"],
    onclick: function(info, tab) {
        sendUrl({
            text: "<" + info.srcUrl + ">"
        });
    }
});
chrome.contextMenus.create({
    title: "Send link to #naughty",
    contexts: ["link"],
    onclick: function(info, tab) {
        sendUrl({
            text: "<" + info.linkUrl + ">",
            unfurl_media: true,
            unfurl_links: true
        });
    }
});
chrome.contextMenus.create({
    title: "Send page to #naughty",
    contexts: ["page"],
    onclick: function(info, tab) {
        sendUrl({
            text: "<" + info.pageUrl + ">",
            unfurl_media: true,
            unfurl_links: true
        });
    }
});
