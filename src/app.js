import api from './api.js'
import ctx from './canvas.js'
import prompt from './prompt.js'
let conf = false
let m = {x:100,y:60}

prompt.s.pipe(ctx).pipe(api)

window.addEventListener('keyup', (e) => {
  if (e.keyCode===78&&e.ctrlKey) prompt.visible(m)
}, false)

window.addEventListener('mousemove', (e) => { m = {x:e.pageX,y:e.pageY} })
