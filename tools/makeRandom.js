const makeRandom = (min = 0, max = 9, length = 4) => {
    let randomNumber = '';
    for (let i = 0; i < length; i++) {
        randomNumber += Math.floor(Math.random() * (max - min + 1)) + min;
    }
    return randomNumber;
}

module.exports = makeRandom