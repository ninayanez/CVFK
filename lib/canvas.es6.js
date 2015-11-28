import cuid from 'cuid'
import p from './paperjs'
import _ from 'underscore'
import through from 'through2'

const CVS = document.getElementById('cvs')
CVS.height = window.innerHeight
CVS.width = window.innerWidth

p.setup(CVS)
p.project.currentStyle.selectedColor = {red:0,blue:0,green:0,alpha:0}

// only store references in sketch hash --- use project & item.name to manip.
// interface override --- load/expose editor
// edit colors --- save scheme
// track & manip using cuids

let selection = new p.Path.Rectangle({
  name : 'selection',
  fillColor : 'red',
  point : [100, 100],
  size : [20, 20],
  opacity : 0.1,
  visible : false
})

let sketch = {} // hash of objects k : cuid, v : {inlet,outlet,name,pos}
let cord = false
let layerSelected = new p.Layer({position : p.view.center})
let layerDefault = p.project.layers[0]
layerDefault.activate()

window.sketch = sketch // for debug
window.p = p
window._ = _

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
  box.position = new p.Point(pos)
  box.onMouseDown = dragBox
  box.name = 'box:'+name+':'+cuid()

  sketch[box.name] = {
    name : name,
    i : false,
    o : false,
    position : box.position
  } 

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

  console.log(off)

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
  if (bool) layerSelected.addChildren[item]
  else if (!bool) layerDefault.addChildren([item])
  if (!(item instanceof p.Group)) 
    item.strokeColor = (bool) ? 'rgba(255,0,0,0.8)' : 'blue' 
  else {
    item.children[0].fillColor = (bool) ? 'rgba(255,0,0,0.4)' : 'blue'
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
  getItem(cid).remove()

  if (cid.split(':')[0]==='cord') {
    _.each(sketch, (v,k) => {
      if (v.i===cid) v.i = false
      if (v.o===cid) v.o = false
    })
  }
    
  delete sketch[cid]
}

export default through.obj((d,e,n) => {
  let id = cuid()
  makeBox([100,100],d) 
  p.view.draw()
  n()
})

// DOM EVENTS

function canvasMouseDown (e) { // select
  if (p.project.hitTest([e.clientX,e.clientY])) return false
  selection.bringToFront()
  selection.visible = true
  const c0 = [e.clientX, e.clientY] // 1st corner of selection
  window.onmousemove = function (ev) {
    const c3 = [ev.clientX, ev.clientY]
    const c1 = [(c3[0] - c0[0]) + c0[0], c0[1]]
    const c2 = [c0[0], (c3[1] - c0[1]) + c0[1]]
    selection.segments = [c0, c2, c3, c1]
    _.each(p.project.activeLayer.children, (b) => { 
      if (b.name==='selection') { // iterate through
      }
      const sect = selection.intersects(b)
      const inside = b.isInside(new p.Rectangle(
        [selection.bounds.x,selection.bounds.y],
        [selection.bounds.width,selection.bounds.height]
      ))
      if (inside||sect) {
        if (e.shiftKey) { // DESELECT!
          if (sketch.selected.isChild(b)) selectItem(b,false) 
        } else {
          if (!sketch.selected.isChild(b)) selectItem(b,true) 
        }
      } else if (!e.shiftKey) selectItem(b,false) 
    })
    p.view.draw()
  }
}

function windowMouseUp (e) { 
  window.onmousemove = null 
  var hit = p.project.hitTest([ e.clientX, e.clientY ])
  if (hit && (hit.item.name==='i'||hit.item.name==='o')) {
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
  } else {
    if (cord) { deleteItem(cord.name); cord = false }
    if (selection.visible) selection.visible = false
  }
  p.view.draw()
}

function windowKeyDown (e) {
  if (e.keyCode===8) {
    let del = _.clone(sketch.selected.children)
    _.each(del, (c) => { 
      if (_.isUndefined(c)) return
      if (sketch.boxes[c.name]) delete sketch.boxes[c.name]
      if (sketch.cords[c.name]) delete sketch.cords[c.name]
      c.remove() 
    })
    p.view.draw()
  }
}

function canvasDblClick (e) {
  if (p.project.hitTest([ e.clientX, e.clientY ])) return
  _.each(sketch.selected.children,itemDeselect)
  p.project.activeLayer.addChildren(sketch.selected.children)
}

window.addEventListener('mouseup', windowMouseUp, false)
window.addEventListener('keydown', windowKeyDown, false)
CVS.addEventListener('dblclick', canvasDblClick, false)
CVS.addEventListener('mousedown', canvasMouseDown, false)
