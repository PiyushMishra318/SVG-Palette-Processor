const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');
var Color = require('color');
// verify the input file argument
if (process.argv[2]) {
    fs.exists(__dirname + "/" + `${process.argv[2]}`, (bool) => {
        if (bool) {
            var svg = fs.readFileSync(__dirname + "/" + `${process.argv[2]}`);
            var dom = new JSDOM(svg);
            var solid_cols = findSolidColorSvgElems(dom.window.document);
            var { fills, strokes } = solid_cols;
            var gradients = findGradientColorsSvgElems(dom.window.document);
            var { stops } = gradients;
            var svg_elem = dom.window.document.getElementsByTagName('svg')[0];
            svg_elem.removeAttribute("width");
            svg_elem.removeAttribute("height");
            var updated_svg_path = "updated_svg.svg";
            fs.writeFileSync(updated_svg_path, svg_elem.outerHTML);
            fs.writeFileSync("svg_json.json", JSON.stringify({ fills, strokes, stops }))
            console.log({
                output_svg: __dirname + "\\" + updated_svg_path,
                output_json: __dirname + "\\" + "svg_json.json"
            });
        }
        else {
            console.log("Invalid file Path");
        }
    });
} else {
    console.log("Pass the file path as the third argument\n");
    console.log("For eg: node index input.svg (input.svg exists in the root folder)");
}

var solid_col_tag_list = [
    "altGlyph",
    "circle",
    "ellipse",
    "path",
    "polygon",
    "polyline",
    "rect",
    "text",
    "textPath",
    "tspan",
    "animate",
    "animateMotion",
    "animateTransform",
    "set",
    "tref"
]

var gradient_tag_list = [
    "linearGradient",
    "radialGradient"
]


// find all the gradients present in the svg
function findGradientColorsSvgElems(document) {
    var result_stops = [];
    var i = 0;
    var j = 0;
    gradient_tag_list.forEach((tag) => {
        var gradients = document.getElementsByTagName(tag);
        for (var gradient of gradients) {
            var stops = gradient.getElementsByTagName("stop")
            if (stops && stops.length > 0) {
                var stop_list = []
                for (var stop of stops) {
                    if (stop.hasAttribute("stop-color")
                        && stop.getAttribute("stop-color") != "none"
                        && stop.getAttribute("stop-color") != ""
                        && !stop.getAttribute("stop-color").includes("url")) {
                        var id = `stop${++j}`;
                        var check = checkForExist(tag, convertToRGBA(stop.getAttribute("stop-color")), stop_list)
                        if (!check.hasOwnProperty("id")) {
                            stop.setAttribute("id", id);
                            stop_list.push({
                                id: id,
                                color: convertToRGBA(stop.getAttribute("stop-color"))
                            });
                        } else {
                            stop.setAttribute("id", check.id)
                            console.log(`${check.id} has same color as a previous ${tag}`);
                        }
                    } else if (stop.style['stop-color']
                        && stop.style.getPropertyValue("stop-color") != ""
                        && stop.style.getPropertyValue("stop-color") != "none"
                        && !stop.style.getPropertyValue("stop-color").includes("url")) {
                        var id = `stop${++j}`;
                        var check = checkForExist(tag, convertToRGBA(stop.style.getPropertyValue("stop-color")), stop_list)
                        if (!check.hasOwnProperty("id")) {
                            stop.setAttribute("id", id);
                            stop_list.push({
                                id: id,
                                color: convertToRGBA(stop.style.getPropertyValue("stop-color"))
                            });
                        } else {
                            stop.setAttribute("id", check.id)
                            console.log(`${check.id} has same color as a previous ${tag}`);
                        }
                    } else {
                        console.log(`${tag}${++j} has no color`);
                    }
                }
                if (stop_list.length > 0) {
                    result_stops.push({
                        id: gradient.getAttribute("id"),
                        stops: stop_list
                    });
                }
            } else {
                console.log(`${gradient.getAttribute("id")} has no stop(s)`)
            }
        }
    })
    return { stops: result_stops }
}


// find all the unique solid colors from the svg
function findSolidColorSvgElems(document) {
    var fills = [],
        strokes = [];
    var i = 0;
    solid_col_tag_list.forEach((tag) => {
        var elems = document.getElementsByTagName(tag)
        for (var elem of elems) {
            // can be improved furthur
            if (elem.hasAttribute("fill")
                && elem.getAttribute("fill") != "none"
                && elem.getAttribute("fill") != ""
                && !elem.getAttribute("fill").includes("url")) {
                var id = `${tag}${++i}`;
                var check = checkForExist(tag, elem.getAttribute("fill"), fills)
                if (!check.hasOwnProperty("id")) {
                    elem.setAttribute("id", id);
                    fills.push({
                        id: id,
                        color: convertToRGBA(elem.getAttribute("fill"))
                    });
                } else {
                    elem.setAttribute("id", check.id)
                    console.log(`${check.id} has same color as a previous ${tag}`);
                }
            } else if (elem.style.fill
                && elem.style.getPropertyValue("fill") != ""
                && elem.style.getPropertyValue("fill") != "none"
                && !elem.style.getPropertyValue("fill").includes("url")) {
                var id = `${tag}${++i}`;
                var check = checkForExist(tag, convertToRGBA(elem.style.getPropertyValue("fill")), fills)
                if (!check.hasOwnProperty("id")) {
                    elem.setAttribute("id", id);
                    fills.push({
                        id: id,
                        color: convertToRGBA(elem.style.getPropertyValue("fill"))
                    });
                } else {
                    elem.setAttribute("id", check.id)
                    console.log(`${check.id} has same color as a previous ${tag}`);
                }
            } else if (elem.hasAttribute("stroke")
                && elem.getAttribute("stroke") != ""
                && elem.getAttribute("stroke") != "none"
                && !elem.getAttribute("stroke").includes("url")) {
                var id = `${tag}${++i}`;
                var check = checkForExist(tag, convertToRGBA(elem.getAttribute("stroke")), strokes)
                if (!check.hasOwnProperty("id")) {
                    elem.setAttribute("id", id);
                    strokes.push({
                        id: id,
                        color: convertToRGBA(elem.getAttribute("stroke"))
                    });
                } else {
                    elem.setAttribute("id", check.id)
                    console.log(`${check.id} has same color as a previous ${tag}`);
                }
            } else if (elem.style.stroke
                && elem.style.getPropertyValue("stroke") != ""
                && elem.style.getPropertyValue("stroke") != "none"
                && !elem.style.getPropertyValue("stroke").includes("url")) {
                var id = `${tag}${++i}`;
                var check = checkForExist(tag, convertToRGBA(elem.style.getPropertyValue("stroke")), strokes)
                if (!check.hasOwnProperty("id")) {
                    elem.setAttribute("id", id);
                    strokes.push({
                        id: id,
                        color: convertToRGBA(elem.style.getPropertyValue("stroke"))
                    });
                } else {
                    elem.setAttribute("id", check.id)
                    console.log(`${check.id} has same color as a previous ${tag}`);
                }
            } else {
                console.log(`${tag}${++i} has no color`);
            }
        }
    });
    return { fills: fills, strokes: strokes }
}


// check whether the color already exits in the respective array
function checkForExist(tag, color, fills) {
    for (var fill of fills) {
        if (isEqual(fill.color, color)) {
            fill
            console.log(isEqual(fill.color, color));
            return { id: fill.id };
        }
    }
    return false;
}

// compare two objects or compare two arrays of objects
var isEqual = function (value, other) {

    // Get the value type
    var type = Object.prototype.toString.call(value);

    // If the two objects are not the same type, return false
    if (type !== Object.prototype.toString.call(other)) return false;

    // If items are not an object or array, return false
    if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false;

    // Compare the length of the length of the two items
    var valueLen = type === '[object Array]' ? value.length : Object.keys(value).length;
    var otherLen = type === '[object Array]' ? other.length : Object.keys(other).length;
    if (valueLen !== otherLen) return false;

    // Compare two items
    var compare = function (item1, item2) {

        // Get the object type
        var itemType = Object.prototype.toString.call(item1);

        // If an object or array, compare recursively
        if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
            if (!isEqual(item1, item2)) return false;
        }

        // Otherwise, do a simple comparison
        else {

            // If the two items are not the same type, return false
            if (itemType !== Object.prototype.toString.call(item2)) return false;

            // Else if it's a function, convert to a string and compare
            // Otherwise, just compare
            if (itemType === '[object Function]') {
                if (item1.toString() !== item2.toString()) return false;
            } else {
                if (item1 !== item2) return false;
            }

        }
    };

    // Compare properties
    if (type === '[object Array]') {
        for (var i = 0; i < valueLen; i++) {
            if (compare(value[i], other[i]) === false) return false;
        }
    } else {
        for (var key in value) {
            if (value.hasOwnProperty(key)) {
                if (compare(value[key], other[key]) === false) return false;
            }
        }
    }

    // If nothing failed, return true
    return true;

};


// convert to rgba
function convertToRGBA(color) {
    var rgba = Color(color).object();
    rgba.a = 1;
    return rgba;
}




























// const getColors = require("get-svg-colors");
// const tools = require('simple-svg-tools');
// const jsdom = require("jsdom");
// const { JSDOM } = jsdom;
// const fs = require('fs');


// // verify the input file argument
// if (process.argv[2]) {
//     fs.exists(`${process.argv[2]}`, (bool) => {
//         if (bool) {
//             tools.ImportSVG(`${process.argv[2]}`).then(svg => {
//                 var dom = new JSDOM(svg.toString());
//                 var document = dom.window.document;
//                 var colors = []
//                 tools.GetPalette(svg).then(result => {
//                     colors = result.colors;
//                     var { new_pallette, defs } = generateDefObj(document, colors);
//                     tools.ChangePalette(svg, new_pallette).then(svg => {
//                         var new_dom = new JSDOM(svg.toString());
//                         var svg_elem = new_dom.window.document.getElementsByTagName('svg')[0];
//                         svg_elem.removeAttribute("width");
//                         svg_elem.removeAttribute("height");
//                         svg_elem.appendChild(defs);
//                         var updated_svg_path = "updated_svg.svg";
//                         fs.writeFileSync(updated_svg_path, svg_elem.outerHTML);
//                         var output_colors = processPallette(new_pallette)
//                         console.log(JSON.stringify({ new_pallette: output_colors, svg: svg_elem.outerHTML, updated_svg_path: __dirname + "\\" + updated_svg_path }));
//                     }).catch(err => {
//                         console.log(err);
//                     });
//                 }).catch((err) => {
//                     console.log(err)
//                 })

//             }).catch(err => {
//                 console.log(err);
//             });
//         }
//         else {
//             console.log("Invalid file Path");
//         }
//     });
// } else {
//     console.log("Pass the file path as the third argument\n");
//     console.log("For eg: node index input.svg (input.svg exists in the root folder)");
// }

// //util functions
// function generateDefObj(document, list) {
//     var result = {};
//     var i = 0;
//     var defs = document.createElementNS("http://www.w3.org/2000/svg", 'defs');
//     list.forEach((color) => {
//         result[color] = `url(#custom-color-${++i})`;
//         defs.appendChild(createDefElement(document, color, `custom-color-${i}`));
//     })
//     var resp = { new_pallette: result, defs: defs };
//     return resp;
// }


// function createDefElement(document, color, id) {
//     var linearGradient = document.createElementNS("http://www.w3.org/2000/svg", 'linearGradient');
//     linearGradient.setAttribute("id", id);
//     var stop = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
//     stop.setAttribute("stop-color", color);
//     stop.setAttribute("offset", "100%");
//     linearGradient.appendChild(stop);
//     return linearGradient;
// }

// function hexToRgb(hex) {
//     // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
//     var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
//     hex = hex.replace(shorthandRegex, function (m, r, g, b) {
//         return r + r + g + g + b + b;
//     });

//     var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
//     return result ? {
//         r: parseInt(result[1], 16),
//         g: parseInt(result[2], 16),
//         b: parseInt(result[3], 16),
//         a: 1
//     } : null;
// }

// function processPallette(pallette) {
//     var result = {}
//     var regExp = /\(([^)]+)\)/;
//     var matches = regExp.exec("I expect five hundred dollars ($500).");
//     for (var key in pallette) {
//         result[regExp.exec(pallette[key])[1]] = JSON.stringify(hexToRgb(key))
//     }
//     return result
// }
