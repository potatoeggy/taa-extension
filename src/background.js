chrome.runtime.onMessage.addListener(
    function(requester, sender) {
        if (sender.tab && requester.taReady) { // if from a content script
            console.log(requester.json) // TODO: add push
        }
    }
)