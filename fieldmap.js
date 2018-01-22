'use strict'
const model = require('./model')


const match = async function (invitationId) {
    const pool = await model.getConnection()
    const invitationList = await model.getInvitationList(pool)
    const json = await model.getMergedJson(pool, 204)

    return
}

module.exports = {match}
