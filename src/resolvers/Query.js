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
    //----------------------  Freetime  -------------------------//
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
    },
    //----------------------  Schedule  -------------------------//
    schedule(parent, args, { prisma, request }, info) {
        return prisma.query.schedule({
            where: {
                schedule_No: args.schedule_No
            }
        }, info)
    },
    schedule_day(parent, args, { prisma, request }, info) {
        return prisma.query.schedule_Day({
            where: {
                day_No: args.day_No
            }
        }, info)
    },
    schedule_staff(parent, args, { prisma, request }, info) {
        return prisma.query.schedule_Staff({
            where: {
                id: args.id
            }
        }, info)
    },
    schedule_interval(parent, args, { prisma, request }, info) {
        const { start, end } = args
        return prisma.query.schedule_intervals({
            where: {
                start,
                end
            }
        }, info)
    }
}

export { Query as default }