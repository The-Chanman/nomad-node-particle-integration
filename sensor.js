const Nomad = require('nomad-stream')
const nomad = new Nomad()
const moment = require('moment')
const fetch = require('node-fetch')
const Particle = require('particle-api-js')
var particle = new Particle()
const credentials = require('./particle-login')


//Particle Device Setup
//IDEO Müich
const deviceID = '370034000f47343432313031'
const events = ['Gas', 'UV']

// Pub data
var pubdata = {Gas: "", Gas_Time: "", UV: "", UV_Time: ""}

let instance = null
var lastPub = 0
const timeBetween = 10000

function buildUrl() {
  const d = new moment()
  const hourAgo = d.subtract(2, 'h')
  const timeString = hourAgo.toISOString()
  const url = `${base}${timeString}`
  const encoded = encodeURI(url)
  return encoded
}


particle.login(credentials).then(res => {
  token = res.body.access_token
  console.log(`Got Token: ${token}`)

  return nomad.prepareToPublish()
}).then((n) => {
  instance = n
  return instance.publishRoot('hello')
}).then(() => {

  //declaring last publish data
  lastPub = new moment()
  return particle.getEventStream({ deviceId: deviceID, auth: token })
}).then(s => {
  stream = s
  stream.on('event', data => {
    // console.log(data)
    
    switch(data.name) {
    case 'Gas':
        pubdata.Gas = data.data
        pubdata.Gas_Time = data.published_at
        console.log(data)
        break;
    case 'UV':
        pubdata.UV = data.data
        pubdata.UV_Time = data.published_at
        console.log(data)
        break;
    default:
        console.log(data.name + " is value of " + data.data + " but not accounted for right now.")
    }
    // this determines frequency of transmission 
    var currentTime = new moment()
    if (currentTime - lastPub >= timeBetween){
      if (pubdata.Gas === "" || pubdata.Gas_Time === "" || pubdata.UV === "" || pubdata.UV_Time === ""){
      // do nothing
      } else {
      // publish if everything is full
      console.log("**********************************************************************************************")
      console.log(pubdata)
      console.log("**********************************************************************************************")

      instance.publish(JSON.stringify(pubdata))
      .catch(err => {
        console.log(`Error: ${JSON.stringify(err)}`)
      })

      pubdata = {Gas: "", Gas_Time: "", UV: "", UV_Time: ""}
      lastPub = currentTime
      }
    }
  })
}).catch(err => {
    console.log(`Error: ${JSON.stringify(err)}`)
})



// // returns promise
// function getMessage() {
//   const url = buildUrl()
//   return fetch(url).then(res => {
//   	console.log(res.body)
//     return res.json();
//   }).then(json => {
//     const formatted = transform(json)
//     return Promise.resolve(JSON.stringify(formatted))
//   }).catch(err => {
//     console.log(err)
//     return Promise.reject(err)
//   })
// }

// nomad.prepareToPublish().then((n) => {
//   instance = n
//   return instance.publishRoot('hello')
// }).then(() => {
//   setInterval(() => {
//     getMessage().then(m => {
//       instance.publish(m)
//       .catch(err => {
//         console.log(`Error: ${err}`)
//       })
//     })
//     .catch(err => {
//       console.log(`Error: ${err}`)
//     })
//   }, frequency)  
// })


