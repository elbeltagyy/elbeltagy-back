const clearTokens = async (req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        signed: true,
    });

    res.clearCookie('u');
};

module.exports = clearTokens