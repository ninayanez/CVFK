import through from 'through2'

export default class Print {
  constructor () {
    console.log('loaded','print')
    this.id = null
    this.s = through.obj((d,e,n) => { console.log(d); n() })
    this.s.on('pipe', () => { console.log('pipe','print') })
    this.edit = function () {
      console.log('edit',this.id)
    }
  }
}
