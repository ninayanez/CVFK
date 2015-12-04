import _ from 'underscore'
import fs from 'fs'

const folder = fs.readdirSync('./lib')

let moduleList = {}

// watch module filesystem path?

export default function () {
  _.each(folder, (file) => { // load modules
    const path = './lib/'+file
    const stat = fs.statSync(path)
    if (stat.isDirectory()) {
      if (fs.existsSync(path+'/package.json'))
        moduleList[file] = require('./'+file+'/package.json')
    }
  })
  return moduleList
}
