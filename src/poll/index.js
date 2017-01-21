import through from 'through2'

export default class Poll { 
  // how to expose an editing interface?
  // use json config to indicate params & expose externally
  
  constructor (config) {
    let speed = 500
    let interval = null

    this.conf = config

    this.io = through.obj((d, e, n) => {
      if (d.speed) {
        speed = d.speed
        interval = setInterval(() => {
          this.io.write('!')
        }, speed)
      }
    })

    this.io.on('pipe', () => { 
      interval = setInterval(() => {
        this.io.write('!')
      }, speed)
    })

    this.io.on('close', () => { if (interval) clearInterval(interval) })

    this.edit = (e) => { // launch editor // expose interface

    }
  }
}
