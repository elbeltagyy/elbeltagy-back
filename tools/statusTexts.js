const SUCCESS = "success"
const FAILED = "failed"
const ERROR = "error"
const PENDING = 'pending'
const PAID = 'paid'
const REJECTED = "rejected"

// 200, 201 ==> added 400 ===> bad request client error 401 ==> not authorized 404 notfound
// status,  data, msg, (statusCode),

module.exports = {
    SUCCESS, FAILED, ERROR, PENDING, PAID, REJECTED
}