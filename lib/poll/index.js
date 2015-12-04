import through from 'through2'

export default class Poll { // how to expose an editing interface?
  constructor (opts) {
    this.id = opts.id
    let s = through.obj()
    let i = setInterval(() => { this.s.push('!') }, 250)
    this.s = s
    this.s.on('close', () => { clearInterval(i) })
    this.s.on('pipe', () => { console.log('pipe', 'poll') })
    this.edit = function (e) { // launch editor // expose interface

    }
  }
}
