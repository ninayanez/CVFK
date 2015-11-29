import through from 'through2'

export default class Poll {
  constructor () {
    this.s = through.obj()
    console.log('loaded','poll')
    let i = setInterval(() => { this.s.push(new Date().getTime()) },250)
    this.s.on('end', () => { clearInterval(i) })
    this.s.on('pipe', () => { console.log('pipe', 'poll') })
  }
}
