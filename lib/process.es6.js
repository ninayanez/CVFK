import through from 'through2'

export defaults through((d,e,n) => {
  console.log(d)
  n()
})
