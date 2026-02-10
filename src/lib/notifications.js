import prisma from './prisma'
import { sendEmail } from './email'

/**
 * Notification Types
 */
export const NotificationTypes = {
    LEAVE_APPROVED: 'LEAVE_APPROVED',
    LEAVE_REJECTED: 'LEAVE_REJECTED',
    PAYROLL_GENERATED: 'PAYROLL_GENERATED',
    ANNOUNCEMENT: 'ANNOUNCEMENT',
    ATTENDANCE_REMINDER: 'ATTENDANCE_REMINDER',
    WELCOME: 'WELCOME',
    PASSWORD_CHANGED: 'PASSWORD_CHANGED',
    PROFILE_UPDATED: 'PROFILE_UPDATED'
}

/**
 * Get notification preference key mapping
 */
const getPreferenceKey = (type, channel) => {
    const mapping = {
        [NotificationTypes.LEAVE_APPROVED]: 'LeaveUpdates',
        [NotificationTypes.LEAVE_REJECTED]: 'LeaveUpdates',
        [NotificationTypes.PAYROLL_GENERATED]: 'PayrollGenerated',
        [NotificationTypes.ANNOUNCEMENT]: 'Announcements',
        [NotificationTypes.ATTENDANCE_REMINDER]: 'AttendanceAlerts',
        [NotificationTypes.WELCOME]: 'Announcements',
        [NotificationTypes.PASSWORD_CHANGED]: 'Announcements',
        [NotificationTypes.PROFILE_UPDATED]: 'Announcements'
    }
    
    const suffix = mapping[type] || 'Announcements'
    return `${channel}${suffix}`
}

/**
 * Create a notification for a user
 */
export async function createNotification({
    userId,
    type,
    title,
    message,
    link = null,
    sendEmailNotification = true
}) {
    try {
        // Get user preferences
        let preferences = await prisma.notificationPreference.findUnique({
            where: { userId }
        })
        
        // Create default preferences if not exists
        if (!preferences) {
            preferences = await prisma.notificationPreference.create({
                data: { userId }
            })
        }
        
        // Check if in-app notification is enabled
        const inAppKey = getPreferenceKey(type, 'inApp')
        const shouldCreateInApp = preferences[inAppKey] !== false
        
        let notification = null
        
        if (shouldCreateInApp) {
            notification = await prisma.notification.create({
                data: {
                    userId,
                    type,
                    title,
                    message,
                    link
                }
            })
        }
        
        // Check if email notification should be sent
        const emailKey = getPreferenceKey(type, 'email')
        const shouldSendEmail = sendEmailNotification && preferences[emailKey] !== false
        
        if (shouldSendEmail) {
            // Get user email
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { email: true, details: { select: { firstName: true } } }
            })
            
            if (user?.email) {
                const emailHtml = generateNotificationEmailHtml({
                    type,
                    title,
                    message,
                    userName: user.details?.firstName || 'User',
                    link
                })
                
                await sendEmail({
                    to: user.email,
                    subject: title,
                    html: emailHtml
                })
                
                // Update notification to mark email as sent
                if (notification) {
                    await prisma.notification.update({
                        where: { id: notification.id },
                        data: { emailSent: true }
                    })
                }
            }
        }
        
        return notification
    } catch (error) {
        console.error('Error creating notification:', error)
        throw error
    }
}

/**
 * Create notifications for multiple users (batch)
 */
export async function createBulkNotifications({
    userIds,
    type,
    title,
    message,
    link = null,
    sendEmailNotification = true
}) {
    const results = await Promise.allSettled(
        userIds.map(userId => 
            createNotification({
                userId,
                type,
                title,
                message,
                link,
                sendEmailNotification
            })
        )
    )
    
    return results
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId) {
    return prisma.notification.count({
        where: {
            userId,
            isRead: false
        }
    })
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId, userId) {
    return prisma.notification.updateMany({
        where: {
            id: notificationId,
            userId // Ensure user owns this notification
        },
        data: {
            isRead: true,
            readAt: new Date()
        }
    })
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId) {
    return prisma.notification.updateMany({
        where: {
            userId,
            isRead: false
        },
        data: {
            isRead: true,
            readAt: new Date()
        }
    })
}

/**
 * Generate HTML email for notification
 */
function generateNotificationEmailHtml({ type, title, message, userName, link }) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const fullLink = link ? `${baseUrl}${link}` : null
    
    // Get icon and color based on type
    const typeStyles = {
        [NotificationTypes.LEAVE_APPROVED]: { color: '#10B981', icon: '✓' },
        [NotificationTypes.LEAVE_REJECTED]: { color: '#EF4444', icon: '✗' },
        [NotificationTypes.PAYROLL_GENERATED]: { color: '#3B82F6', icon: '💰' },
        [NotificationTypes.ANNOUNCEMENT]: { color: '#8B5CF6', icon: '📢' },
        [NotificationTypes.ATTENDANCE_REMINDER]: { color: '#F59E0B', icon: '⏰' },
        [NotificationTypes.WELCOME]: { color: '#10B981', icon: '👋' },
        [NotificationTypes.PASSWORD_CHANGED]: { color: '#6366F1', icon: '🔐' },
        [NotificationTypes.PROFILE_UPDATED]: { color: '#14B8A6', icon: '👤' }
    }
    
    const style = typeStyles[type] || { color: '#3B82F6', icon: '📩' }
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 32px; text-align: center;">
                    <div style="width: 60px; height: 60px; background: ${style.color}; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 28px;">
                        ${style.icon}
                    </div>
                    <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">${title}</h1>
                </div>
                
                <!-- Content -->
                <div style="padding: 32px;">
                    <p style="color: #64748b; font-size: 16px; margin: 0 0 24px;">Hello ${userName},</p>
                    <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                        ${message}
                    </p>
                    
                    ${fullLink ? `
                    <div style="text-align: center; margin-top: 32px;">
                        <a href="${fullLink}" style="display: inline-block; background: ${style.color}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                            View Details
                        </a>
                    </div>
                    ` : ''}
                </div>
                
                <!-- Footer -->
                <div style="background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #94a3b8; font-size: 14px;">
                        This is an automated message from Dayflow HRMS
                    </p>
                    <p style="margin: 8px 0 0; color: #94a3b8; font-size: 12px;">
                        You can manage your notification preferences in your profile settings
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `
}

// Export convenience functions for specific notification types
export const notifyLeaveApproved = async (userId, leaveDetails) => {
    return createNotification({
        userId,
        type: NotificationTypes.LEAVE_APPROVED,
        title: 'Leave Request Approved',
        message: `Your ${leaveDetails.type.toLowerCase()} leave request from ${leaveDetails.startDate} to ${leaveDetails.endDate} has been approved.${leaveDetails.comments ? ` Admin comments: ${leaveDetails.comments}` : ''}`,
        link: '/dashboard/leaves'
    })
}

export const notifyLeaveRejected = async (userId, leaveDetails) => {
    return createNotification({
        userId,
        type: NotificationTypes.LEAVE_REJECTED,
        title: 'Leave Request Rejected',
        message: `Your ${leaveDetails.type.toLowerCase()} leave request from ${leaveDetails.startDate} to ${leaveDetails.endDate} has been rejected.${leaveDetails.comments ? ` Reason: ${leaveDetails.comments}` : ''}`,
        link: '/dashboard/leaves'
    })
}

export const notifyPayrollGenerated = async (userId, payrollDetails) => {
    return createNotification({
        userId,
        type: NotificationTypes.PAYROLL_GENERATED,
        title: 'Payslip Generated',
        message: `Your payslip for ${payrollDetails.month} has been generated. Net pay: ₹${payrollDetails.netPay.toLocaleString()}`,
        link: '/dashboard/payroll'
    })
}

export const notifyAnnouncement = async (userIds, announcement) => {
    return createBulkNotifications({
        userIds,
        type: NotificationTypes.ANNOUNCEMENT,
        title: announcement.title,
        message: announcement.message,
        link: announcement.link || null
    })
}

export const notifyWelcome = async (userId, userName) => {
    return createNotification({
        userId,
        type: NotificationTypes.WELCOME,
        title: 'Welcome to Dayflow!',
        message: `Hi ${userName}, welcome to Dayflow HRMS! Your account has been set up successfully. Start by updating your profile and checking out the dashboard.`,
        link: '/dashboard'
    })
}
