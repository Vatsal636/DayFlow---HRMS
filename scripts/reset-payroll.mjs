// Delete all payroll records to start fresh
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetPayroll() {
    try {
        const deleted = await prisma.payroll.deleteMany({})
        console.log(`✓ Deleted ${deleted.count} payroll records`)
        console.log('✓ Payroll system reset! Use Admin panel to generate new payrolls.')
        
    } catch (error) {
        console.error('Error resetting payroll:', error)
    } finally {
        await prisma.$disconnect()
    }
}

resetPayroll()
