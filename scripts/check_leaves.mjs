import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkLeaves() {
    try {
        const leaves = await prisma.leaveRequest.findMany({
            where: {
                status: 'APPROVED'
            },
            select: {
                id: true,
                userId: true,
                type: true,
                startDate: true,
                endDate: true
            },
            orderBy: { startDate: 'desc' },
            take: 20
        })

        console.log('=== APPROVED LEAVES ===')
        console.log(`Total found: ${leaves.length}\n`)

        leaves.forEach(leave => {
            const start = new Date(leave.startDate)
            const end = new Date(leave.endDate)
            const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1
            
            console.log(`ID: ${leave.id}`)
            console.log(`  User ID: ${leave.userId}`)
            console.log(`  Type: "${leave.type}"`)
            console.log(`  Start: ${leave.startDate.toISOString().split('T')[0]}`)
            console.log(`  End: ${leave.endDate.toISOString().split('T')[0]}`)
            console.log(`  Days: ${days}`)
            console.log('')
        })
        
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkLeaves()
