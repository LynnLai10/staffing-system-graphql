import getUserId from '../utils/getUserId'
const Query = {
    async users(parent, args, { prisma, request}, info) {
        const userId = getUserId(request)
        const user = await prisma.query.user({
            where: {
                id: userId
            }
        }, '{ accountType }')

        if (user.accountType === 'Admin') {
            return prisma.query.users({ orderBy: args.orderBy }, info)
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