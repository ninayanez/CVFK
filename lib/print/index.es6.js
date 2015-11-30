import through from 'through2'


export default class Print {
  constructor () {
    this.id = null

    const LOG = document.createElement('ul')

    this.s = through.obj((d,e,n) => { 
      const MSG = document.createElement('li')
      MSG.innerHTML = d
      LOG.appendChild(MSG)
      n() 
    })

    this.s.on('pipe', () => { console.log('pipe','print') })

    this.edit = function (pos) {
      if (!document.querySelector(this.id.split(':')[1])) {
          document.body.appendChild(LOG)
          LOG.setAttribute('class',this.id.split(':')[1])
      }

      if (LOG.style.display==='block') LOG.style.display = 'none' 
      else LOG.style.display = 'block'

      LOG.style.left = pos.x+'px'
      LOG.style.top = pos.y+'px'
    }
  }
}
