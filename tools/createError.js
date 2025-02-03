const createError = (message, statusCode, status, isKick) => {
    const error = new Error()

    error.message = ' ! ' + message // if changed refresh token will change
    error.statusCode = statusCode
    error.status = status
    error.generated = true
    error.isKick = isKick

    return error
}

module.exports = createError