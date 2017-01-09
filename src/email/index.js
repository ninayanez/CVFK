import MailParser from 'mailparser'
import inbox from 'inbox'
import through from 'through2'

// POLL IMAP SERVER FOR EMAIL
var imap = inbox.createConnection(conf.imap.port,conf.imap.server,{
  secureConnection : true,
  auth : {
    user : conf.imap.user,
    pass : conf.imap.pass
  }
})

imap.on('connect', () => {
  imap.openMailbox('INBOX', (e,info) => {
    imap.on('new', function (msg) {
      let mp = new MailParser({streamAttachments : true})
      const uid = msg.UID
      mp.on('attachment', function (a,mail) {
        var output = fs.createWriteStream(
          './messages/'+uid+':'+a.generatedFileName)
        a.stream.pipe(output)
      })
      mp.on('end', function (mail) {
        db.put('mail:'+uid,JSON.stringify(mail,null,2))
      })
      imap.createMessageStream(uid).pipe(mp)
    })
  })
})

imap.connect()

let s = through.obj((d,e,n) => {
  let self = this
  self.queue(d)
  n()
})

export default s

import websocketStream from 'websocket-stream'
import nodemailer from 'nodemailer'
import smtpTransport from 'nodemailer-smtp-transport'
import conf from './remoteConf.json'

let wss = websocketStream('wss://theblacksea.cc:9999',
                          {rejectUnauthorized:false})

wss.on('data', (d) => { console.log(d.toString()) })

wss.write('client hi!')

let smtp = nodemailer.createTransport(smtpTransport({
  port : conf.smtp.port,
  host : conf.smtp.server,
  ignoreTLS : false,
  auth : {
    user : conf.smtp.user.name,
    pass : conf.smtp.user.pass
  }
}))

smtp.sendMail({
  from : conf.smtp.user.prettyName,
  to : 'n@theblacksea.cc',
  subject : 'test',
  text : 'hello this is a test',
  attachments : [
    {
      filename : 'caspy.jpg',
      path : './caspian.jpg'
    }
  ],
  xMailer : conf.smtp.user.xmailer
}, (e,i) => {
  if (i && i.response === '250 Message received') {
    console.log('YESSSSSSSSSSSS!')
  } else if (!e) console.log(i)
  else console.error(e)
})
