import conf from './conf.json'
import tumblr from 'tumblr.js'
import through from 'through2'

export default class Tumblr {
  constructor (opts) {
    this.id = opts.id
    this.edit = (o) => {
      let pos = o.point
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
