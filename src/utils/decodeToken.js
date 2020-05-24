import jwt from 'jsonwebtoken'
const decodeToken = async (header) => {
    const token = header.replace('Bearer ', '')
    return decoded = jwt.verify(token, process.env.JWT_SECRET)
}

export { decodeToken as default }