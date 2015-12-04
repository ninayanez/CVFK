import twilio from 'twilio'
import through from 'through2'

let client = new twilio.RestClient(conf.twilSid, conf.twilAuth)

client.messages.create(msg, cb)

