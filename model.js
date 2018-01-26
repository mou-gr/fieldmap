'use strict'
const sql = require('mssql')
const credentials = require('./config')
const R = require('ramda')

const config = credentials.config

const getConnection = function() {
    return sql.connect(config)
}
const closeConnection = function() {
    return sql.close()
}
const query = function(pool, str) {
    return pool.request().query(str)
}
const getInvitation = function (pool, invitationId) {
    return query(pool, `select JsonData from invitation where ID = ${invitationId}`)
        .then(R.prop('recordset'))
}
const getAllKeys = function (pool, callId) {
    return query(pool, `select DataKey from JsonData where CallID = ${callId}`)
        .then(R.prop('recordset'))
        .then(R.pluck('DataKey'))
}
const splitKey = R.pipe(
    R.split('_')
    , R.scan((a, b) => a === '' ? b : `${a}_${b}`, '')
    , R.tail
)
const getAllJson = function (pool, keys) {
    return R.pipe(
        R.map(splitKey)
        , R.flatten
        , R.uniq
        , R.map(a => `'${a}'`)
        , R.join(',')
        , a => `(${a})`
        , keysString => query(pool, `select DataKey, Data from JsonData where DataKey in ${keysString}`)
    )(keys)
        .then( R.prop('recordset') )
        .then( R.groupBy(a => a.DataKey) )
        .then( R.map(a => JSON.parse(a[0].Data)) )
}

const getJsonList = function (pool, callId) {
    const q = `select * from JsonData where CallID = ${callId}`
    return query(q, pool)
}
const getInvitationList = function (pool) {
    const q = `select Name from Invitation`
    return query(q, pool)
}

module.exports = {getConnection, closeConnection, getInvitationList, getJsonList, getAllJson, getAllKeys, getInvitation, splitKey}
