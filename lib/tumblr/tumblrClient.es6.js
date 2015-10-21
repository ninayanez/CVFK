import conf from './tumblrConf.json'
import tumblr from 'tumblr.js'
import through from 'through2'


export let client = tumblr.createClient(conf.auth)

export let tumblrClient = through.obj(function (d,e,n) {
  const stream = this
  if (!(d instanceof Object)) return
  const FN = Object.keys(d)[0]
  if (!client[FN]) return
  const PARAMS = d[FN]
  console.log(FN, PARAMS)
  function handleResponse (e, r) {
    if (e) console.error(e)
    stream.push(r)
    n()
  }
  if (FN !== 'dashboard') client[FN](conf.blog, PARAMS, handleResponse)
  else client[FN](PARAMS, handleResponse)
})

export let spec = { // api calls & their parameters  
  dashboard : {
    limit : 0,
    offsett : 0,
    type : '',
    'since_id' : 0,
    'reblog_info' : false,
    'notes_info' : false
  },
  photo : {
    caption : '',
    link : '',
    source : '',
    data : [''],
    data64 : ''
  },
  quote : {
    quote : '',
    source : ''
  },
  link : {
    title : '',
    url : '',
    description : ''
  },
  chat : {
    title : '',
    conversation : ''
  },
  audio : {
    caption : '',
    'external_url' : 0,
    data : '',
  },
  video : {
    caption : '',
    embed : '',
    data : ''
  }
}
