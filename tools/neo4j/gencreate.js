function buildPrefix(text) {
    let prefix = ""
    for (let i = 0, len = text.length; i < len; i++) {
        let letter = text[i]
        let lower = letter.toLowerCase()
        let isUpper = (letter != lower)
        if (isUpper)
            prefix += letter
    }
    return prefix
}

function buildLabel(text) {
    return text.replace(" ", "")
}

cypher = ""

function createCypher(prefix, name, label, obj) {
    cypher += "\nCREATE(" + prefix + name + ":" + label + JSON.stringify(obj) + ")"
}

function rowToCypher(prefix, label, row) {
   let cells = row.querySelectorAll("td")
    let name = cells[1].textContent
    createCypher(prefix, name, label, {
        name: name,
        value: cells[0].textContent,
    }) 
}

(function() {
    let heading = document.querySelector("#_a_id_source_language_a_source_language")
    let section = heading.parentElement
    let table = section.querySelector("table:first-of-type")
    let tableHeader = table.querySelector("thead tr:first-of-type th")
    let tableHeaderText = tableHeader.textContent
    let text = tableHeaderText.trim()
    let prefix = buildPrefix(text)
    if (prefix.length != 0)
        prefix += "_"

    let label = buildLabel(text)

    let rows = table.querySelectorAll("tbody tr")
    rows.forEach(function(row) {
        rowToCypher(prefix, label, row)
    })    

    return cypher
})()
