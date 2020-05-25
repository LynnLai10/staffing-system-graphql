import bcrypt from 'bcryptjs'
import hashPassword from '../utils/hashPassword'
import generateToken from '../utils/generateToken'
import getUserId from '../utils/getUserId'

const Mutation = {
    async createUser(parent, args, { prisma }, info) {
        if (args.auth !== 'Eg80949597') {
            throw new Error('Authentication required.')
        }
        const employeeIdTaken = await prisma.exists.User({ employeeId: args.data.employeeId })
        const password = await hashPassword(args.data.password)

        if (employeeIdTaken) {
            throw new Error('EmployeeId taken!')
        }

        const user = await prisma.mutation.createUser({
            data: {
                ...args.data,
                password
            } 
        })
        return {
            user,
            token: generateToken(user.id)
        }
    },
    async login(parent, args, { prisma }, info) {
        const user = await prisma.query.user({
            where: {
                employeeId: args.data.employeeId
            }
        })

        if (!user) {
            throw new Error('Unable to Login!')
        }

        const isMatch = await bcrypt.compare(args.data.password, user.password)

        if (!isMatch) {
            throw new Error('Unable to Login!')
        }

        return {
            user,
            token: generateToken(user.id)
        }
    },
    async updateUser(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)

        if (typeof args.data.password === 'String') {
            args.data.password = await hashPassword(args.data.password)
        }
        return prisma.mutation.updateUser({
            where: {
                employeeId: args.employeeId
            },
            data: args.data
        }, info)
    },
    async deleteUser(parent, args, { prisma, request }, info) {
        return prisma.mutation.deleteUser({
            where: {
                employeeId: args.employeeId
            }
        })
    }

}

export { Mutation as default }