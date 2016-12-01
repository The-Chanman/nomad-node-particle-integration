const Nomad = require('nomad-stream')
const moment = require('moment')
const fetch = require('node-fetch')
const Particle = require('particle-api-js')

const credentials = require('./particle-login')

const particle = new Particle()
const nomad = new Nomad()

//Particle Device Setup
//IDEO Münich
const deviceID = '370034000f47343432313031'

// Pub data
// let pubdata = {Gas: "", Gas_Time: "", UV: "", UV_Time: ""}

// [Gas,UV,Time]

class MessageToPublish {
  constructor(arrayOfEventNames){
    this.data = {}
    for (let value of arrayOfEventNames){
      this.data[value]
    }
  }


}


let currentPublishData = null
const defaultPublishData = { gas: "", gasTime: "", uv: "", uvTime: "" }



function setTime() {
  return new moment()
}


let instance = null
let lastPub = null
const timeBetween = 10 * 1000 //10 seconds
const timeThreshold = 30 * 60 * 1000 // 30 minutes


particle.login(credentials).then(res => {
    let token = res.body.access_token
    console.log(`Got Token: ${token}`)
    return nomad.prepareToPublish()
  })
  .then((n) => {
    instance = n
    return instance.publishRoot('hello')
  })
  .then(() => {
    //declaring last publish date
    lastPub = setTime()
    return particle.getEventStream({ deviceId: deviceID, auth: token })
  })
  .then(s => {
    stream = s
    stream.on('event', data => {
      // console.log(data)
      console.log(data)



      // switch(data.name) {
      //   case 'Gas':
      //     pubdata.Gas = data.data
      //     pubdata.Gas_Time = data.published_at
      //     console.log(data)
      //     break;
      //   case 'UV':
      //     pubdata.UV = data.data
      //     pubdata.UV_Time = data.published_at
      //     console.log(data)
      //     break;
      //   default:
      //     console.log(data.name + " is value of " + data.data + " but not accounted for right now.")
      }
      // this determines frequency of transmission 
      let currentTime = setTime()
      let timeSince = currentTime - lastPub
      if (timeSince >= timeBetween){
        if (pubdata.Gas === "" || pubdata.Gas_Time === "" || pubdata.UV === "" || pubdata.UV_Time === ""){
          
        } else {
        // publish if everything is full
        console.log("***************************************************************************************")
        console.log(pubdata)
        console.log("***************************************************************************************")

        instance.publish(JSON.stringify(pubdata))
          .catch(err => console.log(`Error: ${JSON.stringify(err)}`))
        pubdata = {Gas: "", Gas_Time: "", UV: "", UV_Time: ""}
        lastPub = currentTime
        }
      }
      // if haven't receieved anything in the time frame
      if (timeSince >= timeThreshold){
        //publish what we got
        instance.publish(JSON.stringify(pubdata))
          .catch(err => console.log(`Error: ${JSON.stringify(err)}`))
      }

    })
  })
  .catch(err => console.log(`Error: ${JSON.stringify(err)}`))



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


