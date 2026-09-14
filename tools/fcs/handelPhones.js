const { parsePhoneNumberFromString, parsePhoneNumberWithError } = require('libphonenumber-js');


const getInternational = (nationalPhone, meta = {}) => {

    const { withPlus = false, country = 'EG', code = '20' } = meta
    const another = code ? { defaultCallingCode: code } : country

    const number = parsePhoneNumberWithError(nationalPhone, another).formatInternational().replace(/\s+/g, '')
    if (withPlus) {
        return number
    }
    return number.split('+')[1]
}

const getNational = (internationalPhone) => {
    if (!internationalPhone.startsWith('+')) {
        internationalPhone = '+' + internationalPhone
    }
    const number = parsePhoneNumberWithError(internationalPhone).formatNational().replace(/\s+/g, '')
    return number
}

module.exports = { getInternational, getNational }