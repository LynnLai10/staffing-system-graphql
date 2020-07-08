// import { extractFragmentReplacements } from 'prisma-binding'
import Query from './Query.js'
import Mutation from './Mutation.js'
import Schedule from './Schedule.js'
import Freetime from './Freetime.js'

const resolvers = {
    Query,
    Mutation,
    Schedule,
    Freetime
}

// const fragmentReplacements = extractFragmentReplacements(resolvers)

export { resolvers }