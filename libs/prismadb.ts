import { PrismaClient } from '@prisma/client'

declare global {
    // eslint-disable-next-line no-var
    var prismadb: PrismaClient
}

const client = globalThis.prismadb || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalThis.prismadb = client

export default client
