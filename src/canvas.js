import cuid from 'cuid'
import p from './paper.js'
import _ from 'underscore'
import through from 'through2'

const CVS = document.getElementById('cvs')
CVS.height = window.innerHeight
CVS.width = window.innerWidth

p.setup(CVS)

// edit colors --- save scheme
// interface override --- load/expose editor

let selection = new p.Path.Rectangle({
  name : 'selection',
  fillColor : 'red',
  point : [100, 100],
  size : [20, 20],
  opacity : 0.1,
  visible : false
})

let mouse = [100,60]
let sketch = {} 
let cord = false
let layerSelected = new p.Layer({position : p.view.center})
let layerDefault = p.project.layers[0]
layerDefault.activate()

function makeBox (pos, name) {
  let txt = new p.PointText({
    content : name.toUpperCase(),
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

  let output = new p.Path.RoundRectangle({
    center : [(bg.position.x+(bg.bounds.width/2))-5, bg.position.y+11],
    size : [10,6],
    fillColor : 'blue',
    strokeWidth : 0,
    name : 'o'
  })

  output.onMouseEnter = function (e) { 
    hov.position = e.target.position
    hov.visible = true
  }
  output.onMouseLeave = function (e) { hov.visible = false }
  output.onMouseDown = drawPatchLine

  let input = new p.Path.Rectangle({
    center : [(bg.position.x-(bg.bounds.width/2))+5,bg.position.y-11],
    size : [10,6],
    fillColor : 'blue',
    strokeWidth : 0,
    name : 'i'
  })

  input.onMouseEnter = function (e) {
    hov.position = e.target.position
    hov.visible = true;
  }

  input.onMouseLeave = function (e) { hov.visible = false; }

  let hov = new p.Path.Circle({
    fillColor : 'red',
    center : [(bg.position.x+(bg.bounds.width/2)) - 4, bg.position.y + 9],
    radius : 12,
    visible : false,
    opacity : 0.3
  })

  let box = new p.Group([bg,txt,hov,input,output])
  box.position = new p.Point([pos[0]+(box.bounds.width/2),pos[1]])
  box.onMouseDown = dragBox
  box.name = 'box:'+name+':'+cuid()

  sketch[box.name] = {
    name : name,
    i : false,
    o : false,
    position : box.position
  } 

  s.push(sketch)

  return box
}

function drawPatchLine (e) {
  cord = {name:'cord:'+cuid(),o:e.target.parent.name}
  const pos = e.target.position
  let line = new p.Path.Line({
    strokeColor : 'blue',
    name : cord.name,
    from : pos, 
    to : pos
  })
  window.onmousemove = function (e) {
    line.segments = [pos, [e.clientX-4, e.clientY-4]]
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

  let i = getItem(sketch[cid].i)
  let o = getItem(sketch[cid].o)

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
    sketch[item.name].position = item.position
  }
}

function dragBox (e) {
  const item = e.target.parent
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
  item.remove()

  if (cid.split(':')[0]==='cord') {
    let inlet = sketch[sketch[cid].i]
    let outlet = sketch[sketch[cid].o]
    if (outlet) outlet.o = false
    if (inlet) inlet.i = false
  }

  if (cid.split(':')[0]==='box') {
    if (sketch[cid].i && !layerSelected.children[sketch[cid].i]) 
      deleteItem(sketch[cid].i)
    if (sketch[cid].o && !layerSelected.children[sketch[cid].o]) 
      deleteItem(sketch[cid].o)
  }

  delete sketch[cid]
  s.push(sketch)
}

let s = through.obj((d,e,n) => {
  let id = cuid()
  makeBox(mouse,d) 
  p.view.draw()
  n()
})

export default s

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
  var hit = p.project.hitTest([ e.clientX, e.clientY ])
  if (hit && cord && (hit.item.name==='i'||hit.item.name==='o')) {
    _.each(sketch, (v,k) => { if (v.i===cord.name) deleteItem(v.i) })
    sketch[cord.name] = {o:cord.o,i:hit.item.parent.name}
    sketch[hit.item.parent.name].i = cord.name
    sketch[cord.o].o = cord.name
    let patch = getItem(cord.name)
    patch.segments = [
      [patch.segments[0].point.x,patch.segments[0].point.y],
      [hit.item.position.x, hit.item.position.y]
    ]
    cord = false
    s.push(sketch)
  } else {
    if (cord) { deleteItem(cord.name); cord = false }
    if (selection.visible) selection.visible = false
  }
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
  }
}

function canvasMouseMove (e) { mouse = [e.clientX,e.clientY] }

window.addEventListener('mouseup', windowMouseUp, false)
window.addEventListener('keydown', windowKeyDown, false)
CVS.addEventListener('mousedown', canvasMouseDown, false)
CVS.addEventListener('mousemove', canvasMouseMove, false)
