import p from 'paper'
import _ from 'underscore'
import through from 'through2'
import comp from './_comp.js'

const modules = comp()
const sketch = {}
let activeLayers = null

function parse (d, e, n) {
  if (d.id&&d.event) { 
    if (sketch[d.id].click) sketch[d.id].click(d.event) 
    n()
    return
  } 
  const proj = d 
  const names = []
  const items = (!proj.layers[1]) 
    ? proj.layers[0].children 
    : proj.layers[0].children.concat(proj.layers[1].children)

  _.each(items, (itm) => {
    if (!itm.name||itm.name==='selection') return
    names.push(itm.name)
    if (!sketch[itm.name]) add(itm)
  })

  const itemsToRemove = _.difference(_.keys(sketch), names)
  _.each(itemsToRemove, (itm) => { rm(sketch[itm]) })

  n()
}

function add (item) { // pass second arg to constructor
  if (!item.data) return
  if (item instanceof p.Group) {
    if (modules[item.data.name]) {
      const modulePath='./'+item.data.name+'/'+modules[item.data.name].main
      const module = require(modulePath)
      sketch[item.name] = new module()
    }
  } else if (item instanceof p.Path.Line) {
    sketch[item.name] = item.data
    if (sketch[item.data.a] && sketch[item.data.b])
      sketch[item.data.a].io.pipe(sketch[item.data.b].io)
  }
}

function rm (item) {
  if (item instanceof p.Path.Line) {
    if (sketch[item.data.a]&&sketch[item.data.b])
      sketch[item.data.a].io.unpipe(sketch[item.data.b].io)
    delete sketch[item.name]
  } else if (item instanceof p.Group) {
    sketch[item.name].io.unpipe()
    sketch[item.name].io.destroy()
    delete sketch[item.name]
  } 
}

export default through.obj(parse)
