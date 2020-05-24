import getUserId from '../utils/getUserId'
const Query = {
    async users(parent, args, { prisma, request}, info) {
        const userId = getUserId(request, false)
        const accountType = prisma.query.user({
            where: {
                id: userId
            }
        }, '{ accountType }')
        if (Object.values(accountType) === 'Admin') {
            return prisma.query.users(args.orderBy, info)
        } else {
            throw new Error('Permission denied.')
        }
    },
    me(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)
        return prisma.query.user({
            where: {
                id: userId
            }
        })
    }
}

export { Query as default }