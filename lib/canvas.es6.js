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
  cords : {},
  boxes : {},
  selected : new p.Group()
}

// tracking. -- api reps.

function drawPatchLine (e) {
  var pos = e.target.position
  sketch.patch = cuid()
  sketch.cords[sketch.patch] = {
    outlet : e.target.parent.name,
    inlet : null,
    item : new p.Path.Line({
      strokeColor : 'blue',
      name : sketch.patch,
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

function checkCords (item) {
  let res = []
  let outlet = _.find(sketch.cords,{outlet:item.name})
  let inlet = _.find(sketch.cords,{inlet:item.name})
  if (!inlet&&!outlet) return false
  if (inlet) res.push(inlet)
  if (outlet) res.push(outlet)
  return res
}

function dragBox (e) {
  let cords = false
  let origin = e.point
  let item = e.target.parent

  if (!item.name || e.target.name === 'o' || e.target.name === 'i') return
  if (sketch.selected.isChild(item)) item = sketch.selected

  const off = {x:(item.position.x-e.point.x),y:(item.position.y-e.point.y)}

  if (sketch.selected.isChild(item)) {
    _.each(item.children, (c) => {
      if (!c instanceof p.Group) return
      cords = checkCords(c)
    })
  } else cords = checkCords(item)

  // recalculate offset after cord added to activeLayer
  // prepare cords for re-drawing inside event listener
    
  if (item==sketch.selected) { 
    _.each(sketch.cords, (cord) => {
      let a = sketch.boxes[cord.inlet]
      let b = sketch.boxes[cord.outlet]
      if (!sketch.selected.isChild(a)&&sketch.selected.isChild(b)) {
        if (sketch.selected.isChild(cord.item)) {
          itemDeselect(cord.item)
          p.project.activeLayer.addChildren([cord.item])
        }
        b.bringToFront()
        let top = b.children[4].position
        let bot = a.children[3].position
        cord.item.segments = [[top.x, top.y], [bot.x, bot.y]]
        p.view.draw()
      } else if (!sketch.selected.isChild(b)&&sketch.selected.isChild(a)) {
        if (sketch.selected.isChild(cord.item)) {
          itemDeselect(cord.item)
          p.project.activeLayer.addChildren([cord.item])
        }
        a.bringToFront()
        let top = b.children[4].position
        let bot = a.children[3].position
        cord.item.segments = [[top.x, top.y], [bot.x, bot.y]]
        p.view.draw()
      } else return
    })
  } else {
    if (!cords) return
    _.each(cords,(c) => {
      let top = (c.inlet===item.name) 
        ? item.children[3].position 
        : sketch.boxes[c.inlet].children[3].position
      let bot = (c.outlet===item.name) 
        ? item.children[4].position
        : sketch.boxes[c.outlet].children[4].position
      c.item.segments = [[top.x, top.y], [bot.x, bot.y]]
    })
  }

  window.onmousemove = (ev) => { // now draw cords!
    item.position = [ev.pageX+off.x, ev.pageY+off.y]
    p.view.draw()
  }
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
    name : 'o'
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
    name : 'i'
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
  box.name = id

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
  selection.bringToFront()
  selection.visible = true
  const c0 = [e.clientX, e.clientY] // 1st corner of selection
  window.onmousemove = function (ev) {
    const c1 = [(c3[0] - c0[0]) + c0[0], c0[1]]
    const c2 = [c0[0], (c3[1] - c0[1]) + c0[1]]
    const c3 = [ev.clientX, ev.clientY]
    selection.segments = [c0, c2, c3, c1]
    _.each(sketch.boxes, (b) => { 
      if (selection.intersects(b)) {
        if (sketch.selected.isChild(b)) return
        itemSelect(b) 
        sketch.selected.addChild(b)
      }
    })
    _.each(sketch.cords, (c) => {
      if (selection.intersects(c.item)) {
        if (sketch.selected.isChild(c.item)) return
        itemSelect(c.item) 
        sketch.selected.addChild(c.item)
      }
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

function itemDeselect (item) {
  if (item instanceof p.Group) {
    item.children[0].fillColor = 'rgba(0,0,255,0.2)'
    item.children[1].fillColor = 'blue'
    item.children[3].fillColor = 'blue'
    item.children[4].fillColor = 'blue'
  } else item.strokeColor = 'blue'
  p.view.draw()
}

function itemSelect (item) {
  if (item instanceof p.Group) {
    item.children[0].fillColor = 'rgba(255,0,0,0.4)'
    item.children[1].fillColor = 'rgba(0,0,0,0.6)'
    item.children[3].fillColor = 'rgba(255,0,0,0.8)'
    item.children[4].fillColor = 'rgba(255,0,0,0.8)'
  } else item.strokeColor = 'rgba(255,0,0,0.8)'
  p.view.draw()
}

export const s = through.obj((d,e,n) => {
  let id = cuid()
  sketch.boxes[id] = makeBox([100,100],d,id) 
  p.view.draw()
  n()
})

window.addEventListener('mouseup', windowMouseUp, false)
CVS.addEventListener('dblclick', (e) => {
  _.each(sketch.selected.children,itemDeselect)
  p.project.activeLayer.addChildren(sketch.selected.children)
}, false)
CVS.addEventListener('mousedown', select, false)
window.addEventListener('keydown', (e) => {
}, false)
