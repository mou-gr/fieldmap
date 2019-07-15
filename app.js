'use strict'
const cla = require('command-line-args')
const fieldmap = require('./fieldmap')
const model = require('./model')

const optionDefinitions = [
    { name: 'invitationId', alias: 'i', type: Number, defaultOption: true },
    { name: 'callId', alias: 'c', type: Number}
]

const argc = cla(optionDefinitions)

const updateDb = async function (callId, invitationId) {

    const pool = await model.getConnection()

    const mapping = await fieldmap.match(pool, callId, invitationId)

    await model.deleteExisting(pool, callId, invitationId)
    const res = mapping.map(el => model.insertFields(pool, callId, invitationId, el.callPhaseId, el.tableName1, el.tableName2, '', el.datafilter, el.category, el.name, el.label, el.etype))
    await Promise.all(res)

    model.closeConnection()

    console.log('db updated succesfully')
    process.exit(1)
}

updateDb(argc.callId, argc.invitationId)
// updateDb(204, 1)
