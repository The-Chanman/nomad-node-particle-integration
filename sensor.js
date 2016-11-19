const Nomad = require('nomad-stream')
const moment = require('moment')
const nomad = new Nomad()
const fetch = require('node-fetch')

let instance = null
const frequency = 60 * 60 * 1000

// parse into url object 
let base = 'http://erddap.exploratorium.edu:8080/erddap/tabledap/exploreusgsdata.json?time,temperature,specific_conductance,salinity,turbidity,dissolved_o2,station_id,latitude,longitude&time>='

function buildUrl() {
  const d = new moment()
  const hourAgo = d.subtract(6, 'h')
  const timeString = hourAgo.toISOString()
  const url = `${base}${timeString}`
  const encoded = encodeURI(url)
  return encoded
}

function transform(json) {
  let transformed = {}
  transformed['columnNames'] = json.table.columnNames
  transformed['columnTypes'] = json.table.columnTypes
  transformed['columnUnits'] = json.table.columnUnits
  transformed['data'] = json.table.rows[0]
  return transformed
}

// returns promise
function getMessage() {
  const url = buildUrl()
  return fetch(url).then(res => {
    return res.json();
  }).then(json => {
    const formatted = transform(json)
    return Promise.resolve(JSON.stringify(formatted))
  }).catch(err => {
    console.log(err)
    return Promise.reject(err)
  })
}

nomad.prepareToPublish().then((n) => {
  instance = n
  return instance.publishRoot('hello')
}).then(() => {
  setInterval(() => {
    getMessage().then(m => {
      instance.publish(m)
      .catch(err => {
        console.log(`Error: ${err}`)
      })
    })
    .catch(err => {
      console.log(`Error: ${err}`)
    })
  }, frequency)  
})

