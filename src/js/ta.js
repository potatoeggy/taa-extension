const XPATHS = { // hardcoded xpaths are the simplest option
    CURRENT_MARK: "/html/body/div/div[3]/div/table[1]/tbody/tr/td[1]/div",
    COURSE_CODE: "/html/body/div/div[1]/div/div/h2",
    ASSIGNMENTS_TABLE: "/html/body/div/div[2]/div/div/table[1]"
}

function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}


if (document.title.includes("Student Report")) { // if we didn't 403 or permission denied
    var json = {}
    json["current_mark"] = parseFloat(getElementByXpath(XPATHS.CURRENT_MARK).textContent) / 100
    json["course_code"] = getElementByXpath(XPATHS.COURSE_CODE).textContent
    
    chrome.runtime.sendMessage({taReady: true, json: json})
}