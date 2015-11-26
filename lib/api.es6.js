import through from 'through2'

export default through.obj((d,e,n) => {
  console.log(d)
  n()
})
