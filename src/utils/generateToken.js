import jwt from 'jsonwebtoken'

const generateToken = (employeeId) => {
    return jwt.sign({ employeeId }, process.env.JWT_SECRET, { expiresIn: '7 days' })
}

export { generateToken as default }