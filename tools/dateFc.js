const ms = require("ms")

const DAYES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

const dateOptions = {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Africa/Cairo',

}

const dateWithTimeOptions = {
    ...dateOptions,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
}

const getFullDate = (date) => {
    return new Date(date).toLocaleDateString("ar-eg", dateOptions)
}

const getDateWithTime = (date) => {
    return new Date(date).toLocaleDateString("ar-eg", dateWithTimeOptions)
}

const convertToMs = (duration) => {
    let milliSeconds = 0
    if (typeof duration === 'number') return duration

    let durArr = duration.split(' ')

    if (Array.isArray(durArr)) {
        durArr?.map(unit => {
            milliSeconds = milliSeconds + ms(unit)
        })
    } else {
        milliSeconds = milliSeconds + ms(duration)
    }
    return milliSeconds
}

const formatDuration = (ms, isSeconds = false, separated) => {
    let milliSeconds = ms
    if (/[a-zA-Z]/.test(ms)) {
        // Run something if there is a letter
        milliSeconds = convertToMs(ms)
        isSeconds = false
    }

    // Calculate total seconds from milliseconds
    let totalSeconds = milliSeconds
    if (!isSeconds) {
        totalSeconds = Math.floor(milliSeconds / 1000);
    }

    // Calculate hours, minutes, and seconds
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');

    if (separated) {
        let h = (!hours || hours !== '00') && Number(hours) + 'h' || ""
        let m = (!minutes || minutes !== '00') && Number(minutes) + 'm' || ""
        let s = (!seconds || seconds !== '00') && Number(seconds) + 's' || ""
        return h + ' ' + m + ' ' + s

    } else {
        return `${hours}:${minutes}:${seconds}`
    }
}


module.exports = { getDateWithTime, getFullDate, formatDuration, convertToMs }