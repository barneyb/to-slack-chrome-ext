// Saves options to chrome.storage.sync.
function save_options() {
    var targets = document.getElementById('targets').value;
    try {
        parseTargets(targets);
    } catch (e) {
        var status = document.getElementById('status');
        status.textContent = 'Illegal targets: ' + e.message;
        setTimeout(function() {
            status.textContent = '';
        }, 750);
        return;
    }
    chrome.storage.sync.set({
        targets: targets
    }, function() {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    chrome.storage.sync.get({
        targets: null
    }, function(items) {
        document.getElementById('targets').value = items.targets;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
