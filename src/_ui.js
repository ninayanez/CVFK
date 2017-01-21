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
let layerSelected = new p.Layer({position : p.view.center})
let layerDefault = p.project.layers[0]
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
  box.onMouseDown = dragBox
  box.name = cuid()
  box.data = {
    cid: box.name,
    name : name,
    i : false,
    o : false,
    position : box.position,
    edit: false
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
  window.onmousemove = function (e) {
    cord.segments = [pos, [e.clientX-4, e.clientY-4]]
    p.view.draw()
  }
}

function moveBox (item, origin) {
  const cid = item.name
  const off = { 
    box : { 
      x : item.position.x-origin.x, 
      y : item.position.y-origin.y
    }
  }

  let i = item.data.i
  let o = item.data.o

  if (i) 
    off.i = { 
      x : i.segments[1].point.x-origin.x, 
      y : i.segments[1].point.y-origin.y
    }

  if (o) 
    off.o = { 
      x : o.segments[0].point.x-origin.x, 
      y : o.segments[0].point.y-origin.y
    }

  return function (e) {
    if (i) i.segments = [
      [i.segments[0].point.x,i.segments[0].point.y],
      [e.clientX+off.i.x,e.clientY+off.i.y]
    ]
    if (o) o.segments = [
      [e.clientX+off.o.x,e.clientY+off.o.y],
      [o.segments[1].point.x,o.segments[1].point.y],
    ]
    item.position = [e.clientX+off.box.x,e.clientY+off.box.y]
    p.view.draw()
  }
}

function dragBox (e) {
  const item = e.target
  const origin = e.point
  let draw = []

  if (!item.name || e.target.name === 'o' || e.target.name === 'i') return
  if (!(layerSelected.children[item.name])) draw.push(moveBox(item,origin)) 
  else _.each(layerSelected.children, (c) => { 
    if (!(c instanceof p.Group)) return
    draw.push(moveBox(c,origin))
  })
    
  window.onmousemove = (ev) => { _.each(draw, (fn) => { fn(ev) }) }
}

function selectItem (item, bool) {
  if (typeof item === 'string') item = getItem(item)
  if (bool) layerSelected.addChildren([item])
  else if (!bool) layerDefault.addChildren([item])
  if (!(item instanceof p.Group)) 
    item.strokeColor = (bool) ? 'rgba(255,0,0,0.8)' : 'blue' 
  else {
    item.children[0].fillColor = (bool)?'rgba(255,0,0,0.4)':'rgba(0,0,255,0.3)'
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
  if (e.ctrlKey) {
    if (hit) {
      s.push({ // EDIT
        edit : hit.item.parent.name,
        point : hit.item.parent.position
      })
    } else return 
  } else if (hit) return
  selection.bringToFront()
  selection.visible = true
  const c0 = [e.clientX, e.clientY] 
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
  if (item==selection) return
  const sect = selection.intersects(item)
  const inside = item.isInside(new p.Rectangle(
    [selection.bounds.x,selection.bounds.y],
    [selection.bounds.width,selection.bounds.height]
  ))
  if (inside||sect) return true
  return false
}

function selectAll (bool) {
  let selects = []
  if (bool) {
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
  if (selection.visible) selection.visible = false
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
  if (e.keyCode===8&&prompt.style.opacity==1) return
  if (e.keyCode===8) {
    let toDelete = []
    _.each(layerSelected.children, (c) => { toDelete.push(c.name) })
    _.each(toDelete, deleteItem)
    p.view.draw()
  } else if (e.keyCode===65&&e.ctrlKey) {
    selectAll(false)
  } else if (e.keyCode===68&&e.ctrlKey) {
    selectAll(true)
  } else if (e.keyCode===69&&e.ctrlKey) {
    if (CVS.style.display==='none') 
      CVS.style.display = 'block'
    else CVS.style.display = 'none'
  }
}

function canvasMouseMove (e) { activeMouse = [e.clientX,e.clientY] }

window.addEventListener('mouseup', windowMouseUp, false)
window.addEventListener('keydown', windowKeyDown, false)
CVS.addEventListener('mousedown', canvasMouseDown, false)
CVS.addEventListener('mousemove', canvasMouseMove, false)
