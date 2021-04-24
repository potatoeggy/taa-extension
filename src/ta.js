// hardcoded xpaths are the simplest option
// if ta updates their layout any scraping form would break anyway
const XPATHS = {
    COURSE_CODE: '/html/body/div/div[1]/div/div/h2',
}

const SELECTORS = {
    CURRENT_MARK: 'div[style="font-family:\'Alfa Slab One\', Arial, serif;font-weight:400;font-size:64pt;color:#eeeeee;"]',
    COURSE_MARK: 'div[style="font-family:\'Alfa Slab One\', Arial, serif;font-weight:400;font-size:64pt;color:#000000;"]',
    ASSIGNMENTS_TABLE: 'table[width="100%"]'
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
    const scores = string.replace(/[^0-9\.% ]/g, '').split('  ')
    return {
        mark: parseFloat(scores[0]) || null,
        total: parseFloat(scores[1]) || null,
        weight: parseFloat((scores[2] || '').split('%')[1]) || null
    }
}

// parse url and get student id
async function parseStudentId() {
    const query = window.location.search.substring(1)
    var studentId = null

    // parse it from the URI
    for (p of query.split('&')) {
        const pair = p.split('=')
        if (decodeURIComponent(pair[0]) == 'student_id') {
            studentId = decodeURIComponent(pair[1])
            break
        }
    }

    // no student id found
    if (studentId == null) {
        return null
    }

    // hash it
    return sha256(studentId)
}

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

function main(studentId) {
    // if null
    if (!studentId) return

    const json = {}
    json['student_id'] = studentId

    // prefer course mark over term mark
    const current_mark = document.querySelector(SELECTORS.COURSE_MARK) || document.querySelector(SELECTORS.CURRENT_MARK)
    
    // Use decimal representations of percentages
    json['current_mark'] = parseFloat(current_mark?.textContent) / 100 || null

    json['course_code'] = getElementByXpath(XPATHS.COURSE_CODE).textContent
    
    // get an array 
    const rowsDom = document.querySelector(SELECTORS.ASSIGNMENTS_TABLE).getElementsByTagName('TR')
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
    
    // build final json assignment key
    const assFinal = []
    for (ass of assTable) {
        if (ass[0] === 'Assignment') continue
        const assFormatted = {}
        assFormatted['name'] = ass[0]
        for (let i = 1; i < ass.length; i++) {
            assScore = parseScores(ass[i])
            assFormatted[indexToKey[i]] = assScore.total != null ? [assScore.mark, assScore.total] : null
            assFormatted[`${indexToKey[i]}_weight`] = assScore.weight
        }
        assFinal.push(assFormatted)
    }
    json['assignments'] = assFinal
    console.log(json)

    // send completed json to backend
    if (json['student_id']) {
        chrome.runtime.sendMessage({taReady: true, json: json})
    }
}

// if we didn't 403 or permission denied
if (document.title.includes('Student Report')) {
    parseStudentId().then(
        (studentId) => { main(studentId) }
    ).catch(
        (err) => { console.log(err) }
    )
}