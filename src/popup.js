chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const url = tabs[0].url
    if (url.startsWith('https://ta.yrdsb.ca/live/students/viewReport.php?')) {
        // disable warning text and enable buttons
        document.getElementById('go-to-ta').style.display='none'
        for (butt of document.getElementsByTagName('button')) {
            butt.disabled = false
        }
    }
    console.log('nogo')
})

