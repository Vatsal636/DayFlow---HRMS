# Automatic Payroll Generation

## Overview

DayFlow HRMS now includes **automatic monthly payroll generation** that runs at the end of each month. This feature reduces HR workload by automatically generating payslips for all employees without manual intervention.

## How It Works

### 1. **Automated Schedule**
- Runs **daily at 11:59 PM** (23:59)
- Checks if it's the **last day of the month**
- If yes, proceeds to payroll generation check

### 2. **Smart Generation Logic**
```
IF (today is last day of month) THEN
    IF (payroll exists for this month) THEN
        Delete old payroll records
        Regenerate with FULL MONTH data
    ELSE
        Generate payroll for all eligible employees
    END IF
    
    (This ensures employees always get paid for ENTIRE month)
END IF
```

### 3. **What Gets Generated**
- ✅ Payslips for all **active employees**
- ✅ Skips employees who haven't joined yet
- ✅ Applies same calculation as manual generation
- ✅ Sends email notifications to all employees
- ✅ Creates audit log entry

## Features

### ✨ **Intelligent Checks**
1. **Month-end Detection**: Only runs on the last day of month
2. **Full Month Calculation**: Always regenerates with complete attendance data
3. **Replaces Mid-Month Payrolls**: Deletes partial payrolls and creates final one
4. **Employee Eligibility**: Skips employees not yet joined
5. **Calculation Parity**: Uses exact same logic as manual generation

### 🔒 **Security**
- Protected by `CRON_SECRET` environment variable
- Only accepts requests with valid authorization header
- Works with Vercel Cron (automatic on deployment)

### 📊 **Payroll Calculation**
Same as manual generation:
- Present Days + Weekends (Sat+Sun) + Approved Leaves
- Pro-rated salary based on payable days
- EPF and Professional Tax deductions
- Net pay calculation

## Configuration

### Environment Variable

Add to your `.env` file:
```env
CRON_SECRET=dayflow-cron-secret-2026
```

**For Production (Vercel):**
1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add: `CRON_SECRET` = `your-secure-random-string`

### Cron Schedule

Defined in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/auto-payroll",
      "schedule": "59 23 * * *"
    }
  ]
}
```

**Schedule Format:** `minute hour day month dayOfWeek`
- `59 23 * * *` = Every day at 11:59 PM

**To Change Schedule:**
- `0 0 1 * *` = First day of every month at midnight
- `0 23 28-31 * *` = Days 28-31 at 11 PM (catches last day)
- `59 23 * * *` = Every day at 11:59 PM (current - with last day check)

## Manual Payroll (Still Available)

The existing manual payroll generation remains **fully functional**:

### Admin Dashboard → Payroll → Process Payroll
1. Select month and year
2. Click "Process Payroll"
3. Generates for all employees immediately

**Use Cases for Manual Generation:**
- Mid-month payroll processing (preview/advance)
- Quick salary checks during the month
- Testing payroll before month-end
- Advance payments (will be replaced by final auto-payroll on last day)

## How Auto-Generation Handles Edge Cases

### Case 1: Admin Generated Payroll on Day 5
```
Day 5: Admin generates payroll (calculates for 5 days only)
Day 28 (Last Day): Auto-payroll runs
Result: REGENERATE with full 28 days data
Action: Deletes day-5 payroll, creates new with complete attendance
Message: 4: Employee Joined Mid-Month
```
Result: GENERATE (pro-rated for days worked)
Payroll: Only for days after joining date
```

### Case 5: Employee Not Yet Joined
```
Result: SKIP
Reason: "Not joined yet (Joining: Mar 2026)"
```

### Case 6: No Salary Structure Defined
```
Result: GENERATE with default structure
Default: ₹50,000 CTC with standard breakdown
```

### Case 7: Employee Joined Mid-Month
```
Result: GENERATE (pro-rated for days worked)
Payroll: Only for days after joining date
```

### Case 3: Employee Not Yet Joined
```
Result: SKIP
Reason: "Not joined yet (Joining: Mar 2026)"
```

### Case 4: No Salary Structure Defined
```
Result: GENERATE with default structure
Default: ₹50,000 CTC with standard breakdown
```

### Case 5: Month Has 28/29/30/31 Days
```
Result: GENERATE with correct pro-ration
Calculation: Adjusts per-day rate based on month length
```

## Testing Locally

### Option 1: Direct API Call
```bash
curl -X GET http://localhost:3000/api/cron/auto-payroll \
  -H "Authorization: Bearer dayflow-cron-secret-2026"
```

### Option 2: Test on Last Day
Wait for last day of month, cron runs automatically at 11:59 PM

### Option 3: Modify Date Check (Dev Only)
Temporarily comment out the "last day check" in the code:
```javascript
// if (currentDay !== lastDayOfMonth) {
//     return NextResponse.json({ ... })
// }
```

## Production Deployment (Vercel)

### Automatic Setup
1. Push code to GitHub
2. Vercel detects `vercel.json`
3. Cron job automatically configured
4. Runs at scheduled time (UTC timezone)

### Verification
1. Go to Vercel Dashboard → Your Project
2. Click on **Cron Jobs** tab
3. See scheduled job: `/api/cron/auto-payroll`
4. View execution logs and history

### Timezone Considerations
- Vercel Cron runs in **UTC**
- `59 23 * * *` = 11:59 PM UTC
- Adjust if needed for your timezone:
  - IST (UTC+5:30): Use `29 18regenerated with full month data (replaced 15 existing records)",
  "month": 2,
  "year": 2026,
  "generated": 15,
  "skipped": 2,
  "skippedEmployees": [...],
  "regenerated": true,
  "replacedCount": 15
}
``` (Not Last Day)
```json
{
  "message": "Not the last day of month",
  "currentDay": 15,
  "lastDayOfMonth": 28"Monthly payroll auto-generated successfully",
  "month": 2,
  "year": 2026,
  "generated": 15,
  "skipped": 2,
  "skippedEmployees": [...],
  "regenerated": false,
  "replacedCount": 0
}
```

### Skip Response (Not Last Day)App):**
- Admin Dashboard → Audit Logs
- Filter by: `PAYROLL_PROCESSED`
- See automatic generation entries

### Success Response
```json
{**Always get complete month calculation** (even if generated mid-month)
- ✅ Consistent processing time
- ✅ Reduced errors
- ✅ Can still do manual processing anytime (as preview/advance)
- ✅ Mid-month payrolls automatically replaced with final calculationed successfully",
  "month": 2,**full month payslip** on last day
- ✅ No partial payments due to mid-month generation
- ✅ Automatic notifications
- ✅ Consistent timing every month
- ✅ Immediate access to final
  "skippedEmployees": [...]
}
```

### Skip Response
```json
{
  "message": "Payroll already generated for this month",
  "month": 2,
  "year": 20it's actually the last day of month
2. Verify employee eligibility (joining date)
3. Check if cron job executed (Vercel Dashboard)
4. Review error logs in Vercel
5. Ensure `CRON_SECRET` matches in code and env vars
```

## Notifications

When auto-generation runs, each employee receives:
- 📧 **Email notification** (if configured)
- 🔔 **In-app notification**
- Message: "Your payslip for [Month Year] is ready! Net Pay: ₹XX,XXX"

## Benefits

### For HR/Admin
- ✅ No manual work at month-end
- ✅ Never forget to generate payroll
- ✅ Consistent processing time
- ✅ Reduced errors
- ✅ Can still do manual processing anytime

### For Employees
- ✅ Guaranteed payslip on last day
- ✅ Automatic notifications
- ✅ Consistent timing every month
- ✅ Immediate access to payslip

## Troubleshooting

### Cron Not Running?
1. Check `vercel.json` is committed to git
2. Verify deployment succeeded
3. Check Vercel Dashboard → Cron Jobs
4. Ensure `CRON_SECRET` is set in Vercel env variables

### Payroll Not Generated?
1. Check if already generated (duplicate prevention)
2. Verify it's the last day of month
3. Check employee eligibility (joining date)
4. Review error logs in Vercel

### Wrong Timezone?
Adjust schedule in `vercel.json`:
```json
"schedule": "29 18 * * *"  // For IST (11:59 PM IST)
```

## Advanced Configuration

### Disable Auto-Generation
Comment out or remove the cron entry in `vercel.json`:
```json
{
  "crons": []
}
```

### Change Frequency
```json
"schedule": "0 0 1 * *"  // First day of month at midnight
"schedule": "0 9 * * MON"  // Every Monday at 9 AM
"schedule": "0 */6 * * *"  // Every 6 hours
```

### Add Multiple Cron Jobs
```json
{
  "crons": [
    {
      "path": "/api/cron/auto-payroll",
      "schedule": "59 23 * * *"
    },
    {
      "path": "/api/cron/reminder",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## Future Enhancements

Potential additions:
- Send reminder to HR 3 days before month-end
- Generate summary report for admin
- Auto-send payslips via email (PDF attachment)
- Configurable schedule from admin settings
- Dry-run mode for testing
- Slack/Teams integration for notifications

---

**Questions?** Check the code in `src/app/api/cron/auto-payroll/route.js`
