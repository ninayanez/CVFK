import conf from './conf.json'
import tumblr from 'tumblr.js'
import through from 'through2'

const BOX = document.createElement('div')
const NUM = document.createElement('input')
BOX.setAttribute('class','tumblr')
NUM.setAttribute('class','num')
NUM.value = 0
BOX.appendChild(NUM)
document.body.appendChild(BOX)

function inc (bool) {
  if (Math.abs(NUM.value)===0&&bool===false) return
  let val = (bool) 
    ? Math.abs(NUM.value)+1 
    : Math.abs(NUM.value)-1
  NUM.value = val
}

BOX.addEventListener('mousewheel', (e) => {
  if (e.wheelDelta===(-120)) inc(false)
  else if (e.wheelDelta===120) inc(true)
})

export default class Tumblr {
  constructor (opts) {
    this.id = opts.id
    this.edit = (o) => {
      BOX.style.left = o.point.x+'px'
      BOX.style.top = o.point.y+'px'
    }

    let client = tumblr.createClient(conf.auth)

    let s = through.obj((d,e,n) => {
      const FN = Object.keys(d)[0]
      const PARAMS = d[FN]
      if (!client[FN]) {n();return}

      function handleResponse (e,r) {
        if (e) console.error(e)
        s.push(r)
      }

      if (FN !== 'dashboard') client[FN](conf.blog, PARAMS, handleResponse)
      else client[FN](PARAMS, handleResponse)
      n()
    })

    this.s = s

    s.write({posts:{}})
  }
}

// const spec = { // api calls & their parameters  
//   dashboard : {
//     limit : 0,
//     offsett : 0,
//     type : '',
//     'since_id' : 0,
//     'reblog_info' : false,
//     'notes_info' : false
//   },
//   photo : {
//     caption : '',
//     link : '',
//     source : '',
//     data : [''],
//     data64 : ''
//   },
//   quote : {
//     quote : '',
//     source : ''
//   },
//   link : {
//     title : '',
//     url : '',
//     description : ''
//   },
//   chat : {
//     title : '',
//     conversation : ''
//   },
//   audio : {
//     caption : '',
//     'external_url' : 0,
//     data : '',
//   },
//   video : {
//     caption : '',
//     embed : '',
//     data : ''
//   }
// }
