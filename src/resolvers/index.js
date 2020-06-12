// import { extractFragmentReplacements } from 'prisma-binding'
import Query from './Query'
import Mutation from './Mutation'
import Schedule from './Schedule'
import Freetime from './Freetime'

const resolvers = {
    Query,
    Mutation,
    Schedule,
    Freetime
}

// const fragmentReplacements = extractFragmentReplacements(resolvers)

export { resolvers }