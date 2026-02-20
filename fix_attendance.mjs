import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixAttendance() {
    try {
        console.log('🔧 Fixing attendance records...\n')

        // Fix Feb 4: Change from LEAVE to PRESENT and add check-in time
        const feb4Start = new Date('2026-02-04T00:00:00.000Z')
        const feb4End = new Date('2026-02-04T23:59:59.999Z')
        
        const updateResult = await prisma.attendance.updateMany({
            where: {
                userId: 4,
                date: {
                    gte: feb4Start,
                    lte: feb4End
                }
            },
            data: {
                status: 'PRESENT',
                checkIn: new Date('2026-02-04T05:30:00.000Z')
            }
        })
        
        console.log('✅ Feb 4: Updated', updateResult.count, 'record(s) - Status: PRESENT, CheckIn: 05:30 AM')

        // Check if Feb 6 has a record
        const feb6Start = new Date('2026-02-06T00:00:00.000Z')
        const feb6End = new Date('2026-02-06T23:59:59.999Z')
        
        const feb6Exists = await prisma.attendance.findFirst({
            where: {
                userId: 4,
                date: {
                    gte: feb6Start,
                    lte: feb6End
                }
            }
        })

        if (!feb6Exists) {
            await prisma.attendance.create({
                data: {
                    userId: 4,
                    date: new Date('2026-02-06T00:00:00.000Z'),
                    status: 'LEAVE'
                }
            })
            console.log('✅ Feb 6: Created LEAVE record')
        } else {
            console.log('✅ Feb 6: Record already exists (Status:', feb6Exists.status + ')')
        }

        // Verify the changes
        console.log('\n📊 Verification - Feb 1-20, 2026:')
        const allRecords = await prisma.attendance.findMany({
            where: {
                userId: 4,
                date: {
                    gte: new Date('2026-02-01T00:00:00.000Z'),
                    lte: new Date('2026-02-20T23:59:59.999Z')
                }
            },
            orderBy: { date: 'asc' },
            select: { date: true, status: true, checkIn: true }
        })

        console.log('\nAll Records:')
        allRecords.forEach(r => {
            const dateStr = r.date.toISOString().split('T')[0]
            const checkInStr = r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : 'none'
            console.log(`  ${dateStr}: ${r.status.padEnd(8)} CheckIn: ${checkInStr}`)
        })

        // Count by status
        let present = 0, late = 0, leave = 0, absent = 0
        allRecords.forEach(r => {
            const dayOfWeek = new Date(r.date).getDay()
            if (dayOfWeek === 0 || dayOfWeek === 6) return // Skip weekends

            if (r.status === 'LEAVE') {
                leave++
            } else if (r.status === 'PRESENT' && r.checkIn) {
                const checkIn = new Date(r.checkIn)
                const threshold = new Date(r.checkIn)
                threshold.setHours(9, 30, 0, 0)
                
                if (checkIn > threshold) late++
                else present++
            } else if (r.status === 'PRESENT') {
                present++
            } else if (r.status === 'ABSENT') {
                absent++
            }
        })

        // Calculate absent days (working days with no record)
        let workingDays = 0
        for (let d = 1; d <= 20; d++) {
            const date = new Date(2026, 1, d) // Feb = month 1
            const dayOfWeek = date.getDay()
            if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDays++
        }

        const calculatedAbsent = workingDays - (present + late + leave)

        console.log('\n📈 Summary:')
        console.log('  Present (on-time):', present)
        console.log('  Late:', late)
        console.log('  Leave:', leave)
        console.log('  Absent (calculated):', calculatedAbsent)
        console.log('  Total Accounted:', present + late + leave + calculatedAbsent)
        console.log('  Working Days:', workingDays)

        console.log('\n✅ Fix completed successfully!')

    } catch (error) {
        console.error('❌ Error:', error.message)
    } finally {
        await prisma.$disconnect()
    }
}

fixAttendance()
