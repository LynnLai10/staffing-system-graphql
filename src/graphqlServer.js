import { GraphQLServer } from 'graphql-yoga'
import { resolvers } from './resolvers/index'
import prisma from './prisma'

const server = new GraphQLServer({
    typeDefs: './src/schema.graphql',
    resolvers,
    context(request) {
        return {
            prisma,
            request
        }
    }
})

export { server as default }