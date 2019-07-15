'use strict'
const R = require('ramda')
const model = require('./model')
const jsonHandler = require('./jsonExport')

const hide = function hide(metadata, message) {
    var ret = metadata
    ret.columns = metadata.columns.map(function (el) {
        el.view = ''
        el.edit = ''
        return el
    })
    ret.detail = ''
    ret.title = 'Δεν απαιτείται συμπλήρωση'
    ret.single = '1'
    ret.helptext = message || ''
    ret.edit = ''
    return ret
}

const parseCallData = function (callData) {
    var data = JSON.parse(callData)
    data.compiled = JSON.parse(data.compiled)

    return data
}

const groupByField = field => R.pipe(
    R.groupBy(R.prop(field))
    , R.pluck(0)
)

const mergeColumns = function (weak, strong) {
    const weakColumns = groupByField('name')(weak || [])
    const strongColumns = groupByField('name')(strong || [])
    const columns = R.mergeWith(R.merge, weakColumns, strongColumns)

    return (Object.values(columns))
}

const merge = function (weak, strong) {
    const columns = mergeColumns(weak.columns, strong.columns)
    const merged = Object.assign({}, weak, strong, {columns: columns})

    return merged
}
const expenseType = function expenseType(metadata, callData) {
    var index = metadata.columns.findIndex(function (el) {
        return el.name == 'Comments13'
    })
    if (index < 0) {
        return metadata
    }

    var column = metadata.columns[index]
    var list = callData.tab6.KATHGORIES_DAPANON_OBJ.KATHGORIES_DAPANON_LIST

    column.items = list.map(function (el) {
        return {val: el.AA, lab: el.AA + ' - ' + el.title, }
    })

    return metadata
}

var ratio = function ratio(metadata, callData) {
    var ratioList = callData.tab3
    var ratioListSize = ratioList.length

    if (ratioListSize == 0) {
        return metadata
    }

    for (var i = ratioListSize; i < 13; i++) {
        var nameOfIndex1 = 'Comments' + (i+1)
        var index1 = metadata.columns.findIndex(function (el1) {
            return el1.name == nameOfIndex1
        })
        var columnToHide = metadata.columns[index1]
        columnToHide.view = 0
        columnToHide.edit = 0
    }

    for (var r = 0; r < ratioListSize; r++) {
        var nameOfIndex2 = 'Comments' + (r + 1)
        var index2 = metadata.columns.findIndex(function (el2) {
            return el2.name == nameOfIndex2
        })
        var columnToRename = metadata.columns[index2]
        var columnWithName = callData.tab3[r]
        columnToRename.label = columnWithName.ONOMASIA_DEIKTH.split('&&')[1]
    }
    return metadata
}

var genericTransformation = function genericTransformation(metadata, callData) {

    var genericData = callData.compiled[metadata.customise]
    if (genericData === undefined) { return metadata }

    if (genericData.hidden == '1') {
        return hide(metadata, genericData.hiddenMessage)
    }
    var columns = mergeColumns(metadata.columns, genericData.columns)

    var hiddenArray = genericData.hiddenColumns instanceof Array ? genericData.hiddenColumns : []
    var hiddenColumns = hiddenArray.map(function (col) {
        return {name: col, edit:'', view:''}
    })
    var finalColumns = mergeColumns(columns, hiddenColumns)

    var finalData = merge(metadata, genericData)
    finalData.columns = finalColumns
    return finalData

}
const mergeCall = R.curry(function mergeCall(callData, metadata) {
    if (R.isEmpty(callData)) { return metadata }
    var transformationArray = {
        GenericCheckpoints_qCategory74_c204: [ratio]
        , GenericCheckpoints_qCategory81_c204: [expenseType]
    }

    var transformationChain = transformationArray[metadata.customise] || []
    transformationChain.push(genericTransformation)

    //call each function in transformationChain and transform metadata sequentially
    return transformationChain.reduce(function (res, transformation) {
        return transformation(res, callData)
    }, metadata)
})

const addCategory = function (form) {
    const categoryColumn = R.filter(col => col.name === 'CpCategory')(form.columns)
    return R.assoc('category', categoryColumn.length === 1 ? categoryColumn[0].value : null , form)
}


const removeHiddenColumns = R.reject(col => col.view === '' && col.edit === '')
const removeHiddenColumnsForm = form => R.assoc('columns', removeHiddenColumns(form.columns), form)

const explode = function (form) {
    return R.map(R.pipe(
        R.pick(['name', 'label', 'etype'])
        , R.merge( {category: form.category, datafilter: form.datafilter, tableName1: R.split('.', form.name)[0], tableName2: R.split('.', form.name)[1]} )
    ))(form.columns)
}

const match = async function (pool, callId, invitationId) {

    const callData = await model.getInvitation(pool, invitationId)
    const parsedCallData = callData.length === 1 ? parseCallData(callData[0].JsonData) : {}

    const keyArr = await model.getAllKeys(pool, callId)
    const keys = R.pluck('DataKey', keyArr)

    const json = await model.getAllJson(pool, keys)

    const finalData = R.map(
        R.pipe(
            model.splitKey
            , R.map(a => json[a])
            , R.reject(R.isNil)
            , R.reduce(merge, {columns: []})
            // , mergeCall(parsedCallData)
            , jsonHandler.specialMerge(parsedCallData)
            , addCategory
            , removeHiddenColumnsForm
            , explode
        )
    )(keys)

    return R.pipe(
        R.zipWith( (a, b) => R.map(R.assoc('callPhaseId', a.CallPhaseID)) (b)) (keyArr)
        , R.flatten
    )(finalData)

}

module.exports = {match}
