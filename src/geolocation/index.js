import through from 'through2'

export default class GeoLocation {
  constructor (opts) {
    this.id = opts
    let s = through.obj((d,e,n)=>{
      if (d=='!') 
        navigator.geolocation.getCurrentPosition((pos) => { 
          s.push({
            accuracy:pos.coords.accuracy,
            lat:pos.coords.latitude,
            long:pos.coords.longitude
          })
        })
      n()
    })
    this.s = s
    this.edit = (o) => {

    }
  }
}
