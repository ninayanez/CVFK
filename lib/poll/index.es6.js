import through from 'through2'

// how to expose an editing interface?

export default class Poll {
  constructor () {
    let s = through.obj()
    let i = setInterval(() => { this.s.push('!') }, 250)

    this.s = s
    this.s.on('end', () => { clearInterval(i) })
    this.s.on('pipe', () => { console.log('pipe', 'poll') })
    this.edit = function (e) { // launch editor // expose interface

    }
  }
}
