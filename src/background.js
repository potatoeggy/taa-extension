// todo: instead of posting save json to localstorage
// todo: if global variable autosync is enabled immediately call sync function
// todo: if button is pressed call sync function
// todo: add support for student id
// todo: replace file with proper ta

const deleteUrl = 'http://6b04e3e4c301.ngrok.io/delete'
const pushUrl = 'http://6b04e3e4c301.ngrok.io/send'

function post(url, json) {
    fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(json)
    }).then(response => {
        console.log('Request complete with response:', response)
    })
}

// receive data from TA content script
chrome.runtime.onMessage.addListener(
    function(requester, sender) {
        if (sender.tab && requester.taReady) { // if from a content script
            // check for localstorage
            post(deleteUrl, requester.json)
        }

        if (requester.deleteData) {

        }
    }
)