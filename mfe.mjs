import * as dummy from "./dummy-window.js"
import * as view from "./source/view.js"
import * as host from "./source/browser.js"
import fs from "fs"
function has_content(value) {
    if (value === null) {
        return false;
    }
    if (value === undefined) {
        return false;
    }
    if (value === "") {
        return false;
    }
    if (Array.isArray(value) && value.length == 0) {
        return false;
    }
    if (value instanceof Object && Object.keys(value).length == 0) {
        return false;
    }
    return true;
}
function typeify(type) {
    if (type.identifier) {
        return type.identifier;
    }
    if (type.name) {
        return type.name;
    }
    if (type.dataType) {
        if (type.shape) {
            if (has_content(type.shape.dimensions)) {
                return `${type.dataType}(${type.shape.dimensions})`
            }
        }
        return `${type.dataType}`
    }
    return type.name;
}
function markdownify_item(item, level, pattern, result) {
    pattern.push(item.name)
    if (item.type == "object" && has_content(item.value)) {
        markdownify_item(item.value, level, pattern, result)
    }
    else if (item.type == "object[]" && has_content(item.value)) {
        for (const value of item.value) {
            markdownify_item(value, level, pattern, result)
        }
    } else if ((item.type == "attribute" || item.type == "boolean") && has_content(item.value)) {
        result.push(`${"  ".repeat(level)}- ${item.name}: ${item.value}`)
    }
    else if (item.type == "string[]" && has_content(item.value)) {
        result.push(`${"  ".repeat(level)}- ${item.name}[\`${typeify(item.type)}\`]: ${item.value}`)
    }
    else if (item.type instanceof Object && item.type.name == "builtins.dict" && has_content(item.inputs)) {
        result.push(`${"  ".repeat(level)}- ${item.name}[\`${typeify(item.type)}\`]:`)
        for (const input of item.inputs) {
            markdownify_item(input, level + 1, pattern, result)
        }
    }
    else if (item.type == null && has_content(item.value)) {
        result.push(`${"  ".repeat(level)}- ${item.name}:`)
        for (const value of item.value) {
            markdownify_item(value, level + 1, pattern, result)
        }
    }
    else if (item.type instanceof Object && has_content(item.inputs)) {
        result.push(`${"  ".repeat(level)}- ${item.name}[\`${typeify(item.type)}\`]:`)
        for (const input of item.inputs) {
            markdownify_item(input, level + 1, pattern, result)
        }
    }
    else if (item.type instanceof Object && item.type.dataType) {
        result.push(`${"  ".repeat(level)}- ${item.name}[\`${typeify(item.type)}\`]`)
    }
    else {
        console.log(item)
    }
    pattern.pop()
}
function markdownify_graph(graph, result) {
    let idx = 0;
    for (const item of graph) {
        result.push(`# Graph ${++idx} `)
        if (item instanceof Object || item instanceof Map) {
            if (item.nodes) {
                let iidx = 0;
                for (const node of item.nodes) {
                    result.push(`## node ${++iidx} `)
                    markdownify_item(node, 0, [node.name], result)
                }

            }
        }
        if (item.inputs) {

        }
        if (item.name) {

        }
        if (item.type) {

        }
    }
}
function markdownify(jsonLike, result = null) {
    if (!result) {
        result = []
    }
    result.push(`- format: ${jsonLike.format} `)
    if (jsonLike.producer)
        result.push(`- producer: ${jsonLike.producer} `)

    result.push(`- identifer: ${jsonLike.identifier} `)
    if (jsonLike.graphs) {
        markdownify_graph(jsonLike.graphs, result)
    }
    return result
}
async function main() {
    let h = new host.Host()
    h.message = async () => { }

    let mfs = new view.ModelFactoryService(h)
    await mfs.import();
    let dummyView = {
        accept: (file, size) => { return mfs.accept(file, size) },
        show: () => { },
        error: (...e) => {
            console.error(...e)
        },
        progress: () => { },
        attach: () => { },
        open: async (context) => {
            const m = await mfs.open(context)
            dummyView.model = m
        }
    }

    await h.view(dummyView)
    // h._meta.file = ["../nvidia_resnet50_200821.pth"]
    h._meta.file = ["../yolo11s.pt"]
    // h._meta.file = ["../resnet18_pretrained.pth"]
    await h.start()
    let model = dummyView.model
    console.log("model loaded")
    const threshold = 200;
    const suffix = " values..."
    let j = JSON.stringify(model, (key, value) => {
        if (typeof value === "bigint") {
            return value.toString()
        }
        if (value instanceof Array) {
            if (value.length > threshold) {
                if (typeof value[0] == "number") {
                    return value.length + suffix
                }
            }
        }
        if (value instanceof Map) {
            if (value.size > threshold) {
                if (!value.name) {
                    return value.size + suffix
                }
            }
        }
        if (value instanceof Object) {
            const l = Object.keys(value).length
            if (l > threshold || key === "_buffer") {
                return l + suffix
            }
        }
        return value;
    })
    console.log("jsonify done")
    fs.writeFileSync("data.json", j, "utf8")
    let markdown = markdownify(JSON.parse(j))
    console.log("markdownify done")
    fs.writeFileSync("data.md", markdown.join("\n"), "utf-8")
}
await main()