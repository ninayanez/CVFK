import _ from 'underscore'
import through from 'through2'
import modList from './moduleList.js'

const ml = modList()

let history = {
  idx : 0,
  items : []
}

const errCode = '(҂⌣̀_⌣́) > '
const BOX = document.createElement('div')
const INPUT = document.createElement('input')
const RES = document.createElement('ul')
const ERR = document.createElement('span')
BOX.appendChild(ERR)
BOX.appendChild(INPUT)
BOX.appendChild(RES)
BOX.setAttribute('id','prompt')
BOX.setAttribute('style','opacity:0;')
document.body.appendChild(BOX)

window.res = RES

let prompt = {
  _ : BOX,
  s : through.obj(), 
  visible : function (bool) {
    function hide () { BOX.style.opacity = 0 }
    function show () {
      INPUT.value = null
      BOX.style.opacity = 1
      INPUT.focus()
    }
    if (bool===true) show()
    else if (bool===false) hide()
    else {
      if (BOX.style.opacity==0) show()
      else hide()
    } 
  },
  glitch : function (str) {
    ERR.innerHTML = errCode+str
    ERR.style.opacity = 1
    ERR.style.zIndex = 99
  }
}

INPUT.addEventListener('keydown', (e) => {
  if (ERR.style.opacity==1) {
    ERR.style.opacity = 0
    ERR.style.zIndex = '-9'
  } 
  if ((e.keyCode===32&&e.ctrlKey)||e.keyCode===9) e.preventDefault()
  if (e.keyCode===27) prompt.visible(false)
  if (e.keyCode===13) {
    history.idx++;
    history.items.push(INPUT.value)
    if (!searchModules(INPUT.value)) {
      INPUT.value = null
      prompt.glitch('ohhhh noooo')
    } else if (searchModules(INPUT.value)) {
      prompt.s.push(INPUT.value)
      prompt.visible(false)
      INPUT.value = null
    }
  }
  if (e.keyCode===40) { // UP : back in history
    if (history.items.length === 0) return
    history.idx++;
    if (history.idx > (history.items.length-1)) 
      history.idx = (history.items.length-1)
    INPUT.value = history.items[history.idx]
  }
  if (e.keyCode===38) { // DOWN : forward in history
    if (history.items.length === 0) return
    history.idx--;
    if (history.idx < 1) history.idx = 0
    INPUT.value = history.items[history.idx]
  }
}, false)

INPUT.addEventListener('keyup', (e) => {
  if (e.keyCode===27||e.keyCode===13||(e.keyCode===32&&e.ctrlKey)) return 
  if (e.keyCode===9) { // iterate over RES list
    e.preventDefault()
    let sel = document.querySelector('.selected')
    if (!sel||!sel.nextSibling) {
      if (sel===RES.lastChild) RES.lastChild.setAttribute('class','')
      RES.firstChild.setAttribute('class','selected')
      INPUT.value = RES.firstChild.innerHTML.split('<i>')[0].toLowerCase()
    } else if (sel&&sel.nextSibling) {
      sel.setAttribute('class','')
      sel.nextSibling.setAttribute('class','selected')
      INPUT.value = sel.nextSibling.innerHTML.split('<i>')[0].toLowerCase()
    }
  } else searchModules(e.target.value)   
}, false)

function searchModules (txt) {
  RES.innerHTML = ''
  _.each(ml, (v,k) => {
    if (k.match(txt)) {
      const li = document.createElement('li')
      li.innerHTML = k.toUpperCase() + '<i>  '+v.description+'</i>'
      RES.appendChild(li)
    }
  })
  if (RES.innerHTML == '') return false
  else return true
}

export default prompt
