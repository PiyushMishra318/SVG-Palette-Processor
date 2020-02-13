const getColors = require("get-svg-colors")
const tools = require('simple-svg-tools');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs')
// Or an SVG string

tools.ImportSVG('C:/Users/Piyush/Downloads/turnschuh.svg').then(svg => {
    var dom = new JSDOM(svg.toString())
    var document = dom.window.document
    const colors = getColors('C:/Users/Piyush/Downloads/turnschuh.svg')
    var col_list = []
    colors.fills.map(color => col_list.push(color.hex()))
    colors.strokes.map(color => col_list.push(color.hex()))
    // remove rundundant colors
    col_list = col_list.filter( function( item, index, inputArray ) {
        return inputArray.indexOf(item) == index;
    });

    var {new_pallette,defs} = generateDefObj(document,col_list)
    tools.ChangePalette(svg,new_pallette).then(svg => {
        var new_dom = new JSDOM(svg.toString())
        var svg_elem = new_dom.window.document.getElementsByTagName('svg')[0]
        svg_elem.removeAttribute("width");
        svg_elem.removeAttribute("height");
        svg_elem.appendChild(defs)
        fs.writeFileSync("updated_svg.svg",svg_elem.outerHTML)
        new_dom.serialize()
    }).catch(err => {
        console.log(err);
    });
}).catch(err => {
    console.log(err);
});



function generateDefObj(document,list) {
    var result = {}
    var i = 0
    var defs = document.createElementNS("http://www.w3.org/2000/svg",'defs');
    list.forEach((color) => {
        result[color] = `url(#custom-color-${++i})`
        defs.appendChild(createDefElement(document,color,`custom-color-${i}`))
    })
    var resp = {new_pallette:result,defs:defs}
    return resp
}


function createDefElement(document,color,id) {
    var linearGradient = document.createElementNS("http://www.w3.org/2000/svg",'linearGradient')
    linearGradient.setAttribute("id",id);
    var stop = document.createElementNS("http://www.w3.org/2000/svg",'stop')
    stop.setAttribute("stop-color",color)
    stop.setAttribute("offset","100%")
    linearGradient.appendChild(stop)
    return linearGradient
}
