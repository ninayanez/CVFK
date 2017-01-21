import api from './api.js'
import ctx from './canvas.js'
import prompt from './prompt.js'

prompt.pipe(ctx).pipe(api)
