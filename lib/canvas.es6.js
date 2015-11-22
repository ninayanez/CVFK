import _ from 'underscore'
import p from './paperjs'
import cuid from 'cuid'
import through from 'through2'

const CVS = document.getElementById('cvs')
CVS.height = window.innerHeight
CVS.width = window.innerWidth

p.setup(CVS)
p.project.currentStyle.selectedColor = {red:0,blue:0,green:0,alpha:0}

let sketch = {
  patch : false,
  boxes : {},
  cords : {}
}

// tracking. -- api reps.

function drawPatchLine (e) {
  var pos = e.target.position
  sketch.patch = cuid()
  sketch.cords[sketch.patch] = {
    outlet : e.target.parent.data,
    inlet : null,
    item : new p.Path.Line({
      strokeColor : 'blue',
      data : sketch.patch,
      from : pos, 
      to : pos
    })
  }
  window.onmousemove = function (e) {
    sketch.cords[sketch.patch].item.segments = [
      pos,
      [e.clientX-4, e.clientY-4]
    ]
    p.view.draw()
  }
}

function moveBox (item) {
  if (item.parent.data) item = item.parent
  const cid = item.data
  let outlet = false
  let inlet = false
  _.each(sketch.cords, (v,k) => {
    if (v.outlet === cid) { outlet = k }
    if (v.inlet === cid) { inlet = k }
  })
  return function mouseMoveListener (e) { 
    item.position = [ev.clientX-off.x, ev.clientY-off.y]
    if (inlet) {
      let patch = sketch.cords[inlet]
      let point = item.children[3]
      patch.item.segments = [
        [patch.item.segments[0].point.x,patch.item.segments[0].point.y],
        [point.position.x,point.position.y]
      ]
    }
    if (outlet) {
      let patch = sketch.cords[outlet]
      let point = item.children[4]
      patch.item.segments = [
        [point.position.x,point.position.y],
        [patch.item.segments[1].point.x,patch.item.segments[1].point.y]
      ]
    }
    p.view.draw()
  }
}

function dragBox (e) {
  if (!cid || e.target.data === 'o' || e.target.data === 'i') return
  let item = e.target.parent
  window.onmousemove = moveBox
}

export function makeBox (pos, name, id) {
  var txt = new p.PointText({
    content : name.toUpperCase(),
    fillColor : 'blue',
    fontSize : 11,
    fontFamily : 'Input Sans Condensed',
    point : pos
  })

  var bg = new p.Path.Rectangle({
    point : pos,
    size : [txt.bounds.width+11,18],
    fillColor : 'rgba(0,0,255,0.2)'
  })

  bg.position = txt.position

  var output = new p.Path.RoundRectangle({
    center : [(bg.position.x+(bg.bounds.width/2))-5, bg.position.y+11],
    size : [10,6],
    fillColor : 'blue',
    strokeWidth : 0,
    data : 'o'
  })

  output.onMouseEnter = function (e) { 
    hov.position = e.target.position
    hov.visible = true
  }

  output.onMouseLeave = function (e) { hov.visible = false }
  output.onMouseDown = drawPatchLine

  var input = new p.Path.Rectangle({
    center : [(bg.position.x-(bg.bounds.width/2))+5,bg.position.y-11],
    size : [10,6],
    fillColor : 'blue',
    strokeWidth : 0,
    data : 'i'
  })

  input.onMouseEnter = function (e) {
    hov.position = e.target.position
    hov.visible = true;
  }

  input.onMouseLeave = function (e) { hov.visible = false; }

  var hov = new p.Path.Circle({
    fillColor : 'red',
    center : [(bg.position.x + (bg.bounds.width / 2)) - 4, bg.position.y + 9],
    radius : 12,
    visible : false,
    opacity : 0.3
  })

  var box = new p.Group([bg,txt,hov,input,output])
  box.position = new p.Point(pos)
  box.onMouseDown = dragBox
  box.data = id

  return box
}

var selection = new p.Path.Rectangle({
  fillColor : 'red',
  point : [100, 100],
  size : [20, 20],
  opacity : 0.1,
  visible : false
})

function select (e) {
  if (p.project.hitTest([e.clientX,e.clientY])) return false
  selection.visible = true
  selection.bringToFront()
  const c0 = [e.clientX, e.clientY] // 1st corner of selection
  window.onmousemove = function (ev) {
    const c3 = [ev.clientX, ev.clientY]
    const c1 = [(c3[0] - c0[0]) + c0[0], c0[1]]
    const c2 = [c0[0], (c3[1] - c0[1]) + c0[1]]
    selection.segments = [c0, c2, c3, c1]
    selectItems()
    p.view.draw()
  }
  // iterate through canvas objects using isInside(selection)
}

function remove (id) {

}

function windowMouseUp (e) { 
  window.onmousemove = null 
  var hit = p.project.hitTest([ e.clientX, e.clientY ])
  if (hit && (hit.item.data==='i'||hit.item.data==='o')) {
    let patch = sketch.cords[sketch.patch]
    patch.inlet = hit.item.parent.data
    _.each(sketch.cords, (v,k) => {
      if (v.inlet === hit.item.parent.data && k !== sketch.patch) {
        sketch.cords[k].item.remove()
        delete sketch.cords[k]
      }
    })
    patch.item.segments = [
      [patch.item.segments[0].point.x,patch.item.segments[0].point.y],
      [hit.item.position.x, hit.item.position.y]
    ]
    sketch.patch = false
  } else {
    if (sketch.patch) {
      sketch.cords[sketch.patch].item.remove()
      delete sketch.cords[sketch.patch]
      sketch.patch = null
    }
    if (selection.visible) selection.visible = false
  }
  p.view.draw()
}

function selectItems () {
  _.each(sketch.boxes, (v,k) => {
    if (v.intersects(selection)) itemSelect(v)
  })
  _.each(sketch.cords, (v,k) => {
    if (v.item.intersects(selection)) itemSelect(v.item)
  })
  p.view.draw()
}

function deselectItems (item) {
  if (!item) {
    _.each(sketch.boxes, (v,k) => {if (v.selected) itemDeselect(v)})
    _.each(sketch.cords, (v,k) => {if (v.item.selected) itemDeselect(v.item)})
  }
}

function itemDeselect (item) {
  item.selected = false
  if (item instanceof p.Group) {
    item.children[0].fillColor = 'rgba(0,0,255,0.2)'
    item.children[1].fillColor = 'blue'
    item.children[3].fillColor = 'blue'
    item.children[4].fillColor = 'blue'
  } else {
    item.strokecolor = 'blue'
  }
  p.view.draw()
}

function itemSelect (item) {
  item.selected = true
  if (item instanceof p.Group) {
    item.children[0].fillColor = 'rgba(255,0,0,0.4)'
    item.children[1].fillColor = 'rgba(0,0,0,0.6)'
    item.children[3].fillColor = 'rgba(255,0,0,0.8)'
    item.children[4].fillColor = 'rgba(255,0,0,0.8)'
  } else {
    item.strokeColor = 'rgba(255,0,0,0.8)'
  }
  p.view.draw()
}

export const s = through.obj((d,e,n) => {
  let id = cuid()
  sketch.boxes[id] = makeBox([100,100],d,id) 
  p.view.draw()
  n()
})
// move all selected items together

window.addEventListener('mouseup', windowMouseUp, false)
CVS.addEventListener('mousedown', select, false)
CVS.addEventListener('dblclick', (e) => {deselectItems()}, false)
window.addEventListener('keydown', (e) => {
}, false)
