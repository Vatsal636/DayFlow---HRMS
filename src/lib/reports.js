// Report generation utilities for PDF and Excel exports
// These functions use dynamic imports to ensure browser-side only execution

// Company header for all reports
const COMPANY_NAME = 'DayFlow HRMS'
const COMPANY_TAGLINE = 'Human Resource Management System'

/**
 * Generate PDF report with table data
 */
export async function generatePDF({ title, subtitle, columns, data, filename, orientation = 'portrait' }) {
    const jsPDF = (await import('jspdf')).default
    await import('jspdf-autotable')
    
    const doc = new jsPDF(orientation, 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    
    // Header
    doc.setFontSize(20)
    doc.setTextColor(37, 99, 235) // Blue color
    doc.text(COMPANY_NAME, pageWidth / 2, 20, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139) // Gray
    doc.text(COMPANY_TAGLINE, pageWidth / 2, 27, { align: 'center' })
    
    // Title
    doc.setFontSize(16)
    doc.setTextColor(15, 23, 42) // Dark
    doc.text(title, pageWidth / 2, 40, { align: 'center' })
    
    // Subtitle (date range, etc.)
    if (subtitle) {
        doc.setFontSize(11)
        doc.setTextColor(71, 85, 105)
        doc.text(subtitle, pageWidth / 2, 48, { align: 'center' })
    }
    
    // Generated date
    doc.setFontSize(9)
    doc.setTextColor(148, 163, 184)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 55, { align: 'center' })
    
    // Table
    doc.autoTable({
        head: [columns],
        body: data,
        startY: 62,
        theme: 'grid',
        headStyles: {
            fillColor: [37, 99, 235],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
        },
        bodyStyles: {
            halign: 'center'
        },
        alternateRowStyles: {
            fillColor: [241, 245, 249]
        },
        styles: {
            fontSize: 9,
            cellPadding: 4
        },
        margin: { top: 62, left: 14, right: 14 },
        didDrawPage: function(data) {
            // Footer on each page
            const pageCount = doc.internal.getNumberOfPages()
            doc.setFontSize(8)
            doc.setTextColor(148, 163, 184)
            doc.text(
                `Page ${data.pageNumber} of ${pageCount}`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            )
        }
    })
    
    return doc.output('blob')
}

/**
 * Generate Excel workbook with data
 */
export async function generateExcel({ title, columns, data, filename, sheetName = 'Report' }) {
    const XLSX = await import('xlsx')
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    
    // Add title rows
    const wsData = [
        [COMPANY_NAME],
        [title],
        [`Generated on: ${new Date().toLocaleString()}`],
        [], // Empty row
        columns, // Header row
        ...data // Data rows
    ]
    
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    
    // Set column widths
    const colWidths = columns.map((col, i) => {
        const maxDataLen = Math.max(
            col.length,
            ...data.map(row => (row[i] || '').toString().length)
        )
        return { wch: Math.min(maxDataLen + 2, 30) }
    })
    ws['!cols'] = colWidths
    
    // Merge title cells
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: columns.length - 1 } }
    ]
    
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    
    // Generate buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

/**
 * Generate individual payslip PDF
 */
export async function generatePayslip({ employee, payroll, salary, month, year }) {
    const jsPDF = (await import('jspdf')).default
    
    const doc = new jsPDF('portrait', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    
    // Header
    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, pageWidth, 45, 'F')
    
    doc.setFontSize(24)
    doc.setTextColor(255, 255, 255)
    doc.text(COMPANY_NAME, pageWidth / 2, 20, { align: 'center' })
    
    doc.setFontSize(12)
    doc.text('PAYSLIP', pageWidth / 2, 32, { align: 'center' })
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December']
    doc.setFontSize(10)
    doc.text(`${monthNames[month - 1]} ${year}`, pageWidth / 2, 40, { align: 'center' })
    
    // Employee Details Section
    doc.setFontSize(12)
    doc.setTextColor(37, 99, 235)
    doc.text('Employee Details', 14, 58)
    
    doc.setDrawColor(226, 232, 240)
    doc.line(14, 61, pageWidth - 14, 61)
    
    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)
    
    const details = [
        ['Employee ID:', employee.employeeId],
        ['Name:', `${employee.details?.firstName || ''} ${employee.details?.lastName || ''}`],
        ['Department:', employee.details?.department || 'N/A'],
        ['Designation:', employee.details?.jobTitle || 'N/A']
    ]
    
    let yPos = 70
    details.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold')
        doc.text(label, 14, yPos)
        doc.setFont(undefined, 'normal')
        doc.text(value, 50, yPos)
        yPos += 8
    })
    
    // Earnings Section
    doc.setFontSize(12)
    doc.setTextColor(37, 99, 235)
    doc.text('Earnings', 14, 110)
    doc.line(14, 113, pageWidth / 2 - 5, 113)
    
    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)
    
    const earnings = [
        ['Basic Pay', salary.basicPay || 0],
        ['HRA', salary.hra || 0],
        ['Medical Allowance', salary.medicalAllowance || 0],
        ['Transport Allowance', salary.transportAllowance || 0],
        ['Special Allowance', salary.specialAllowance || 0]
    ]
    
    yPos = 122
    let totalEarnings = 0
    earnings.forEach(([label, value]) => {
        doc.text(label, 14, yPos)
        doc.text(`₹${value.toLocaleString()}`, pageWidth / 2 - 15, yPos, { align: 'right' })
        totalEarnings += value
        yPos += 8
    })
    
    // Deductions Section
    doc.setFontSize(12)
    doc.setTextColor(37, 99, 235)
    doc.text('Deductions', pageWidth / 2 + 5, 110)
    doc.line(pageWidth / 2 + 5, 113, pageWidth - 14, 113)
    
    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)
    
    const deductions = payroll.deductions || 0
    doc.text('Leave Deductions', pageWidth / 2 + 5, 122)
    doc.text(`₹${deductions.toLocaleString()}`, pageWidth - 14, 122, { align: 'right' })
    
    // Summary Box
    yPos = 170
    doc.setFillColor(241, 245, 249)
    doc.roundedRect(14, yPos, pageWidth - 28, 50, 3, 3, 'F')
    
    yPos += 12
    doc.setFontSize(11)
    doc.setTextColor(71, 85, 105)
    
    doc.text('Gross Salary:', 20, yPos)
    doc.text(`₹${totalEarnings.toLocaleString()}`, pageWidth - 20, yPos, { align: 'right' })
    
    yPos += 10
    doc.text('Total Deductions:', 20, yPos)
    doc.text(`₹${deductions.toLocaleString()}`, pageWidth - 20, yPos, { align: 'right' })
    
    yPos += 10
    doc.setDrawColor(37, 99, 235)
    doc.line(20, yPos, pageWidth - 20, yPos)
    
    yPos += 10
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(37, 99, 235)
    doc.text('Net Salary:', 20, yPos)
    doc.text(`₹${payroll.netSalary.toLocaleString()}`, pageWidth - 20, yPos, { align: 'right' })
    
    // Footer
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(148, 163, 184)
    doc.text('This is a computer-generated payslip and does not require a signature.', 
             pageWidth / 2, 250, { align: 'center' })
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 
             pageWidth / 2, 258, { align: 'center' })
    
    return doc.output('blob')
}

/**
 * Format date for display
 */
export function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    })
}

/**
 * Format currency
 */
export function formatCurrency(amount) {
    return `₹${(amount || 0).toLocaleString('en-IN')}`
}
