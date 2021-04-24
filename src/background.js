// todo: instead of posting save json to localstorage
// todo: if global variable autosync is enabled immediately call sync function
// todo: if button is pressed call sync function
// todo: add support for student id
// todo: replace file with proper ta

// receive data from TA content script
chrome.runtime.onMessage.addListener(
    function(requester, sender) {
        if (sender.tab && requester.taReady) { // if from a content script
            // post to server
            fetch('http:///send', {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(requester.json)
            }).then(response => {
                console.log('Request complete with response:', response)
            })
        }
    }
)