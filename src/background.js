const DELETE_URL = 'http://127.0.0.1:8000/delete'
const PUSH_URL = 'http://127.0.0.1:8000/send'

function post(url, json) {
    fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(json)
    }).then(response => {
        console.log('Request complete with response:', response)
    })
}

function syncData(deleteData) {
    console.log('syncing with delete: ' + deleteData)
    chrome.storage.local.get('data', (result) => {
        if (!result.data) return
        post((deleteData ? DELETE_URL : PUSH_URL), result.data)
        chrome.storage.sync.set({ lastSynced: new Date().toLocaleString() })
        chrome.storage.local.set({'data' : null})
    })
}

// receive data from TA content script
chrome.runtime.onMessage.addListener(
    function(requester, sender) {
        if (sender.tab && requester.taReady && requester.json) { // if from a content script
            // put data in storage regardless
            chrome.storage.local.set({data: requester.json})

            // if autosync is enabled fire it off
            chrome.storage.sync.get('autosync', function (result) {
                if (result.autosync) {
                    syncData(false)
                }
            })
        } else if (requester.syncNow) {
            syncData(false)
        } else if (requester.deleteData) {
            syncData(true)
        } else if (requester.setAutosync) {
            chrome.storage.sync.set({autosync: requester.autosync})
        } else if (requester.lastSynced) {
            chrome.storage.sync.set({lastSynced: requester.lastSynced})
        }
    }
)
