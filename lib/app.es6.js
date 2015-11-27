import ctx from './canvas.js'
import prompt from './prompt.js'
import api from './api.js'
import process from './process.js'

prompt.s.pipe(ctx.s).pipe(api)

window.addEventListener('keyup', (e) => {
  if (e.keyCode===32&&e.shiftKey) prompt.visible()
}, false)
