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

let currentPublishData = null
let instance = null
let lastPub = null

const defaultPublishData = { Gas: "", GasUnits: "parts per million", GasTime: "", UV: "", UVUnits: "nm", UVTime: "" }
const timeBetween = 10 * 1000 //10 seconds
const timeThreshold = 30 * 60 * 1000 // 30 minutes

class DataMaintainer {
  constructor(){
    currentPublishData = defaultPublishData
  }
  setValue(key, value){
    if(currentPublishData === undefined){
      console.log('Recieved invalid key:', key)
      break
    }
    currentPublishData[key] = value
  }
  getAll(){
    return currentPublishData
  }
  isAllFilled(){
    return currentPublishData["gas"] && currentPublishData["gasTime"] && currentPublishData["uv"] && currentPublishData[uvTime]
  }
  clear(){
    currentPublishData = defaultPublishData
  }
  toString(){
    return JSON.stringify(currentPublishData)
  }
}

function setTime() {
  return new moment()
}

//init data manager
let dataManager = new DataMaintainer()

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
      dataManager.setValue(data.name, data.data)
      dataManager.setValue(data.name + "Time", data.published_at)
      // this determines frequency of transmission 
      let currentTime = setTime()
      let timeSince = currentTime - lastPub
      if (timeSince >= timeBetween){
        if (dataManager.isAllFilled){
        // publish if everything is full
        console.log("***************************************************************************************")
        console.log(dataManager.getAll())
        console.log("***************************************************************************************")

        instance.publish(dataManager.toString())
          .catch(err => console.log(`Error: ${JSON.stringify(err)}`))
        dataManager.clear()  
        lastPub = currentTime
        }
      }
      // if haven't receieved anything in the time frame
      if (timeSince >= timeThreshold){
        //publish what we got
        instance.publish(dataManager.toString())
          .catch(err => console.log(`Error: ${JSON.stringify(err)}`))
        dataManager.clear()  
        lastPub = currentTime
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


