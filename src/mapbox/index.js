import through from 'through2'
import conf from './conf.json'

// include css in module

export default class MapBox {
  constructor (opts) {
    this.id = opts.id
    mapboxgl.accessToken = conf.token

    const MAP = document.createElement('div')
    MAP.setAttribute('id','map')
    document.body.appendChild(MAP)

    let m = null
    let data = false

    m = new mapboxgl.Map({        
      container: 'map', // container id
      zoom:9,
      style: 'mapbox://styles/mapbox/streets-v8' //stylesheet location
    })

    let s = through.obj((d,e,n)=>{
      if (!data || d.accuracy != data.accuracy) {
        console.log(d)
        data = d
        m.setCenter([d.long, d.lat])
        m.setZoom(d.accuracy)
      }
      n()
    })

    this.edit = (o) => {
      MAP.style.left = o.point.x+'px'
      MAP.style.top = o.point.y+'px'
    }

    this.s = s
  }
}
