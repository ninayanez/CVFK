import through from 'through2'
import level from 'level'

let database = level('./data')

export default through.obj((d,e,n) => {
  console.log(d)
  n()
})
