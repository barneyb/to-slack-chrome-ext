let id_seq = 0;
const next_val = () => (++id_seq).toString()

const $ = id => document.getElementById(id)

const KNOWN_CONTEXTS = ["page", "frame", "link", "image", "video", "audio"];

function writeBothPlaces(message) {
    console.log(message);
    alert(message);
}

function parseTargets(str) {
    if (str == null) {
        return [];
    }
    str = str.trim();
    if (str === "") {
        return [];
    }
    let json = JSON.parse(str);
    if (!(json instanceof Array)) {
        json = Object.keys(json).map(key => {
            let target = json[key];
            if (typeof target === "string") {
                target = {
                    post_type: "slack",
                    url: target,
                };
            }
            if (!target.label) {
                target.label = "Send $ctx to $key"
            }
            return {
                ...target,
                label: render_template(target.label, {key}),
            };
        });
    }
    return json.map(target => {
        if (typeof target === "string") {
            target = {
                post_type: "slack",
                url: target,
            };
        }
        if (!target.label) {
            const parts = target.url.split("/");
            target.label = "Send $ctx to " + (parts.find(p => p.charAt(0) === "T") || parts[parts.length - 1]);
        }
        if (!target.contexts) {
            target.contexts = ["page", "link", "media"];
        }
        const idx = target.contexts.indexOf("media");
        if (idx >= 0) {
            target.contexts.splice(idx, 1, "image", "video", "audio");
        }
        for (const ctx of target.contexts) {
            if (KNOWN_CONTEXTS.indexOf(ctx) < 0) {
                throw new Error(`Invalid '${ctx}' context for target ${n}`);
            }
        }
        if (target.post_type === "slack") {
            target.post_type = {
                format: "{\"text\":\"<$url>\",\"unfurl_media\":true,\"unfurl_links\":true}",
                content_type: "application/json",
            };
        } else if (!target.post_type || target.post_type === "raw") {
            target.post_type = {
                format: "$url",
            }
        }
        if (!target.post_type.content_type) {
            target.post_type.content_type = "text/plain";
        }
        return target;
    });
}

function render_template(format, model) {
    if (!format) return model.url;
    const RE = new RegExp("\\$(" + Object.keys(model).join("|") + ")", "g");
    return format.replace(RE, (_, g1) => model[g1]);
}

