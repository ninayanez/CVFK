import through from 'through2'

let context = {} // load & track

// access to module list database

export default through.obj((d,e,n) => {
  // input module name & id ? store in hash
  // load module 
  // update module list / store
  n()
})
