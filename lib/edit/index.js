import through from 'through2'

import {ProseMirror} from './prosemirror/dist/edit'

export default class Edit {
  constructor (opts) {
    this.id = opts.id


    let pm = new ProseMirror({place:document.body})
    const EDIT = document.querySelector('.ProseMirror')
    let s = through.obj((d,e,n) => { n() })

    this.edit = (o) => {
      EDIT.style.left = o.point.x + 'px'
      EDIT.style.top = o.point.y + 'px'
    }

    pm.on('change', (str) => { console.log(str); s.push(str) })

    this.s = s
  }
}



