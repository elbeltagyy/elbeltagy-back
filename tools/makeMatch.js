const makeMatch = (match, params) => {

    if (params.length === 0) return match

    params?.map(param => {
        if (Array.isArray(param.value) || String(param.value)?.includes(',')) {
            if (!Array.isArray(param.value) && String(param.value)?.includes(',')) {
                console.log(param.value)
                param.value = param.value?.split(',')
            }

            param.value.forEach((value) => {
                handelMatch(value, match, param.key, 'array', param.operator)
            })
            return
        }
        handelMatch(param.value, match, param.key, param.type, param.operator)
    })

    return match
}

const handelMatch = (value, match, key, type, operator) => {

    if (String(value).includes("_split_")) {
        [operator, value] = value.split("_split_")
    }


    if (type === 'array') {
        if (operator === '=!' || operator === '!=') {
            const ninQs = match[key]?.$nin || []
            value ? match[key] = { $nin: [...ninQs, value] } : null
        } else {
            const inQs = match[key]?.$in || []
            value ? match[key] = { $in: [...inQs, value] } : null
        }
        return
    }

    if (typeof value === 'string' && (value?.startsWith('!') || operator === '=!' || operator === '!=')) {
        value ? match[key] = { $ne: value.split("!")[1] } : null
        return
    }

    if (type === "boolean") {
        if (value === 'all' || value === 'All') return

        value || value === false ? match[key] = (value === 'true' || value === true) : null
        return
    }

    if (type === "number") {

        if (operator === '>=') {
            value ? match[key] = { $gte: Number(value) } : null
        } else if (operator === '<=') {
            value ? match[key] = { $lte: Number(value) } : null
        } else if (operator === '>') {
            value ? match[key] = { $gt: Number(value) } : null
        } else if (operator === '<') {
            value ? match[key] = { $lt: Number(value) } : null
        } else if (operator === '=!' || operator === '!=' || operator === 'not') {
            value ? match[key] = { $ne: Number(value) } : null
        } else if ((Number(value) || Number(value) === 0)) {
            value ? match[key] = Number(value) : null
        }
        return
    }

    if (operator === "equal") {
        value && value !== "All" && value !== "all"
            ? match[key] = value : null

    } else {
        value && value !== "All" && value !== "all"
            ? match[key] = { $regex: value, $options: "i" } : null
    }
}
module.exports = { makeMatch }