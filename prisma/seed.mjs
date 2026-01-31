import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = await bcrypt.hash('admin123', 10)

    const admin = await prisma.user.upsert({
        where: { email: 'admin@dayflow.com' },
        update: {},
        create: {
            email: 'admin@dayflow.com',
            employeeId: 'ADMIN001',
            password: password,
            role: 'ADMIN',
            isActive: true,
            firstLogin: false,
            details: {
                create: {
                    firstName: 'System',
                    lastName: 'Admin',
                    jobTitle: 'Super Admin',
                    department: 'IT',
                    joiningDate: new Date(),
                }
            }
        },
    })

    console.log({ admin })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
