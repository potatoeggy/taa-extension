// hardcoded xpaths are the simplest option
// if ta updates their layout any scraping form would break anyway
const XPATHS = {
    CURRENT_MARK: '/html/body/div/div[3]/div/table[1]/tbody/tr/td[1]/div',
    COURSE_CODE: '/html/body/div/div[1]/div/div/h2',
    ASSIGNMENTS_TABLE: '/html/body/div/div[2]/div/div/table[1]'
}

// for convenience and friendlier names
const HEADER_TO_KEY = {
    'Assignment': 'name',
    'Knowledge / Understanding': 'knowledge',
    'Thinking': 'thinking',
    'Communication': 'communication',
    'Application': 'application',
    'Other/Culminating': 'other'
}

// easier parsing for developers
function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

// convert the odd TA string to a simpler object
function parseScores(string) {
    const scores = string.replace(/[^0-9% ]/g, '').split('  ')
    return {
        mark: parseFloat(scores[0]) || null,
        total: parseFloat(scores[1]) || null,
        weight: parseFloat((scores[2] || '').split('%')[2]) || null
    }
}

// if we didn't 403 or permission denied
if (document.title.includes('Student Report')) {
    const json = {}
    
    // Use decimal representations of percentages
    json['current_mark'] = parseFloat(getElementByXpath(XPATHS.CURRENT_MARK).textContent) / 100

    json['course_code'] = getElementByXpath(XPATHS.COURSE_CODE).textContent
    
    // get an array 
    const rowsDom = getElementByXpath(XPATHS.ASSIGNMENTS_TABLE).getElementsByTagName('TR')
    const assTable = []
    for (let i = 0; i < rowsDom.length; i++) {
        // there are smaller tables that contain only one mark and
        // there are smaller tables that contain all of them, this
        // filters it to only have the ones with all marks
        if (rowsDom[i].children.length <= 1) continue

        // clear excess whitespace and expand TA table format to a normal one
        const cols = Array.from(rowsDom[i].children)
            .map(col => col.textContent.trim() || '')
        assTable.push(cols)
    }

    // create a lookup table for column number to final json key based on table headers
    const titleRow = assTable[0]
    const indexToKey = {}
    for (let i = 0; i < titleRow.length; i++) {
        indexToKey[i] = HEADER_TO_KEY[titleRow[i]] 
    }
    console.log(assTable)
    
    // build final json assignment key
    const assFinal = []
    for (ass of assTable) {
        if (ass[0] === 'Assignment') continue
        const assFormatted = {}
        assFormatted['name'] = ass[0]
        for (let i = 1; i < ass.length; i++) {
            assScore = parseScores(ass[i])
            assFormatted[indexToKey[i]] = assScore.mark != null ? [assScore.mark, assScore.total] : null
            assFormatted[`${indexToKey[i]}_weight`] = assScore.weight
        }
        assFinal.push(assFormatted)
    }
    json['assignments'] = assFinal

    // send completed json to backend
    chrome.runtime.sendMessage({taReady: true, json: json})
}