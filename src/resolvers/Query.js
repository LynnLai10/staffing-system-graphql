import getUserId from '../utils/getUserId'
const Query = {
    async users(parent, args, { prisma, request}, info) {
        const employeeId = getUserId(request)
        const user = await prisma.query.user({
            where: {
                employeeId
            }
        }, '{ accountType }')
        if (user.accountType === 'Admin') {
            return prisma.query.users({ orderBy: args.orderBy }, info)
        } else {
            throw new Error('Permission denied.')
        }
    },
    me(parent, args, { prisma, request }, info) {
        const employeeId = getUserId(request)
        return prisma.query.user({
            where: {
                employeeId: employeeId
            }
        })
    },
    freetimes(parent, args, { prisma }, info) {
        return prisma.query.freetimes({ orderBy: args.orderBy }, info)
    },
    myFreetimes(parent, args, { prisma, request }, info) {
        const employeeId = getUserId(request)
        return prisma.query.freetimes({
            orderBy: args.orderBy,
            where: {
                user: {
                    employeeId
                }
            }
        }, info)
    }
}

export { Query as default }