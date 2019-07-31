'use strict'
const cla = require('command-line-args')
const fieldmap = require('./fieldmap')
const model = require('./model')

const optionDefinitions = [
    { name: 'invitationId', alias: 'i', type: Number },
    { name: 'callId', alias: 'c', type: Number, defaultOption: true }
]

const argc = cla(optionDefinitions)

const updateDb = async function (callId, invitationId, pool) {

    const mapping = await fieldmap.match(pool, callId, invitationId)

    await model.deleteExisting(pool, callId, invitationId)
    const res = mapping.map(el => model.insertFields(pool, callId, invitationId, el.callPhaseId, el.tableName1, el.tableName2, '', el.datafilter, el.category, el.name, el.label, el.etype))
    await Promise.all(res)

    console.log(`db updated succesfully call ${callId} invitation ${invitationId}`)
}

const updateAll = async function (callId, pool) {
    const idList = await model.getAllInvitationIds(pool)
    for (const id of idList) {
        await updateDb(callId, id, pool)
    }
}

if (argc.callId == undefined) {
    console.error ('Please specify callId')
    process.exit(-1)
}

(async () => {
    const pool = await model.getConnection()
    argc.invitationId !== undefined ? 
        await updateDb(argc.callId, argc.invitationId, pool) :
        await updateAll(argc.callId, pool)
    model.closeConnection()
}) ().catch(err => {
    console.error(err)
    model.closeConnection()
    process.exit(-2)
})

// updateDb(argc.callId, argc.invitationId)
// updateDb(204, 1)
