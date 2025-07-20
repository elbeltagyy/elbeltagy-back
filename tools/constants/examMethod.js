const examMethods = [
    { value: 'question', label: 'تصحيح كل سؤال على حده', markQ: true }, //time for Every Q + fixed Can`t skip //fixedPagination: true,
    { value: 'Exam', label: 'تصحيح كاختبار', markQ: false } // time for All || can correct it individually
]

const defaultVal = examMethods[1].value

const getExamMethod = ({ methodValue, isDefault = false, key = null }) => {

    if (methodValue === true || isDefault) {
        methodValue = defaultVal
    }
    const methodFound = examMethods.find(method => method.value === methodValue)
    if (key) {
        return methodFound[key]
    }
    return methodFound
}

module.exports = { examMethods, getExamMethod }