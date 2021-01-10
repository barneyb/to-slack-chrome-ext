/*global chrome */
let statusTimeout;

function showStatus(msg) {
    const status = $('status');
    status.textContent = msg;
    clearTimeout(statusTimeout);
    statusTimeout = setTimeout(function () {
        status.textContent = '';
    }, 2500);
}

// Saves options to chrome.storage.sync.
function save_options() {
    const textarea = $('targets');
    let targets = textarea.value;
    try {
        parseTargets(targets);
    } catch (e) {
        showStatus("Illegal targets: " + e.message);
        return;
    }
    // reformat
    let indent = 2;
    let match = targets.trim().match(/\n +/);
    if (match.index >= 0) {
        indent = match[0].length - 1;
    }
    targets = JSON.stringify(JSON.parse(targets), null, indent);
    textarea.value = targets;
    chrome.storage.sync.set({
        targets: targets,
    }, function () {
        showStatus("Targets saved.");
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    chrome.storage.sync.get({
        targets: null,
    }, function (items) {
        $('targets').value = items.targets;
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
$('save').addEventListener('click', save_options);

function formatJson(obj) {
    return JSON.stringify(obj, null, 4);
}

function expandConfig(srcId, destId) {
    try {
        const expanded = formatJson(parseTargets($(srcId).innerText));
        if (expanded !== formatJson(parseTargets(expanded))) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error("Expansion was not idempotent!");
        }
        $(destId).innerText = expanded;
    } catch (e) {
        console.log(e)
        $(destId).innerText = e;
    }
}

expandConfig('example', 'full-example');

const config = parseTargets('{"glerg":' + $('custom-example').innerText + '}')[0];
let rendered;
try {
    rendered = render_template(config.post_type.format, {
        url: "https://about.google/",
        pageUrl: "https://google.com/",
    });
    rendered = 'POST ...\n' +
        'Host: ...\n' +
        'Content-Type: ' + config.post_type.content_type + '\n' +
        '\n' +
        formatJson(JSON.parse(rendered));
} catch (e) {
    rendered = e;
}
$('custom-render').innerText = rendered;
