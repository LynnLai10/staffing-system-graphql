import bcrypt from 'bcryptjs'

const hashPassword = (password) => {
    if (password.length < 4 ) {
        throw new Error('Password must be 4 charactor or more.')
    }
    return bcrypt.hash(password, 10)
}

export { hashPassword as default }