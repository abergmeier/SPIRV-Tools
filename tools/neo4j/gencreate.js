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
    return text.replace(/\s/g, "")
}

cypher = "MATCH (n)\nDETACH DELETE n"

function createCypher(prefix, name, label, obj) {
    let ser = JSON.stringify(obj)
    // TODO: properly serialize
    ser = ser.replace("\"name\":", "name: ")
    ser = ser.replace("\"value\":", "value: ")
    cypher += "\nCREATE(" + prefix + name + ":" + label + ser + ")"
}

edges = []

function createEdge(lhs, dependency, rhs) {
    edges.push(function() {
        cypher += "\nCREATE(" + lhs + ")-[" + dependency + "]->(" + rhs + ")"
    })
}

function capabilityColumn(prefix, name, cells, dependency) {
    if (cells.length <= 2)
        return

    let depText = cells[2].textContent.trim()
    let deps = depText.split(",")
    deps.forEach(function(depName) {
        depName = depName.trim()
        if (!depName)
            return

        createEdge(prefix + name, dependency, "C_" + depName)
    })
}

extensionNames = new Set();

function extensionColumn(prefix, name, cells) {
    if (cells.length <= 3)
        return

    let extElements = cells[3].querySelectorAll("strong")
    extElements.forEach(function(extElement) {
        // Extension names are global anyway so no need to prefix
        let extensionName = extElement.textContent
        extensionNames.add(extensionName)
        createEdge(prefix + name, ":ENABLEDBY", extensionName)
    })
}

instructions = {};

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
                if (!cap.textContent)
                    return
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
               createEdge("Inst" + instName, ":NEEDS", "C_" + cap)
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
"#_a_id_execution_mode_a_execution_mode",
"#_a_id_storage_class_a_storage_class",
"#_a_id_dim_a_dim",
"#_a_id_sampler_addressing_mode_a_sampler_addressing_mode",
"#_a_id_sampler_filter_mode_a_sampler_filter_mode",
"#_a_id_image_format_a_image_format",
"#_a_id_image_channel_order_a_image_channel_order",
"#_a_id_image_channel_data_type_a_image_channel_data_type",
].forEach(function(selector) {
    let heading = document.querySelector(selector)
    let section = heading.parentElement
    let table = section.querySelector("table:first-of-type")
    let tableHeaders = table.querySelectorAll("thead tr:first-of-type th")

    let tableHeaderText = tableHeaders[0].textContent
    let text = tableHeaderText.trim()
    let prefix = buildPrefix(text)

    if (prefix.length != 0)
        prefix += "_"

    let cols = [function(name, cells) {
        let label = buildLabel(text)
        createCypher(prefix, name, label, {
            name: name,
            value: parseInt(cells[0].textContent, 10),
        })
    }]
    if (tableHeaders.length > 2) {
        let depHeadingText = tableHeaders[2].textContent.trim()
        if (depHeadingText == "Enabled by Extension")
            cols.push(function(name, cells) {
                extensionColumn(prefix, name, cells)
            })
        else if(depHeadingText == "Extra Operands")
            ; // Ignore
        else
            alert("Unhandled header1 " +  depHeadingText)


    }
    if (tableHeaders.length > 1) {

        let depHeadingText = tableHeaders[1].textContent.trim()
        if (depHeadingText == "Required Capability")
            cols.push(function(name, cells) {
                capabilityColumn(prefix, name, cells, ":REQUIRES")    
            })
        else if(depHeadingText == "Depends On")
            cols.push(function(name, cells) {
                capabilityColumn(prefix, name, cells, ":DEPENDSON")    
            })
        else if(depHeadingText == "Enabling Capabilities")
            cols.push(function(name, cells) {
                capabilityColumn(prefix, name, cells, ":ENABLES")    
            })
        else
            alert("Unhandled header " +  depHeadingText)
    }



    let rows = table.querySelectorAll("tbody tr")
    rows.forEach(function(row) {
        let cells = row.querySelectorAll("td")
        let name = cells[1].querySelector("strong").textContent
        cols.forEach(function(col) {
            col(name, cells)
        })
    })
})

extensionNames.forEach(function(extensionName) {
    createCypher("", extensionName, "Extension", {
        name: extensionName,
    })
})

edges.forEach(function(link) {
    link()
})

cypher
