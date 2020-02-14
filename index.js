const getColors = require("get-svg-colors");
const tools = require('simple-svg-tools');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');


// verify the input file argument
if (process.argv[2]) {
    fs.exists(`${process.argv[2]}`, (bool) => {
        if (bool) {
            tools.ImportSVG(`${process.argv[2]}`).then(svg => {
                var dom = new JSDOM(svg.toString());
                var document = dom.window.document;
                const colors = getColors(`${process.argv[2]}`);
                var col_list = [];
                colors.fills.map(color => col_list.push(color.hex()));
                colors.strokes.map(color => col_list.push(color.hex()));
                // remove rundundant colors
                col_list = col_list.filter(function (item, index, inputArray) {
                    return inputArray.indexOf(item) == index;
                });

                var { new_pallette, defs } = generateDefObj(document, col_list);
                tools.ChangePalette(svg, new_pallette).then(svg => {
                    var new_dom = new JSDOM(svg.toString());
                    var svg_elem = new_dom.window.document.getElementsByTagName('svg')[0];
                    svg_elem.removeAttribute("width");
                    svg_elem.removeAttribute("height");
                    svg_elem.appendChild(defs);
                    var updated_svg_path = "updated_svg.svg";
                    fs.writeFileSync(updated_svg_path, svg_elem.outerHTML);
                    var output_colors = processPallette(new_pallette)
                    console.log({ new_pallette: output_colors, updated_svg_path: __dirname + "\\" + updated_svg_path });
                }).catch(err => {
                    console.log(err);
                });
            }).catch(err => {
                console.log(err);
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

//util functions
function generateDefObj(document, list) {
    var result = {};
    var i = 0;
    var defs = document.createElementNS("http://www.w3.org/2000/svg", 'defs');
    list.forEach((color) => {
        result[color] = `url(#custom-color-${++i})`;
        defs.appendChild(createDefElement(document, color, `custom-color-${i}`));
    })
    var resp = { new_pallette: result, defs: defs };
    return resp;
}


function createDefElement(document, color, id) {
    var linearGradient = document.createElementNS("http://www.w3.org/2000/svg", 'linearGradient');
    linearGradient.setAttribute("id", id);
    var stop = document.createElementNS("http://www.w3.org/2000/svg", 'stop');
    stop.setAttribute("stop-color", color);
    stop.setAttribute("offset", "100%");
    linearGradient.appendChild(stop);
    return linearGradient;
}

function processPallette(pallette) {
    var result = {}
    var regExp = /\(([^)]+)\)/;
    var matches = regExp.exec("I expect five hundred dollars ($500).");
    for (var key in pallette) {
        result[key] = regExp.exec(pallette[key])[1]
    }
    return result
}