import cuid from 'cuid'
import p from 'paper'
import _ from 'underscore'
import through from 'through2'
import prompt from './_prompt.js'

const CVS = document.getElementById('cvs')
CVS.height = window.innerHeight
CVS.width = window.innerWidth

p.setup(CVS)

let activeMouse = [100,60]
let activeCord = false
const layerDefault = p.project.activeLayer
const layerSelected = new p.Layer({position: p.view.center})
layerDefault.activate()
const selection = new p.Path.Rectangle({
  name : 'selection',
  fillColor : 'red',
  point : [100, 100],
  size : [20, 20],
  opacity : 0.1,
  visible : false
})

function makeBox (pos, name) {
  let txt = new p.PointText({
    content : name,
    fillColor : 'blue',
    fontSize : 11,
    fontFamily : 'Input Sans Condensed',
    point : pos
  })

  let bg = new p.Path.Rectangle({
    point : pos,
    size : [txt.bounds.width+11,18],
    fillColor : 'rgba(0,0,255,0.2)'
  })

  bg.position = txt.position

  const outlet = new p.Path.RoundRectangle({
    center : [(bg.position.x+(bg.bounds.width/2))-5, bg.position.y+11],
    size : [10,6],
    fillColor : 'blue',
    strokeWidth : 0,
    name : 'o'
  })

  outlet.onMouseEnter = (e) => {
    hov.position = e.target.position ;hov.visible = true
  }
  outlet.onMouseLeave = (e) => { hov.visible = false }
  outlet.onMouseDown = makeCord

  const inlet = new p.Path.Rectangle({
    center : [(bg.position.x-(bg.bounds.width/2))+5,bg.position.y-11],
    size : [10,6],
    fillColor : 'blue',
    strokeWidth : 0,
    name : 'i'
  })

  inlet.onMouseEnter = function (e) {
    hov.position = e.target.position
    hov.visible = true;
  }

  inlet.onMouseLeave = function (e) { hov.visible = false; }

  const hov = new p.Path.Circle({
    fillColor : 'red',
    center : [(bg.position.x+(bg.bounds.width/2)) - 4, bg.position.y + 9],
    radius : 12,
    visible : false,
    opacity : 0.3
  })

  const box = new p.Group([bg,txt,hov,inlet,outlet])
  box.position = new p.Point([pos[0]+(box.bounds.width/2),pos[1]])
  box.onMouseDrag = dragBox
  box.onMouseDown = (e) => { box.data.click = true }
  box.onMouseUp = (e) => { 
    if (box.data.click) s.push({id: box.name, event: e }) 
  }
  box.name = cuid()
  box.data = {
    cid: box.name,
    name : name,
    i : false,
    o : false,
    position : box.position,
    click: false
  }
  push()
}

function makeCord (e) {
  const pos = e.target.position
  const cord = new p.Path.Line({
    strokeColor : 'blue',
    name : cuid(),
    data : {
      a : e.target.parent.name,
      b : false
    },
    from : pos, 
    to : pos
  })
  activeCord = cord
  e.target.onMouseDrag = (ev) => {
    e.target.parent.data.click = false
    cord.segments = [pos, [ev.point.x-4, ev.point.y-4]]
  }
}

function dragBox (e) {
  const item = e.target
  if (!item.name || item.name === 'o' || item.name === 'i') return
  item.data.click = false
  if (layerSelected.children[item.name]) {
    _.each(layerSelected.children, (c) => {
      if (c instanceof p.Path) {
        if (!layerSelected.children[c.data.a] || 
            !layerSelected.children[c.data.b]) {
            const a = getItem(c.data.a).children['o']
            const b = getItem(c.data.b).children['i']
            c.segments = [a.position,b.position]
        }
      } else {
        c.position.x += e.delta.x
        c.position.y += e.delta.y
      }
    })
  } else {
    item.position.x += e.delta.x
    item.position.y += e.delta.y
  }
  const conns = [item.data.i,item.data.o]
  _.each(conns, (cordId) => {
    if (!cordId) return
    const cord = getItem(cordId)
    const a = getItem(cord.data.a).children['o']
    const b = getItem(cord.data.b).children['i']
    cord.segments = [[a.position.x, a.position.y],[b.position.x,b.position.y]]
  })
}

function selectItem (item, bool) {
  if (typeof item === 'string') item = getItem(item)
  if (bool) layerSelected.addChildren([item])
  else if (!bool) layerDefault.addChildren([item])
  if (!(item instanceof p.Group)) 
    item.strokeColor = (bool) ? 'rgba(255,0,0,0.8)' : 'blue' 
  else {
    item.children[0].fillColor=(bool)?'rgba(255,0,0,0.4)':'rgba(0,0,255,0.3)'
    item.children[1].fillColor = (bool) ? 'rgba(0,0,0,0.6)' : 'blue'
    item.children[3].fillColor = (bool) ? 'rgba(255,0,0,0.8)' : 'blue'
    item.children[4].fillColor = (bool) ? 'rgba(255,0,0,0.8)' : 'blue'
  }
  p.view.draw()
}

function getItem (cid) {
  if (layerSelected.children[cid]) return layerSelected.children[cid]
  if (layerDefault.children[cid]) return layerDefault.children[cid] 
  return false
}

function deleteItem (cid) {
  let item = (typeof cid === 'string') ? getItem(cid) : cid
  if (typeof cid !== 'string') cid = item.name
  if (item instanceof p.Group) { 
    if (item.data.i) deleteItem(item.data.i)
    if (item.data.o) deleteItem(item.data.o) 
  }
  if (item instanceof p.Path.Line) { // remove connections 
    const inItem = getItem(item.i)
    const outItem = getItem(item.o)
    if (inItem) outItem.data.o = false
    if (outItem) outItem.data.i = false
  }
  item.remove()
  push()
}

let s = through.obj((d,e,n) => {
  makeBox(activeMouse,d) 
  p.view.draw()
  n()
})

prompt.pipe(s)

export default s

function push () { p.view.draw(); s.push(p.project) }

// DOM EVENTS

function canvasMouseDown (e) { // select
  const hit = p.project.hitTest([ e.clientX, e.clientY ])
  // if (e.ctrlKey&&hit) hit.item
  if (hit) return
  selection.bringToFront()
  const c0 = [e.clientX, e.clientY] 
  selection.visible = true
  p.view.draw()
  window.onmousemove = function selects (ev) { // fix!!!! to shift add to sel
    const c3 = [ev.clientX, ev.clientY]
    const c1 = [(c3[0] - c0[0]) + c0[0], c0[1]]
    const c2 = [c0[0], (c3[1] - c0[1]) + c0[1]]
    selection.segments = [c0, c2, c3, c1]
    let selected = []
    if (!e.shiftKey)
      _.each(layerDefault.children, (b) => { 
        if (checkSelected(b)) selected.push(b.name) 
      })
    if (e.shiftKey)
      _.each(layerSelected.children, (b) => {
        if (checkSelected(b)) selected.push(b.name)
      })
    _.each(selected, (cid) => {
      if (e.shiftKey) 
        selectItem(getItem(cid), false)
      if (!e.shiftKey)
        selectItem(getItem(cid), true)
    })
    p.view.draw()
  }
}

function checkSelected (item) {
  if (item==selection) return false
  if (item instanceof p.Path) 
    if (selection.intersects(item)) return true
  const inside = item.isInside(new p.Rectangle(
    [selection.bounds.x,selection.bounds.y],
    [selection.bounds.width,selection.bounds.height]
  ))
  if (inside) return true
  return false
}

function selectAll (bool) {
  let selects = []
  if (!bool) {
    _.each(layerSelected.children, (c) => { selects.push(c.name) })
    _.each(selects, (d) => { selectItem(d,false) })
  } else {
    _.each(layerDefault.children, (c) => { 
      if (c.name==='selection') return 
      selects.push(c.name) 
    })
    _.each(selects, (d) => { selectItem(d,true) })
  }
}

function windowMouseUp (e) { // CANCEL MOUSEMOVES
  window.onmousemove = null 
  if (selection.visible) { // set selection rect!
    const segs = [e.pageX, e.pageY]
    selection.segments = [segs,segs,segs,segs]
    selection.visible = false
    p.view.draw()
  }
  const hit = p.project.hitTest([ e.clientX, e.clientY ])
  if (!activeCord) return
  if (!hit || !hit.item.name==='i'){
    deleteItem(activeCord)
    activeCord=false
    return
  }
  activeCord.data.b = hit.item.parent.name
  getItem(activeCord.data.a).data.o = activeCord.name
  getItem(activeCord.data.b).data.i = activeCord.name
  activeCord.segments = [
    activeCord.segments[0].point,
    [hit.item.position.x, hit.item.position.y]
  ]
  activeCord = false
  push()
  p.view.draw()
}

function windowKeyDown (e) {
  const prompt = document.getElementById('prompt')
  if (e.key==='Backspace'&&prompt.style.opacity==1) return
  if (e.key==='Backspace') {
    let toDelete = []
    _.each(layerSelected.children, (c) => { toDelete.push(c.name) })
    _.each(toDelete, deleteItem)
    p.view.draw()
  } 
  if (e.key==='a'&&e.ctrlKey) selectAll(true)
  if (e.key==='d'&&e.ctrlKey) selectAll(false)
}

function windowDblClick (e) { console.log(e); selectAll(false) }

function canvasMouseMove (e) { activeMouse = [e.clientX,e.clientY] }

window.addEventListener('mouseup', windowMouseUp, false)
window.addEventListener('keydown', windowKeyDown, false)
window.addEventListener('dblclick', windowDblClick, false)
CVS.addEventListener('mousedown', canvasMouseDown, false)
CVS.addEventListener('mousemove', canvasMouseMove, false)
