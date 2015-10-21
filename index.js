var app = require('app')
var BrowserWindow = require('browser-window')
var fs = require('fs')
var conf = require('./.config.json')
var mainWindow

require('crash-reporter').start()

function init () {
  // convertES6()

  mainWindow = new BrowserWindow({
    'auto-hide-menu-bar':true,
    width: 800,
    height: 600
  })

  mainWindow.loadUrl('file://' + __dirname + '/index.html')
  mainWindow.webContents.on('did-finish-load', function () { })
  mainWindow.openDevTools()
  mainWindow.on('closed', function() {
    mainWindow = null;
  })
}

app.on('ready', init)

app.on('window-all-closed', function() {
  if (process.platform != 'darwin') app.quit() 
})
