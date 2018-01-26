'use strict'
const cla = require('command-line-args')
const fieldmap = require('./fieldmap')

const optionDefinitions = [
    { name: 'invitationId', alias: 'i', type: Number, defaultOption: true },
    { name: 'callId', alias: 'c', type: Number}
]

const argc = cla(optionDefinitions)

const mapping = fieldmap.match(argc.callId, argc.invitationId)
mapping.then(res => {
    console.log(res)
    process.exit(1)
})
