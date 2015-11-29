import api from './api.js'
import ctx from './canvas.js'
import prompt from './prompt.js'

prompt.s.pipe(ctx).pipe(api)

window.addEventListener('keyup', (e) => {
  if (e.keyCode === 32 && e.shiftKey) prompt.visible()
}, false)
