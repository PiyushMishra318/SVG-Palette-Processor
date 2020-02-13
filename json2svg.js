const {stringify} = require('svgson')
const fs =  require('fs')
var json = fs.readFileSync(__dirname + '/svg_json.json')


const mysvg = stringify(json)
console.log(mysvg)
 