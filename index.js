var app = require('app')
var BrowserWindow = require('browser-window')
var conf = require('./app.conf')
var mainWindow

require('crash-reporter').start()

function init () {
  mainWindow = new BrowserWindow({
    'auto-hide-menu-bar':true,
    width: 800,
    height: 600
  })
  mainWindow.loadUrl('file://' + __dirname + '/index.html')
  // mainWindow.openDevTools()
  mainWindow.on('closed', function() { mainWindow = null })
}

app.on('window-all-closed', function() {
  if (process.platform != 'darwin') app.quit() 
})

app.on('ready', init)
