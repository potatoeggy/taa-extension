const USER_URL = 'http://127.0.0.1:8000/user/'
const HOME_URL = 'http://127.0.0.1:8000'

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const url = tabs[0].url
    if (url.startsWith('https://ta.yrdsb.ca/live/students/viewReport.php?')) {
        // disable warning text and enable buttons
        document.getElementById('go-to-ta').style.display='none'
        for (butt of document.getElementsByTagName('button')) {
            butt.disabled = false
        }
    }
})

async function sha256(string) {
    // encode as utf-8
    const msgBuffer = new TextEncoder('utf-8').encode(string)

    // hash it
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer)

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer))

    // byte array to hex string
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    return hashHex
}

function sync() {
    chrome.runtime.sendMessage({syncNow: true})
    const lastSynced = document.getElementById('last-synced')
    const lastSyncedString = new Date().toLocaleString()
    chrome.runtime.sendMessage({lastSynced: lastSyncedString})
    lastSynced.innerHTML = lastSyncedString
}

function deleteData() {
    chrome.runtime.sendMessage({deleteData: true})
    const lastSynced = document.getElementById('last-synced')
    chrome.runtime.sendMessage({lastSynced: 'never'})
    lastSynced.innerHTML = 'never'
}

function gotoStats() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        // parse url and get student id
        var studentId = null
        for (p of tabs[0].url.split('&')) {
            const pair = p.split('=')
            if (decodeURIComponent(pair[0]) == 'student_id') {
                studentId = decodeURIComponent(pair[1])
                break
            }
        }
        
        // hash and open new tab to user-specific links page
        if (studentId != null) {
            sha256(studentId).then(
                (hashedId) => {
                    // load user page
                    chrome.tabs.create({ url: `${USER_URL}${hashedId}` })
                }
            ).catch((err) => {
                // redirect to home page
                chrome.tabs.create({ url: HOME_URL})
            })
        }
    })
}

function setAutosync() {
    const checkbox = document.getElementById('autosync-box')
    chrome.runtime.sendMessage({setAutosync: true, autosync: checkbox.checked})
}

document.getElementById('sync-button').onclick = sync
document.getElementById('delete-button').onclick = deleteData
document.getElementById('view-button').onclick = gotoStats

// check checkbox if already checked
const autosyncBox = document.getElementById('autosync-box')
autosyncBox.onclick = setAutosync
chrome.storage.sync.get('autosync', (result) => { autosyncBox.checked = result.autosync })

// load last synced
const lastSyncedText = document.getElementById('last-synced')
chrome.storage.sync.get('lastSynced', (result) => { lastSyncedText.innerHTML = result.lastSynced || 'never' })
