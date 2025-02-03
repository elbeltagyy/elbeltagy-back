// query.role ? match.role = { $regex: query.role, $options: "i" } : null

const makeMatch = (match, params) => {

    if (params.length === 0) return match

    params?.map(param => {
        if (String(param.value).includes("_split_")) {
            const valueSplitted = param.value.split("_split_")
            param.operator = valueSplitted[0]
            param.value = valueSplitted[1] ?? ''
        }


        if (param.type === 'array') {
            if (param.operator === '=!' || param.operator === '!=') {
                param.value ? match[param.key] = { $nin: [param.value] } : null
            } else {
                param.value ? match[param.key] = { $in: [param.value] } : null
            }
            return
        }

        if (typeof param?.value === 'string' && param?.value?.startsWith('!')) {
            param.value ? match[param.key] = { $ne: param.value.split("!")[1] } : null
            return
        }
        if (param.type === "boolean") {
            if (param.value === 'all' || param.value === 'All') return

            param.value ? match[param.key] = (param.value === 'true') : null
            return
        }

        if (param.type === "number") {

            if (param.operator === '>=') {
                param.value ? match[param.key] = { $gte: Number(param.value) } : null
            } else if (param.operator === '<=') {
                param.value ? match[param.key] = { $lte: Number(param.value) } : null
            } else if (param.operator === '>') {
                param.value ? match[param.key] = { $gt: Number(param.value) } : null
            } else if (param.operator === '<') {
                param.value ? match[param.key] = { $lt: Number(param.value) } : null
            } else if (param.operator === '=!' || param.operator === '!=') {
                param.value ? match[param.key] = { $ne: Number(param.value) } : null
            } else if ((Number(param.value) || Number(param.value) === 0)) {
                param.value ? match[param.key] = Number(param.value) : null
            }
            return
        }
        if (param.operator === "equal") {
            param.value && param.value !== "All" && param.value !== "all"
                ? match[param.key] = param.value : null

        } else {
            param.value && param.value !== "All" && param.value !== "all"
                ? match[param.key] = { $regex: param.value, $options: "i" } : null
        }

    })

    return match
}
// else if (param.operator === 'inArray') {
//     console.log(param.value)
//     param.value ? match[param.key] = { $in: param.value || [] } : null
//     return
// } 
const addQuery = (match, param) => {
    return match[param.key] = param.value
}

module.exports = { makeMatch, addQuery }