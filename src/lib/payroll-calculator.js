/**
 * Shared Payroll Calculation Engine
 * 
 * Centralizes all salary calculation logic to ensure consistency between:
 * - Payroll Generation (/api/admin/payroll/process)
 * - Salary Simulator (/api/payroll/simulator)
 * 
 * All financial calculations MUST use this library to prevent formula drift.
 */

/**
 * Calculate gross salary from salary structure components
 * @param {Object} salary - Salary structure object
 * @returns {number} Total gross salary before deductions
 */
export function calculateGrossSalary(salary) {
    return (
        salary.basic +
        salary.hra +
        salary.stdAllowance +
        (salary.fixedAllowance || 0) +
        (salary.performanceBonus || 0) +
        (salary.lta || 0)
    )
}

/**
 * Count weekend days (Saturday & Sunday) in a month range
 * Critical: Only counts weekends from effective employment start date
 * 
 * @param {number} year - Year
 * @param {number} month - Month (0-indexed, 0=January)
 * @param {number} daysInMonth - Total days in the month
 * @param {Date} joiningDate - Employee joining date (for mid-month joiners)
 * @param {Date} monthStartDate - First day of the payroll month
 * @returns {number} Count of weekend days to be paid
 */
export function calculateWeekends(year, month, daysInMonth, joiningDate, monthStartDate) {
    // Determine effective start date (joining date or month start, whichever is later)
    const effectiveStartDate = joiningDate > monthStartDate ? joiningDate : monthStartDate
    const effectiveStartDay = effectiveStartDate.getDate()
    
    let weekends = 0
    for (let d = effectiveStartDay; d <= daysInMonth; d++) {
        const date = new Date(year, month, d)
        const dayOfWeek = date.getDay()
        // Saturday (6) or Sunday (0)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            weekends++
        }
    }
    
    return weekends
}

/**
 * Calculate approved leave days that fall within a specific month
 * Handles cross-month leave requests with proper date overlap logic
 * 
 * @param {Array} approvedLeaveRequests - Array of approved leave request objects with startDate and endDate
 * @param {Date} monthStartDate - First day of the month
 * @param {Date} monthEndDate - Last day of the month
 * @returns {number} Total leave days in the specified month
 */
export function calculateApprovedLeaveDays(approvedLeaveRequests, monthStartDate, monthEndDate) {
    let approvedLeaveDays = 0
    
    approvedLeaveRequests.forEach(leave => {
        // Clamp leave dates to month boundaries
        const leaveStart = new Date(leave.startDate) > monthStartDate ? 
                          new Date(leave.startDate) : monthStartDate
        const leaveEnd = new Date(leave.endDate) < monthEndDate ? 
                        new Date(leave.endDate) : monthEndDate
        
        // Count days between leaveStart and leaveEnd (inclusive)
        const daysDiff = Math.floor((leaveEnd - leaveStart) / (1000 * 60 * 60 * 24)) + 1
        approvedLeaveDays += Math.max(0, daysDiff)
    })
    
    return approvedLeaveDays
}

/**
 * Calculate payable days based on attendance, weekends, and leaves
 * Critical Business Rule: Zero-attendance employees do NOT get weekend pay
 * 
 * @param {number} attendanceCount - Number of days employee was present
 * @param {number} weekends - Weekend days in the period
 * @param {number} approvedLeaveDays - Approved leave days in the period
 * @param {number} daysInMonth - Total days in the month
 * @returns {number} Final payable days (capped at daysInMonth)
 */
export function calculatePayableDays(attendanceCount, weekends, approvedLeaveDays, daysInMonth) {
    // Critical Fix: Zero-attendance business rule
    if (attendanceCount === 0 && approvedLeaveDays === 0) {
        // Full month absent with no approved leave - no payment for weekends
        return 0
    }
    
    // Normal calculation - include weekends
    return Math.min(attendanceCount + weekends + approvedLeaveDays, daysInMonth)
}

/**
 * Calculate pro-rated earned gross salary
 * 
 * @param {number} grossSalary - Full month gross salary
 * @param {number} payableDays - Days to be paid
 * @param {number} daysInMonth - Total days in the month
 * @returns {number} Pro-rated earned gross (rounded)
 */
export function calculateEarnedGross(grossSalary, payableDays, daysInMonth) {
    const perDayGross = grossSalary / daysInMonth
    return Math.round(perDayGross * payableDays)
}

/**
 * Calculate pro-rated PF (Provident Fund) deduction
 * 
 * @param {number} pfAmount - Full month PF amount
 * @param {number} payableDays - Days to be paid
 * @param {number} daysInMonth - Total days in the month
 * @returns {number} Pro-rated PF deduction (rounded)
 */
export function calculateEarnedPF(pfAmount, payableDays, daysInMonth) {
    const perDayPF = pfAmount / daysInMonth
    return Math.round(perDayPF * payableDays)
}

/**
 * Calculate professional tax based on payable days threshold
 * Business Rule: Professional tax only charged if payable days >= 20
 * 
 * @param {number} payableDays - Days to be paid
 * @param {number} profTaxAmount - Full professional tax amount
 * @returns {number} Professional tax to charge (0 or full amount)
 */
export function calculateProfessionalTax(payableDays, profTaxAmount) {
    return payableDays >= 20 ? profTaxAmount : 0
}

/**
 * Calculate total deductions
 * 
 * @param {number} earnedPF - Pro-rated PF amount
 * @param {number} earnedProfTax - Professional tax amount
 * @param {number} otherDeductions - Any other deductions (default 0)
 * @returns {number} Total deductions
 */
export function calculateTotalDeductions(earnedPF, earnedProfTax, otherDeductions = 0) {
    return earnedPF + earnedProfTax + otherDeductions
}

/**
 * Calculate net pay after deductions
 * 
 * @param {number} earnedGross - Pro-rated gross salary
 * @param {number} totalDeductions - Total deductions
 * @returns {number} Final net pay
 */
export function calculateNetPay(earnedGross, totalDeductions) {
    return earnedGross - totalDeductions
}

/**
 * Calculate loss of pay compared to full month salary
 * 
 * @param {number} grossSalary - Full month gross salary
 * @param {number} pfAmount - Full month PF
 * @param {number} profTaxAmount - Full professional tax
 * @param {number} actualNetPay - Actual net pay received
 * @returns {number} Amount lost due to absences
 */
export function calculateLossOfPay(grossSalary, pfAmount, profTaxAmount, actualNetPay) {
    const fullMonthNet = grossSalary - pfAmount - profTaxAmount
    return fullMonthNet - actualNetPay
}

/**
 * Get default salary structure (fallback when employee has no defined salary)
 * 
 * @returns {Object} Default salary structure
 */
export function getDefaultSalaryStructure() {
    const wage = 50000
    const basic = wage * 0.5 // 50% Basic
    const hra = wage * 0.3 // 30% HRA
    const stdAllowance = wage * 0.1 // 10% Special Allowance
    const fixedAllowance = wage * 0.1 // 10% Fixed Allowance
    const pf = basic * 0.12 // 12% of Basic
    const profTax = 200 // Standard Professional Tax
    
    return {
        wage: wage,
        basic: basic,
        hra: hra,
        stdAllowance: stdAllowance,
        fixedAllowance: fixedAllowance,
        performanceBonus: 0,
        lta: 0,
        pf: pf,
        profTax: profTax,
        netSalary: wage - pf - profTax
    }
}

/**
 * MASTER CALCULATION FUNCTION
 * Performs complete payroll calculation for a given employee
 * 
 * @param {Object} params - Calculation parameters
 * @param {Object} params.salary - Salary structure
 * @param {number} params.attendanceCount - Number of working days attended
 * @param {number} params.weekends - Weekend days in period
 * @param {number} params.approvedLeaveDays - Approved leave days
 * @param {number} params.daysInMonth - Total days in the month
 * @param {number} params.otherDeductions - Optional other deductions (default 0)
 * @returns {Object} Complete breakdown with all calculations
 */
export function calculateCompletePayroll({
    salary,
    attendanceCount,
    weekends,
    approvedLeaveDays,
    daysInMonth,
    otherDeductions = 0
}) {
    // Step 1: Calculate gross salary
    const grossSalary = calculateGrossSalary(salary)
    
    // Step 2: Calculate payable days (with zero-attendance rule)
    const payableDays = calculatePayableDays(attendanceCount, weekends, approvedLeaveDays, daysInMonth)
    
    // Step 3: Calculate pro-rated earned gross
    const earnedGross = calculateEarnedGross(grossSalary, payableDays, daysInMonth)
    
    // Step 4: Calculate deductions
    const earnedPF = calculateEarnedPF(salary.pf, payableDays, daysInMonth)
    const earnedProfTax = calculateProfessionalTax(payableDays, salary.profTax)
    const totalDeductions = calculateTotalDeductions(earnedPF, earnedProfTax, otherDeductions)
    
    // Step 5: Calculate net pay
    const netPay = calculateNetPay(earnedGross, totalDeductions)
    
    // Step 6: Calculate loss of pay
    const lossOfPay = calculateLossOfPay(grossSalary, salary.pf, salary.profTax, netPay)
    
    return {
        // Breakdown
        daysInMonth,
        attendanceDays: attendanceCount,
        weekendDays: weekends,
        leaveDays: approvedLeaveDays,
        payableDays,
        
        // Earnings
        grossSalary,
        earnedGross,
        
        // Deductions
        pfDeduction: earnedPF,
        profTaxDeduction: earnedProfTax,
        otherDeductions,
        totalDeductions,
        
        // Final
        netPay,
        lossOfPay,
        
        // Legacy compatibility
        baseWage: salary.wage,
        totalEarnings: earnedGross
    }
}

/**
 * Calculate remaining working days (excluding weekends) from current day to end of month
 * 
 * @param {number} year - Year
 * @param {number} month - Month (0-indexed)
 * @param {number} currentDay - Current day of month
 * @param {number} daysInMonth - Total days in month
 * @returns {Object} { remainingWorkingDays, remainingWeekends }
 */
export function calculateRemainingDays(year, month, currentDay, daysInMonth) {
    let remainingWeekends = 0
    let remainingWorkingDays = 0
    
    for (let d = currentDay + 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d)
        const dayOfWeek = date.getDay()
        
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            remainingWeekends++
        } else {
            remainingWorkingDays++
        }
    }
    
    return { remainingWorkingDays, remainingWeekends }
}

/**
 * Calculate optimistic estimated payable days (assumes future perfect attendance)
 * Used by salary simulator for projections
 * 
 * @param {number} currentAttendance - Actual attendance so far
 * @param {number} approvedLeaveDays - Approved leave days
 * @param {number} remainingWorkingDays - Working days remaining in month
 * @param {number} totalWeekendsInMonth - Total weekends in month
 * @returns {number} Estimated payable days (optimistic projection)
 */
export function calculateOptimisticPayableDays(
    currentAttendance,
    approvedLeaveDays,
    remainingWorkingDays,
    totalWeekendsInMonth
) {
    // Critical: Apply zero-attendance business rule
    if (currentAttendance === 0 && approvedLeaveDays === 0) {
        // No attendance or approved leave yet - only project future days
        // Assume perfect future attendance
        return remainingWorkingDays + totalWeekendsInMonth
    }
    
    // Normal optimistic projection
    return currentAttendance + approvedLeaveDays + remainingWorkingDays + totalWeekendsInMonth
}

/**
 * Calculate realistic estimated payable days based on historical attendance rate
 * Uses employee's actual attendance pattern to project future
 * 
 * @param {number} currentAttendance - Actual attendance so far
 * @param {number} approvedLeaveDays - Approved leave days
 * @param {number} totalWorkingDaysSoFar - Working days elapsed in month
 * @param {number} remainingWorkingDays - Working days remaining
 * @param {number} totalWeekendsInMonth - Total weekends in month
 * @returns {number} Estimated payable days (realistic projection)
 */
export function calculateRealisticPayableDays(
    currentAttendance,
    approvedLeaveDays,
    totalWorkingDaysSoFar,
    remainingWorkingDays,
    totalWeekendsInMonth
) {
    // If no working days have passed yet, fall back to optimistic
    if (totalWorkingDaysSoFar === 0) {
        return calculateOptimisticPayableDays(
            currentAttendance,
            approvedLeaveDays,
            remainingWorkingDays,
            totalWeekendsInMonth
        )
    }
    
    // Calculate attendance rate (percentage of working days attended)
    const attendanceRate = currentAttendance / totalWorkingDaysSoFar
    
    // Project future attendance based on historical rate
    const projectedFutureAttendance = Math.round(remainingWorkingDays * attendanceRate)
    
    // Critical: Apply zero-attendance business rule
    if (currentAttendance === 0 && approvedLeaveDays === 0) {
        return projectedFutureAttendance + totalWeekendsInMonth
    }
    
    return currentAttendance + approvedLeaveDays + projectedFutureAttendance + totalWeekendsInMonth
}

/**
 * Calculate pessimistic estimated payable days (no future attendance)
 * Worst-case scenario: assumes employee will be absent for all remaining days
 * 
 * @param {number} currentAttendance - Actual attendance so far
 * @param {number} approvedLeaveDays - Approved leave days
 * @param {number} weekendsSoFar - Weekends that have occurred
 * @returns {number} Estimated payable days (pessimistic projection)
 */
export function calculatePessimisticPayableDays(
    currentAttendance,
    approvedLeaveDays,
    weekendsSoFar
) {
    // Worst case: Only count what has already happened
    // No future attendance, no future weekends beyond what's passed
    return currentAttendance + approvedLeaveDays + weekendsSoFar
}

/**
 * Check if an employee is late based on check-in time
 * Threshold: 9:30 AM
 * 
 * @param {Date} checkInTime - Employee check-in timestamp
 * @returns {boolean} True if late, false if on-time
 */
export function isLateCheckIn(checkInTime) {
    const threshold = new Date(checkInTime)
    threshold.setHours(9, 30, 0, 0)
    return checkInTime > threshold
}

/**
 * Count working days in a date range (excluding weekends)
 * 
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Number of working days (Monday-Friday)
 */
export function countWorkingDays(startDate, endDate) {
    let workingDays = 0
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not weekend
            workingDays++
        }
        currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return workingDays
}

/**
 * Validate salary structure object has all required fields
 * 
 * @param {Object} salary - Salary structure to validate
 * @returns {Object} { valid: boolean, missing: string[] }
 */
export function validateSalaryStructure(salary) {
    const required = ['wage', 'basic', 'hra', 'stdAllowance', 'pf', 'profTax']
    const missing = required.filter(field => salary[field] === undefined || salary[field] === null)
    
    return {
        valid: missing.length === 0,
        missing
    }
}

/**
 * Format currency for display (Indian Rupee format)
 * 
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
    return `₹ ${amount.toLocaleString('en-IN')}`
}

/**
 * Calculate percentage of a value
 * 
 * @param {number} value - Base value
 * @param {number} percentage - Percentage (e.g., 12 for 12%)
 * @returns {number} Calculated percentage amount
 */
export function calculatePercentage(value, percentage) {
    return (value * percentage) / 100
}
