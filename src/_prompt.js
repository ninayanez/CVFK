import _ from 'underscore'
import through from 'through2'
import modList from './moduleList.js'

const ml = modList()
const stream = through.obj()
const mousePos = {x:0, y:0}
let bodyFocus = false

const prompt = document.createElement('div')
const input = document.createElement('input')
prompt.appendChild(input)
prompt.setAttribute('id','prompt')
prompt.style.opacity = 0
document.body.appendChild(prompt)

function visible (show) {
  prompt.style.opacity = (show) ? 1 : 0
  prompt.style.zIndex = (show) ? 2 : -1
  bodyFocus = (show) ? false : true
  if (!show) { document.body.focus(); return }
  prompt.style.left = mousePos.x 
  prompt.style.top = mousePos.y 
  input.value = ''
  input.focus()
}

window.addEventListener('mousemove', (e) => {
  mousePos.x = e.pageX + 'px'
  mousePos.y = e.pageY +'px'
}, false)

window.addEventListener('keydown', (e) => {
  if (e.key==='n' && focus) {e.preventDefault(); visible(true) }
}, false)

input.addEventListener('keydown', (e) => {
  if (e.key==='Esc') visible(false)
  if (e.key==='Tab') {
    _.each(_.keys(ml), (k) => { 
      if (k.match(input.value)) input.value = k 
    })
    e.preventDefault()
  }
  if (e.key==='Enter') {
    const val = input.value.toLowerCase()
    if (!ml[val]) { input.value = ''; return }
    stream.push(val)
    visible(false)
  }
}, false)

export default stream
