const SUCCESS = "success"
const FAILED = "failed"
const ERROR = "error"

const PENDING = 'pending'
const PAID = 'paid'
const REJECTED = "rejected"
const CANCELLED = "cancelled"

const InREVIEW = 'inReview'
// 200, 201 ==> added 400 ===> bad request client error 401 ==> not authorized 404 notfound
// status,  data, msg, (statusCode),

export { SUCCESS, FAILED, ERROR, PENDING, PAID, REJECTED, CANCELLED, InREVIEW };
export default { SUCCESS, FAILED, ERROR, PENDING, PAID, REJECTED, CANCELLED };