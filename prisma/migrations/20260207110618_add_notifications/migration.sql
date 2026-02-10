-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LEAVE_APPROVED', 'LEAVE_REJECTED', 'PAYROLL_GENERATED', 'ANNOUNCEMENT', 'ATTENDANCE_REMINDER', 'WELCOME', 'PASSWORD_CHANGED', 'PROFILE_UPDATED');

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "emailLeaveUpdates" BOOLEAN NOT NULL DEFAULT true,
    "emailPayrollGenerated" BOOLEAN NOT NULL DEFAULT true,
    "emailAnnouncements" BOOLEAN NOT NULL DEFAULT true,
    "emailAttendanceAlerts" BOOLEAN NOT NULL DEFAULT false,
    "inAppLeaveUpdates" BOOLEAN NOT NULL DEFAULT true,
    "inAppPayrollGenerated" BOOLEAN NOT NULL DEFAULT true,
    "inAppAnnouncements" BOOLEAN NOT NULL DEFAULT true,
    "inAppAttendanceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
