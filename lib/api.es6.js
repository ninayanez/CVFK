import _ from 'underscore'
import through from 'through2'
import remote from 'remote'
import level from 'level'
import modList from './moduleList.js'

let database = level('./data') // mockup !?
let ml = modList()
let sketch = null
let proc = {}

let s = through.obj((d,e,n) => { 
  if (typeof d === 'string') return // for now
  sketch = d 
  if (!d.edit) update()
  else if (d.edit&&proc[d.edit]) proc[d.edit].edit(d.point)
  n()
})

function update () { // compare && load/unload or pipe/unpipe
  _.each(proc, (v,k) => { if (!sketch[k]) rm(k) })
  _.each(sketch, (v,k) => { if (!proc[k]) add(k) })
}

function add (cid) { // pass second arg to constructor
  if (cid.split(':')[0]==='box') {
    const name =  sketch[cid].name
    if (ml[name]) {
      let idx = './'+name+'/'+ml[name].main
      let m = require(idx)
      proc[cid] = new m()
      proc[cid].id = cid
    }
  } else { // pipe
    proc[cid] = sketch[cid]
    let a = sketch[cid].o
    let b = sketch[cid].i
    if (proc[a]&&proc[b])
      proc[a].s.pipe(proc[b].s)
  }
}

function rm (cid) {
  if (proc[cid].s) {
    proc[cid].s.unpipe()
    proc[cid].s.destroy()
    delete proc[cid]
  } else { // unpipe
    let a = proc[cid].o
    let b = proc[cid].i
    if (proc[a]&&proc[b])
      proc[a].s.unpipe(proc[b].s)
    delete proc[cid]
  }
}

export default s
