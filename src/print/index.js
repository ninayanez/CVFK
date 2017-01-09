import through from 'through2'

export default class Print {
  constructor (opts) {
    this.id = opts.id
    const LOG = document.createElement('ul')
    this.s = through.obj((d,e,n) => { 
      if (typeof d !== 'string') d = JSON.stringify(d,null,2)
      const MSG = document.createElement('li')
      const time = new Date().toISOString().split('T')[1].replace('Z','')
      MSG.innerHTML = '<b>'+time+'</b> '+d
      LOG.appendChild(MSG)
      n() 
    })
    this.s.on('pipe', () => { console.log('pipe','print') })
    this.s.on('close', () => { 
      if (document.body.querySelector('ul.'+this.id.split(':')[1])) {
        document.body.removeChild(LOG)
      }
    })
    this.edit = function (op) {
      if (!document.querySelector('ul.'+this.id.split(':')[1])) {
        document.body.appendChild(LOG)
        LOG.setAttribute('class',this.id.split(':')[1])
      }
      if (LOG.style.display==='block') LOG.style.display = 'none' 
      else LOG.style.display = 'block'
      LOG.style.left = op.point.x+'px'
      LOG.style.top = op.point.y+'px'
    }
  }
}
