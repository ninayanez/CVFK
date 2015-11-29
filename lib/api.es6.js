import _ from 'underscore'
import through from 'through2'
import remote from 'remote'
import level from 'level'
import modList from './moduleList.js'

let database = level('./data') // mockup !?
let sketch = null
let proc = {}
let ml = modList()

let s = through.obj((d,e,n) => { 
  if (typeof d === 'string') return // for now
  if (sketch !== d) { // change
    sketch = d 
    update((res) => {
      s.push(res)
      n()
    })
  } else n()
})

function update (cb) { // compare && load/unload or pipe/unpipe
  _.each(proc, (v,k) => { if (!sketch[k]) rm(k) })
  _.each(sketch, (v,k) => { if (!proc[k]) add(k) })
  cb() // cb with result
}

function rm (cid) {
  delete proc[cid]
}

function add (cid) {
  proc[cid] = require('./'+v.name+'/'+ml[v.name].main)
}

export default s
