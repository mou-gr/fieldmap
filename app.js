'use strict'
const cla = require('command-line-args')
const fieldmap = require('./fieldmap')

const optionDefinitions = [
    // { name: 'verbose', alias: 'v', type: Boolean },
    // { name: 'src', type: String, multiple: true, defaultOption: true },
    // { name: 'timeout', alias: 't', type: Number
    { name: 'invitationId', alias: 'i', type: Number, defaultOption: true }

]

const argc = cla(optionDefinitions)

const mapping = fieldmap.match(argc.invitationId)
mapping.then(res => {
    console.log(res)
    process.exit(1)
})
