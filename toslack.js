self.importScripts("utils.js");

/*global chrome */
function sendUrl(target, info) {
    console.log("sendUrl", target, info);
    let pt = target.post_type;
    let body = render_template(pt.format, info);
    console.log(`POST /${target.url.split("/")
        .slice(3)
        .join("/")} HTTP/1.1\nHost: ${target.url.split("/")[2]}\nContent-Type: ${pt.content_type}\n\n${body}`)
    return fetch(target.url, {
        method: "POST",
        headers: {
            "Content-Type": pt.content_type,
        },
        mode: "no-cors",
        body,
    }).then(
        r => r.ok
            ? console.log(`${r.status} ${r.statusText}\n\nWoo!`)
            : r.status === 0
                ? console.log(`No CORS, so ... good enough?`)
                : console.log(`${r.status} ${r.statusText}\n\nFailed to post to ${target.url}`),
        e => console.log(`Failed to post to ${target.url}\n\n${e}`),
    );
}

function addContextUrl(ctx, info) {
    switch (ctx) {
        case "page":
        case "frame":
            return {
                url: info.pageUrl,
                ...info,
            }
        case "link":
            return {
                url: info.linkUrl,
                ...info,
            }
        case "audio":
        case "image":
        case "video":
            return {
                url: info.srcUrl,
                ...info,
            }
    }
}

function rebuild(targets) {
    console.log("REBUILD")
    chrome.contextMenus.removeAll();
    const handlers = new Map();
    parseTargets(targets).forEach(target => {
        console.log("TARGET", target)
        for (const ctx of target.contexts) {
            const title = render_template(target.label, {ctx});
            console.log("REGISTER", title, ctx)
            handlers[chrome.contextMenus.create({
                id: `${title}@${ctx}`,
                title,
                contexts: [ctx],
            })] = info => {
                console.log("HANDLE CLICK", info, target)
                sendUrl(target, addContextUrl(ctx, {
                    srcUrl: info.srcUrl,
                    linkUrl: info.linkUrl,
                    pageUrl: info.pageUrl,
                }));
            };
        }
    });
    return handlers;
}

// listen for changes
chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !changes.hasOwnProperty('targets')) {
        return;
    }
    console.log("STORAGE CHANGE")
    rebuild(changes.targets.newValue);
});

// listen for selections
chrome.contextMenus.onClicked.addListener(item => {
    console.log("CLICK", item)
    loadTargetsAndRebuild((handlers) => {
        console.log("CLICK", item, Object.keys(handlers))
        const handler = handlers[item.menuItemId];
        handler && handler(item);
    });
});

function loadTargetsAndRebuild(callback) {
    return chrome.storage.sync.get({
        targets: null,
    }, function (items) {
        const handlers = rebuild(items.targets);
        callback && callback(handlers);
    });
}

// initialize
chrome.runtime.onInstalled.addListener(function () {
    console.log("INSTALLED")
    loadTargetsAndRebuild();
});
