import _ from 'underscore'
import through from 'through2'
import modList from './moduleList.js'

let ml = modList()
let sketch = null
let modules = {}

// load module 
const s = through.obj((d,e,n) => { 
  if (typeof d === 'string') return // for now
  sketch = d 
  if (!d.edit) update()
  else if (d.edit&&modules[d.edit]) modules[d.edit].edit(d)
  n()
})

function update () { // compare && load/unload or pipe/unpipe
  _.each(modules, (v,k) => { if (!sketch[k]) rm(k) })
  _.each(sketch, (v,k) => { if (!modules[k]) add(k) })
}

function add (cid) { // pass second arg to constructor
  if (cid.split(':')[0]==='box') {
    const name =  sketch[cid].name
    if (ml[name]) {
      let idx = './'+name+'/'+ml[name].main
      let m = require(idx)
      modules[cid] = new m({id:cid})
    }
  } else { // pipe
    modules[cid] = sketch[cid]
    let a = sketch[cid].o
    let b = sketch[cid].i
    if (modules[a]&&modules[b])
      modules[a].io.pipe(modules[b].io)
  }
}

function rm (cid) {
  if (modules[cid].s) {
    modules[cid].io.unpipe()
    modules[cid].io.destroy()
    delete modules[cid]
  } else { // unpipe
    let a = modules[cid].o
    let b = modules[cid].i
    if (modules[a]&&modules[b])
      modules[a].io.unpipe(modules[b].io)
    delete modules[cid]
  }
}

export default s
