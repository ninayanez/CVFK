import through from 'through2'

export defaults through.obj((d,e,n) => {
  console.log(d)
  n()
})
