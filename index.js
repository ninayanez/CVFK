// i love you Chavela Vargas. i love you Frida Kahlo.

var electron = require('electron')
var BrowserWindow = electron.BrowserWindow
var app = electron.app
var mainWindow

function init () {
  mainWindow = new BrowserWindow({
    'auto-hide-menu-bar' : true,
    width : 800,
    height : 600
  })
  mainWindow.loadURL('file://' + __dirname + '/index.html')
  mainWindow.on('closed', function() { mainWindow = null })
  // mainWindow.openDevTools()
}

app.on('window-all-closed', function() {
  if (process.platform != 'darwin') app.quit() 
})

app.on('ready', init)
