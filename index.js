// i love you Chavela Vargas. i love you Frida Kahlo.

var BrowserWindow = require('browser-window')
var app = require('app')
var mainWindow

require('crash-reporter').start()

function init () {
  mainWindow = new BrowserWindow({
    'auto-hide-menu-bar' : true,
    width : 1440,
    height : 900
  })
  mainWindow.loadURL('file://' + __dirname + '/index.html')
  mainWindow.on('closed', function() { mainWindow = null })
  // mainWindow.openDevTools()
}

app.on('window-all-closed', function() {
  if (process.platform != 'darwin') app.quit() 
})

app.on('ready', init)
