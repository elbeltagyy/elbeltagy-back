const getUnique = (array, by) => {
    return array.filter((ele, i) => {
        return i === array.findIndex((obj) => {
            return JSON.stringify(ele[by]) === JSON.stringify(obj[by])
        })
    })
}

module.exports = {getUnique}