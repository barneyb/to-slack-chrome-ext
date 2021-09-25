/*global chrome */
function sendUrl(target, info) {
    console.log("sendUrl", target, info);
    let origin = target.url.split("/").slice(0, 3).join("/") + "/";
    withPermissions({
        origins: [origin],
    }, function () {
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
            body,
        }).then(
            r => r.ok
                ? writeBothPlaces(`${r.status} ${r.statusText}\n\nWoo!`)
                : writeBothPlaces(`${r.status} ${r.statusText}\n\nFailed to post to ${target.url}`),
            e => writeBothPlaces(`Failed to post to ${target.url}\n\n${e}`),
        );
    });
}

/**
 * If work returns a thenable, perms will be left in place until it resolves.
 */
function withPermissions(perms, work) {
    console.log("  check perms", perms)
    const cleanup = () => {
        console.log("  remove perms", perms)
        return browser.permissions.remove(perms, removed => {
            console.log(removed ? "  success!" : "  failed to remove")
        });
    };
    const doit = () => {
        const result = work();
        if (result && typeof result.then === "function") {
            result.then(cleanup, cleanup);
        } else {
            cleanup();
        }
        return result;
    }
    return new Promise((resolve, reject) => {
        browser.permissions.contains(perms, function (granted) {
            if (granted) {
                console.log("  perms already granted")
                resolve(doit());
            } else {
                console.log("  request perms", perms);
                browser.permissions.request(perms, function (granted) {
                    if (granted) {
                        console.log("  perms granted")
                        resolve(doit());
                    } else {
                        writeBothPlaces(`denied permission for ${origin}.`)
                        reject("permission denied");
                    }
                });
            }
        });
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
    browser.contextMenus.removeAll();
    handlers.clear();
    parseTargets(targets).forEach(target => {
        for (const ctx of target.contexts) {
            handlers[browser.contextMenus.create({
                id: next_val(),
                title: render_template(target.label, {ctx}),
                contexts: [ctx],
            })] = info => {
                console.log("CLICK", info, target)
                sendUrl(target, addContextUrl(ctx, {
                    srcUrl: info.srcUrl,
                    linkUrl: info.linkUrl,
                    pageUrl: info.pageUrl,
                }));
            };
        }
    })
}

// listen for changes
browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !changes.hasOwnProperty('targets')) {
        return;
    }
    rebuild(changes.targets.newValue);
});

// listen for selections
browser.contextMenus.onClicked.addListener(item => {
    const handler = handlers[item.menuItemId];
    handler && handler(item);
});

// initialize
browser.runtime.onInstalled.addListener(function () {
    browser.storage.sync.get({
        targets: null,
    }, function (items) {
        rebuild(items.targets);
    });
});
