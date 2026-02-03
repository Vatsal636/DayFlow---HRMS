import prisma from './prisma'
import { getClientIP, getUserAgent } from './security'

export async function createAuditLog({
    userId,
    action,
    resource,
    resourceId,
    details,
    request
}) {
    try {
        const ipAddress = request ? getClientIP(request) : null
        const userAgent = request ? getUserAgent(request) : null
        
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                resource,
                resourceId,
                details,
                ipAddress,
                userAgent
            }
        })
    } catch (error) {
        console.error('Failed to create audit log:', error)
        // Don't throw - audit logs shouldn't break the main flow
    }
}

export const AuditActions = {
    // Authentication
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGOUT: 'LOGOUT',
    PASSWORD_CHANGED: 'PASSWORD_CHANGED',
    PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
    PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
    EMAIL_VERIFIED: 'EMAIL_VERIFIED',
    TWO_FACTOR_ENABLED: 'TWO_FACTOR_ENABLED',
    TWO_FACTOR_DISABLED: 'TWO_FACTOR_DISABLED',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    ACCOUNT_UNLOCKED: 'ACCOUNT_UNLOCKED',
    
    // Employee Management
    EMPLOYEE_CREATED: 'EMPLOYEE_CREATED',
    EMPLOYEE_UPDATED: 'EMPLOYEE_UPDATED',
    EMPLOYEE_DELETED: 'EMPLOYEE_DELETED',
    EMPLOYEE_ACTIVATED: 'EMPLOYEE_ACTIVATED',
    EMPLOYEE_DEACTIVATED: 'EMPLOYEE_DEACTIVATED',
    
    // Attendance
    ATTENDANCE_CHECKIN: 'ATTENDANCE_CHECKIN',
    ATTENDANCE_CHECKOUT: 'ATTENDANCE_CHECKOUT',
    ATTENDANCE_MODIFIED: 'ATTENDANCE_MODIFIED',
    
    // Leave Management
    LEAVE_APPLIED: 'LEAVE_APPLIED',
    LEAVE_APPROVED: 'LEAVE_APPROVED',
    LEAVE_REJECTED: 'LEAVE_REJECTED',
    LEAVE_CANCELLED: 'LEAVE_CANCELLED',
    
    // Payroll
    PAYROLL_PROCESSED: 'PAYROLL_PROCESSED',
    PAYROLL_UPDATED: 'PAYROLL_UPDATED',
    SALARY_STRUCTURE_UPDATED: 'SALARY_STRUCTURE_UPDATED',
    PAYSLIP_DOWNLOADED: 'PAYSLIP_DOWNLOADED',
    
    // Profile
    PROFILE_UPDATED: 'PROFILE_UPDATED',
    PROFILE_VIEWED: 'PROFILE_VIEWED',
    
    // System
    SETTINGS_CHANGED: 'SETTINGS_CHANGED',
    REPORT_GENERATED: 'REPORT_GENERATED',
    DATA_EXPORTED: 'DATA_EXPORTED'
}

export const AuditResources = {
    USER: 'USER',
    EMPLOYEE: 'EMPLOYEE',
    ATTENDANCE: 'ATTENDANCE',
    LEAVE: 'LEAVE',
    PAYROLL: 'PAYROLL',
    SALARY: 'SALARY',
    PROFILE: 'PROFILE',
    SYSTEM: 'SYSTEM',
    AUTHENTICATION: 'AUTHENTICATION'
}
