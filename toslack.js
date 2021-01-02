/*global chrome */
function sendUrl(target, info) {
    let origin = target.url.split("/").slice(0, 3).join("/") + "/";
    chrome.permissions.request({
        origins: [origin]
    }, function(granted) {
        if (granted) {
            let pt = target.post_type;
            let body = render_body(pt.format, info);
            fetch(target.url, {
                method: "POST",
                headers: {
                    "Content-Type": pt.content_type,
                },
                body,
            })
                .then(r => {
                    if (!r.ok) {
                        alert(`${r.status} ${r.statusText}\n\nFailed to post to ${target.url}`)
                    }
                })
                .catch(e => alert(`Failed to post to ${target.url}\n\n${e}`));
        }
    });
}

const handlers = new Map();

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
    const json = parseTargets(targets);
    chrome.contextMenus.removeAll();
    handlers.clear();
    Object.keys(json)
        .map(k => ({
            label: k,
            ...json[k],
        }))
        .forEach(target => {
            for (const ctx of target.contexts) {
                handlers[chrome.contextMenus.create({
                    id: next_val(),
                    title: `Send ${ctx} to ${target.label}`,
                    contexts: [ctx],
                })] = info => sendUrl(target, addContextUrl(ctx, {
                    srcUrl: info.srcUrl,
                    linkUrl: info.linkUrl,
                    pageUrl: info.pageUrl,
                }));
            }
        })
}

// listen for changes
chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || ! changes.hasOwnProperty('targets')) {
        return;
    }
    rebuild(changes.targets.newValue);
});

// listen for selections
chrome.contextMenus.onClicked.addListener(item => {
    const handler = handlers[item.menuItemId];
    handler && handler(item);
});

// initialize
chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.get({
        targets: null
    }, function(items) {
        rebuild(items.targets);
    });
});
