import decodeToken from './decodeToken'

const getUserId = (request, requireAuth = true) => {
    const header = request.request.headers.authorization

    if (header) {
        return decodeToken(header).userId
    }

    if (requireAuth) {
        throw new Error('Authentication required')
    } 
    
    return null
}

export { getUserId as default }