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
    let ser = JSON.stringify(obj)
    // TODO: properly serialize
    ser = ser.replace("\"name\":", "name: ")
    ser = ser.replace("\"value\":", "value: ")
    cypher += "\nCREATE(" + prefix + name + ":" + label + ser + ")"
}

function createEdge(lhs, rhs) {
    cypher += "\nCREATE(" + lhs + ")-[:REQUIRES]->(" + rhs + ")"
}

function rowToCypher(prefix, label, row, depCol) {
    let cells = row.querySelectorAll("td")
    let name = cells[1].querySelector("strong").textContent
    createCypher(prefix, name, label, {
        name: name,
        value: parseInt(cells[0].textContent, 10),
    })

    if (cells.length == 2)
        return function() { 
        }
    
    return function() {
        let depText = cells[2].textContent.trim()
        let deps = depText.split(",")
        deps.forEach(function(depName) {
            depName = depName.trim()
            if (!depCol || !depName)
                return

            if (depCol == "caps")
                createEdge(prefix + name, "C_" + depName)
            else if(depCol == "deps")
                createEdge(prefix + name, "C_" + depName)
        })
    }
}

[
"#_a_id_capability_a_capability",
"#_a_id_source_language_a_source_language",
"#_a_id_execution_model_a_execution_model",
"#_a_id_addressing_model_a_addressing_model",
"#_a_id_memory_model_a_memory_model",
].forEach(function(selector) {
    let heading = document.querySelector(selector)
    let section = heading.parentElement
    let table = section.querySelector("table:first-of-type")
    let tableHeaders = table.querySelectorAll("thead tr:first-of-type th")

    let depCol = null
    if (tableHeaders.length > 1) {
        let depHeadingText = tableHeaders[1].textContent
        if (depHeadingText == "Required Capability")
            depCol = "caps"
        else
            depCol = "deps"
    }

    let tableHeaderText = tableHeaders[0].textContent
    let text = tableHeaderText.trim()
    let prefix = buildPrefix(text)
    if (prefix.length != 0)
        prefix += "_"

    let label = buildLabel(text)

    let rows = table.querySelectorAll("tbody tr")
    let linkers = []
    rows.forEach(function(row) {
        linkers.push(rowToCypher(prefix, label, row, depCol))
    }) 

    linkers.forEach(function(linker) {
        linker()
    })
})

cypher

