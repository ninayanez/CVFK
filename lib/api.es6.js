import _ from 'underscore'
import through from 'through2'
import remote from 'remote'
import level from 'level'
import modList from './moduleList.js'

console.log(modList())

let database = level('./data') // mockup !?
let sketch = null
let proc = {}

// use hash to load/unload && pipe modules

export default through.obj((d,e,n) => { 
  if (d typeof 'string') return // for now
  if (sketch!==d) { // change

  }
  n()
})

function update () {

}
