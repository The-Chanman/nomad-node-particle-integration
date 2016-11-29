const Nomad = require('nomad-stream')
const moment = require('moment')
const nomad = new Nomad()
const fetch = require('node-fetch')

let instance = null
const frequency = 60 * 60 * 1000

// parse into url object 
let base = 'http://erddap.exploratorium.edu:8080/erddap/tabledap/explorebeaconbay5min.htmlTable?time%2CTemperature_1%2CAir_Pressure%2CTemperature_2%2CRelative_Humidity%2CDew_Point%2CO3_1%2CCO_1%2CNO2_1%2CO3_Working_2%2CO3_Auxiliary_2%2CCO_Working_2%2CCO_Auxiliary_2%2CNO_Working%2CNO_Auxiliary%2CNO_Auxiliary_2%2CNO2_Working_2%2CNO2_Auxiliary_2%2CParticulate_high%2CParticulate_total%2CParticulate_pct%2CCO2%2CTemperature_3%2Cstation_id%2Clatitude%2Clongitudetime>='
//'http://erddap.exploratorium.edu:8080/erddap/tabledap/exploreusgsdata.json?time,temperature,specific_conductance,salinity,turbidity,dissolved_o2,station_id,latitude,longitude&time>='

function buildUrl() {
  const d = new moment()
  const hourAgo = d.subtract(1, 'h')
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

