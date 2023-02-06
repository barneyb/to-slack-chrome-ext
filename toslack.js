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
        body,
    }).then(
        r => r.ok
            ? writeBothPlaces(`${r.status} ${r.statusText}\n\nWoo!`)
            : writeBothPlaces(`${r.status} ${r.statusText}\n\nFailed to post to ${target.url}`),
        e => writeBothPlaces(`Failed to post to ${target.url}\n\n${e}`),
    );
}

/**
 * If work returns a thenable, perms will be left in place until it resolves.
 */
function withPermissions(perms, work) {
    console.log("  check perms", perms)
    const cleanup = () => {
        console.log("  DON'T remove perms", perms)
        // return browser.permissions.remove(perms, removed => {
        //     console.log(removed ? "  success!" : "  failed to remove")
        // });
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
    return browser.permissions.request(perms)
        .then(function (granted) {
            if (granted) {
                console.log("  perms granted")
                return doit();
            } else {
                writeBothPlaces(`denied permission for ${origin}.`)
                throw "permission denied";
            }
        });
    // return new Promise((resolve, reject) => {
    //     browser.permissions.contains(perms, function (granted) {
    //         if (granted) {
    //             console.log("  perms already granted")
    //             resolve(doit());
    //         } else {
    //             console.log("  request perms", perms);
    //             browser.permissions.request(perms, function (granted) {
    //                 if (granted) {
    //                     console.log("  perms granted")
    //                     resolve(doit());
    //                 } else {
    //                     writeBothPlaces(`denied permission for ${origin}.`)
    //                     reject("permission denied");
    //                 }
    //             });
    //         }
    //     });
    // });
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
    browser.contextMenus.removeAll();
    parseTargets(targets).forEach((target, i) => {
        for (const ctx of target.contexts) {
            browser.contextMenus.create({
                id: `${i}:${ctx}:${target.url}`,
                title: render_template(target.label, { ctx }),
                contexts: [ ctx ],
            });
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
    const [ i, ctx, ...rest ] = item.menuItemId.split(":");
    const url = rest.join(":");
    console.log("CLICK", item, ctx, url)
    let origin = url.split("/").slice(0, 3).join("/") + "/";
    withPermissions({
        origins: [ origin ],
    }, function () {
        return new Promise(resolve => {
            browser.storage.sync.get({
                targets: null,
            }, function (items) {
                const targets = parseTargets(items.targets);
                if (i >= targets.length) {
                    console.log("Bad index", i, targets)
                    return;
                }
                const target = targets[i];
                if (target.url !== url) {
                    console.log("Bad url", url, target)
                    return;
                }
                sendUrl(target, addContextUrl(ctx, {
                    srcUrl: item.srcUrl,
                    linkUrl: item.linkUrl,
                    pageUrl: item.pageUrl,
                }));
                resolve();
            });
        });
    });
});

// initialize
browser.runtime.onInstalled.addListener(function () {
    browser.storage.sync.get({
        targets: null,
    }, function (items) {
        rebuild(items.targets);
    });
});
