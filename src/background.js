chrome.runtime.onMessage.addListener(
    function(requester, sender) {
        if (sender.tab && requester.taReady) { // if from a content script
            // post to server
            fetch('/url', {
                method: 'POST',
                body: JSON.stringify(requester.json)
            }).then(response => {
                console.log('Request complete with response:', response)
            })
        }
    }
)