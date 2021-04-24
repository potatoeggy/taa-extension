chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const url = tabs[0].url
    if (url.startsWith('https://ta.yrdsb.ca/live/students/viewReport.php?')) {
        document.getElementById('go-to-ta').style.display='hidden'
        console.log('go!')
    }
    console.log('nogo')
})