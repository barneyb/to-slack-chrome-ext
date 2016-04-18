PREFIX = "https://hooks.slack.com/";

function parseTargets(str) {
    if (str == null) {
        return {};
    }
    str = str.trim();
    if (str == '') {
        return {};
    }
    var json = JSON.parse(str);
    for (var n in json) {if (json.hasOwnProperty(n)) {
        var t = json[n];
        if (typeof t != "string") {
            throw new Error("invalid target value type (must be String)")
        }
        var prefix = t.substr(0, PREFIX.length);
        if (prefix != PREFIX) {
            throw new Error("Invalid target prefix (" + prefix + ")")
        }
    }}
    return json;
}
