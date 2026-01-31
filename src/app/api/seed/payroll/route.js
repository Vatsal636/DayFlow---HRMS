import { NextResponse } from 'next/server'

// Seed route disabled - Use Admin Payroll Processing instead
export async function GET(request) {
    return NextResponse.json({ 
        error: 'Payroll seeding disabled. Use Admin panel to process monthly payroll.' 
    }, { status: 403 })
}
