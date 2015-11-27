import _ from 'underscore'
import p from './paperjs'
import cuid from 'cuid'
import through from 'through2'

const CVS = document.getElementById('cvs')
CVS.height = window.innerHeight
CVS.width = window.innerWidth

p.setup(CVS)
p.project.currentStyle.selectedColor = {red:0,blue:0,green:0,alpha:0}
let layerSelected = new p.Layer({position : p.view.center})
let layerDefault = p.project.layers[0]

console.log(layerDefault, layerSelected)

// only store references in sketch hash -- use project & item.name to manip.
// track & manip using cuids
// interface override -- load / expose editor

let selection = new p.Path.Rectangle({
  name : 'selection',
  fillColor : 'red',
  point : [100, 100],
  size : [20, 20],
  opacity : 0.1,
  visible : false
})

let sketch = {
  cords : [],
  boxes : []
}

window.sketch = sketch // for debug
window.p = p

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
    center : [(bg.position.x + (bg.bounds.width / 2)) - 4, bg.position.y + 9],
    radius : 12,
    visible : false,
    opacity : 0.3
  })

  let box = new p.Group([bg,txt,hov,input,output])
  box.position = new p.Point(pos)
  box.onMouseDown = dragBox
  box.name = 'box:'+name+':'+cuid()
  sketch.boxes.push(box.name)

  return box
}

function drawPatchLine (e) {
  sketch.patch = 'cord:'+cuid()
  const pos = e.target.position
  let cord = new p.Path.Line({
    strokeColor : 'blue',
    name : sketch.patch,
    from : pos, 
    to : pos
  })
  window.onmousemove = function (e) {
    cord.segments = [pos, [e.clientX-4, e.clientY-4]]
    p.view.draw()
  }
}

function moveBox (item, origin) {
  if (item.parent && item.parent.name) item = item.parent
  const cid = item.name
  let outlet = false
  let inlet = false

  const off = {x : item.position.x - origin.x, y : item.position.y - origin.y}

  _.each(sketch.cords, (v,k) => {
    if (v.outlet === cid) { outlet = k }
    if (v.inlet === cid) { inlet = k }
  })

  return function (e) {
    if (inlet) {
      let patch = sketch.cords[inlet]
      let point = item.children[3]
      patch.item.segments = [
        [patch.item.segments[0].point.x, patch.item.segments[0].point.y],
        [point.position.x, point.position.y]
      ]
    } else if (outlet) {
      let cord = sketch.cords[outlet]
      let point = item.children[4]
      cord.item.segments = [
        [point.position.x, point.position.y],
        [cord.item.segments[1].point.x, cord.item.segments[1].point.y]
      ]
    }
  }
  p.view.draw()
}

function dragBox (e) {
  let cords = false
  let origin = e.point
  let item = e.target.parent

  if (!item.name || e.target.name === 'o' || e.target.name === 'i') return
  if (sketch.selected.isChild(item)) item = sketch.selected

  if (sketch.selected.isChild(item)) {
    _.each(item.children, (c) => {
      if (!c instanceof p.Group) return
      cords = checkCords(c)
    })
  } else cords = checkCords(item)

  _.each(sketch.cords, (cord) => {
    if (sketch.selected.isChild(sketch.boxes[cord.inlet])
      !== sketch.selected.isChild(sketch.boxes[cord.outlet])
    ) {
      itemDeselect(cord.item)
      p.project.activeLayer.addChildren([cord.item])
    }
  })

  let off = {x: item.position.x-e.point.x, y: item.position.y-e.point.y}
    
  function moveCords (ev) {
    // recalculate offset after cord added to activeLayer
    // prepare cords for re-drawing inside event listener
    _.each(sketch.cords, (cord) => {
      let a = sketch.boxes[cord.inlet]
      let b = sketch.boxes[cord.outlet]
      if (!sketch.selected.isChild(a) && sketch.selected.isChild(b)) {
        let top = b.children[4].position
        let bot = a.children[3].position
        item.position = [ev.pageX+off.x, ev.pageY+off.y]
        cord.item.segments = [[top.x, top.y], [bot.x, bot.y]]
        cord.item.sendToBack()
        p.view.draw()
      } else if (!sketch.selected.isChild(b) && sketch.selected.isChild(a)) {
        a.bringToFront()
        let top = b.children[4].position
        let bot = a.children[3].position
        item.position = [ev.pageX+off.x, ev.pageY+off.y]
        cord.item.segments = [[top.x, top.y], [bot.x, bot.y]]
        cord.item.sendToBack()
        p.view.draw()
      } else {
        item.position = [ev.pageX+off.x, ev.pageY+off.y]
        p.view.draw()
      }
    })
  }

  window.onmousemove = (ev) => { // now draw cords!
    if (item==sketch.selected) moveCords(ev)
    else item.position = [ev.pageX+off.x, ev.pageY+off.y]

    if (cords&&item!==sketch.selected)
      _.each(cords,(c) => {
        let top = (c.inlet===item.name) 
          ? item.children[3].position 
          : sketch.boxes[c.inlet].children[3].position
        let bot = (c.outlet===item.name) 
          ? item.children[4].position
          : sketch.boxes[c.outlet].children[4].position
        c.item.segments = [[top.x, top.y], [bot.x, bot.y]]
      })
    p.view.draw()
  }
}

function checkCords (item) {
  let res = []
  let outlet = _.find(sketch.cords,{outlet:item.name})
  let inlet = _.find(sketch.cords,{inlet:item.name})
  if (!inlet&&!outlet) return false
  if (outlet) res.push(outlet)
  if (inlet) res.push(inlet)
  return res
}

function itemSelect (item, bool) {
  if (bool) sketch.selected.addChildren[item]
  else if (!bool) p.project.activeLayer.addChildren([item])
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

export const s = through.obj((d,e,n) => {
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
          if (sketch.selected.isChild(b)) itemSelect(b,false) 
        } else {
          if (!sketch.selected.isChild(b)) itemSelect(b,true) 
        }
      } else if (!e.shiftKey) itemSelect(b,false) 
    })
    p.view.draw()
  }
}

function windowMouseUp (e) { 
  window.onmousemove = null 
  var hit = p.project.hitTest([ e.clientX, e.clientY ])
  if (hit && (hit.item.name==='i'||hit.item.name==='o')) {
    let patch = sketch.cords[sketch.patch]
    patch.inlet = hit.item.parent.name
    _.each(sketch.cords, (v,k) => {
      if (v.inlet === hit.item.parent.name && k !== sketch.patch) {
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
