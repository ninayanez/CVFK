import _ from 'underscore'
import through from 'through2'
import modList from './moduleList.js'

const ml = modList()
const stream = through()
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

function search (name) {
  const result = _.findKey(ml, name)
  if (result) return result
  else return false
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
    console.log(input.value)
    _.keys(ml, (k) => { 
      console.log(k)
      console.log(input.value.match(k))
      if (k.match(input.value)) input.value = k 
    })
    e.preventDefault()
  }
  if (e.key==='Enter') {
    const val = input.value.toLowerCase()
    const result = search(val)
    if (!search) { input.value = ''; return }
    stream.push(result)
    visible(false)
  }
}, false)

export default stream
