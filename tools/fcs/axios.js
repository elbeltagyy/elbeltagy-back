const axios = require('axios');
const axiosInstance = axios.create();

axiosInstance.interceptors.response.use(
    response => response,
    error => {
        const message =
            error.response?.data?.error?.message ||
            error.response?.data?.message ||
            error.message;

        const err = new Error(message);

        err.statusCode = error.response?.status || 500;
        err.data = error.response?.data;
        return Promise.reject(err);
    }
);

module.exports = axiosInstance