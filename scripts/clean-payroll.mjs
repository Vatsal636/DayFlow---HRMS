// Clean up dummy payroll data
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanPayroll() {
    try {
        // Get all users with their joining dates
        const users = await prisma.user.findMany({
            include: { details: true }
        })

        for (const user of users) {
            if (user.details?.joiningDate) {
                const joiningDate = new Date(user.details.joiningDate)
                const joiningYear = joiningDate.getFullYear()
                const joiningMonth = joiningDate.getMonth()

                // Delete payrolls before joining date
                const deleted = await prisma.payroll.deleteMany({
                    where: {
                        userId: user.id,
                        OR: [
                            { year: { lt: joiningYear } },
                            {
                                AND: [
                                    { year: joiningYear },
                                    { month: { lt: joiningMonth } }
                                ]
                            }
                        ]
                    }
                })

                console.log(`✓ Cleaned ${deleted.count} invalid payroll records for user ${user.employeeId}`)
            }
        }

        console.log('✓ Payroll cleanup completed!')
        
    } catch (error) {
        console.error('Error cleaning payroll:', error)
    } finally {
        await prisma.$disconnect()
    }
}

cleanPayroll()
