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

cypher = "MATCH (n)\nDETACH DELETE n"

function createCypher(prefix, name, label, obj) {
    let ser = JSON.stringify(obj)
    // TODO: properly serialize
    ser = ser.replace("\"name\":", "name: ")
    ser = ser.replace("\"value\":", "value: ")
    cypher += "\nCREATE(" + prefix + name + ":" + label + ser + ")"
}

function createEdge(lhs, dependency, rhs) {
    cypher += "\nCREATE(" + lhs + ")-[" + dependency + "]->(" + rhs + ")"
}

edges = []

function rowToCypher(prefix, cells, depCol) {
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
                edges.push(function(){
                    createEdge(prefix + name, ":REQUIRES", "C_" + depName)
                })
            else if(depCol == "deps")
                edges.push(function() {
                    createEdge(prefix + name, ":DEPENDSON", "C_" + depName)
                })
        })
    }
}

instructions = {};
linkers = [];

[
"#_a_id_instructions_a_instructions",
].forEach(function(selector) {
    let heading = document.querySelector(selector)
    let section = heading.parentElement
    let subSections = section.querySelectorAll(".sect3")
    subSections.forEach(function(subSection) {
        let tables = subSection.querySelectorAll("table")
        tables.forEach(function(table) {
            let tbody = table.querySelector("tbody")
            let tr = tbody.querySelector("tr")
            let text = tr.querySelector("td p")
            let caps = tr.querySelectorAll("td:nth-of-type(2) p strong")
            let capabilities = []
            caps.forEach(function(cap) {
                capabilities.push(cap.textContent)
            })
            let link = text.querySelector("a")
            let linkId = link.id
            let instName = text.querySelector("strong").textContent
            instructions[linkId] = table
            let opContent = tbody.querySelector("tr:nth-of-type(2) td:nth-of-type(2)").textContent
            let opCode = parseInt(opContent)
            createCypher("Inst", instName, "Instruction", {
                name: instName,
                value: opCode,
            })
            capabilities.forEach(function(cap) {
                edges.push(function() {
                    createEdge("Inst" + instName, ":NEEDS", "C_" + cap)
                })
            }) 
        })
    })
}); // WTF do I need a ; here?

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
    rows.forEach(function(row) {
        let cells = row.querySelectorAll("td")
        let name = cells[1].querySelector("strong").textContent
        createCypher(prefix, name, label, {
            name: name,
            value: parseInt(cells[0].textContent, 10),
        })

        linkers.push(function() {
            rowToCypher(prefix, cells, depCol)
        })
    }) 

    linkers.forEach(function(linker) {
        linker()
    })
})

edges.forEach(function(link) {
    link()
})

cypher
