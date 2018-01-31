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
        .catch(err => {
            console.log(str)
            console.log(err)
            process.exit(-1)
        })
}
const getInvitation = function (pool, invitationId) {
    return query(pool, `select JsonData from invitation where ID = ${invitationId}`)
        .then(R.prop('recordset'))
}
const getAllKeys = function (pool, callId) {
    return query(pool, `select CallPhaseID, DataKey from JsonData where CallID = ${callId}`)
        .then(R.prop('recordset'))
        // .then(R.pluck('DataKey'))
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
    return query(pool, q)
}
const getInvitationList = function (pool) {
    const q = `select Name from Invitation`
    return query(pool, q)
}
const deleteExisting = function (pool, callId, invitationId) {
    const q = `delete from JsonData_Explained where callId = ${callId} and invitationId = ${invitationId}`
    return query(pool, q)
}
const insertFields = function (pool, callId, invitationId, callPhaseId, tableName1, tableName2, tableName3, datafilter, category, columnName, label, etype) {
    const q = `insert into JsonData_Explained
        (CallId, invitationId, CallPhaseId, TableName1, tableName2, tableName3, datafilter, CpCategory, ColumnName, Label, Etype)
        values
        (
            ${callId},
            ${invitationId == 0 ? 'NULL' : invitationId},
            ${callPhaseId === undefined ? 'NULL' : callPhaseId},
            '${tableName1}', '${tableName2}', '${tableName3}',
            @datafilter,
            ${category === undefined ? 'NULL' : category},
            '${columnName}', '${label}', '${etype}')`
    //return query(pool, q)
    return pool.request()
        .input('datafilter', sql.VarChar(50), datafilter)
        .query(q)
        .catch(err => {
            console.log(q)
            console.log(err)
            process.exit(-1)
        })
}


module.exports = {getConnection, closeConnection, getInvitationList, getJsonList, getAllJson, getAllKeys, getInvitation, splitKey, deleteExisting, insertFields}
