'use strict'
const sql = require('mssql')
const credentials = require('./config')

const config = credentials.config

const getConnection = function() {
    return sql.connect(config)
}
const closeConnection = function() {
    return sql.close()
}

const query = function(str, pool) {
    return pool.request().query(str)    
}
const getMergedJson = function (pool, callId) {
    const qGetKeys = `select DataKey from JsonData where CallID = ${callId}`
    return query(pool, qGetKeys)
        .then(res => res.recordset)
}

const getJsonList = function (pool, callId) {
    const q = `select * from JsonData where CallID = ${callId}`
    return query(q, pool)
}
const getInvitationList = function (pool) {
    const q = `select Name from Invitation`
    return query(q, pool)
}

module.exports = {getConnection, closeConnection, getInvitationList, getJsonList, getMergedJson}
