"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Save, Loader2, Camera, Bell, BellOff, Settings, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/Toast"

function ProfileContent() {
    const searchParams = useSearchParams()
    const defaultTab = searchParams.get('tab') || 'profile'
    const toast = useToast()
    
    const [activeTab, setActiveTab] = useState(defaultTab)
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
        profilePic: ""
    })
    
    // Notification preferences
    const [notifPrefs, setNotifPrefs] = useState(null)
    const [prefsLoading, setPrefsLoading] = useState(true)
    const [prefsSaving, setPrefsSaving] = useState(false)
    const [csrfToken, setCsrfToken] = useState(null)

    useEffect(() => {
        const token = localStorage.getItem('csrfToken')
        if (token) setCsrfToken(token)
        fetchProfile()
        fetchNotificationPrefs()
    }, [])

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile')
            const data = await res.json()
            if (res.ok) {
                setUser(data.user)
                setFormData({
                    firstName: data.user.firstName || "",
                    lastName: data.user.lastName || "",
                    phone: data.user.phone || "",
                    address: data.user.address || "",
                    profilePic: data.user.profilePic || ""
                })
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }
    
    const fetchNotificationPrefs = async () => {
        try {
            const res = await fetch('/api/notifications/preferences')
            const data = await res.json()
            if (res.ok) {
                setNotifPrefs(data.preferences)
            } else {
                toast.error(data.error || 'Failed to load notification preferences')
            }
        } catch (e) {
            console.error(e)
            toast.error('Failed to load notification preferences')
        } finally {
            setPrefsLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }
    
    const handleNotifPrefChange = (key, value) => {
        setNotifPrefs(prev => ({ ...prev, [key]: value }))
    }
    
    const saveNotifPrefs = async () => {
        setPrefsSaving(true)
        try {
            const res = await fetch('/api/notifications/preferences', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: JSON.stringify(notifPrefs)
            })
            const data = await res.json()
            if (res.ok) {
                toast.success('Notification preferences saved successfully!')
                // Update local state with server response
                setNotifPrefs(data.preferences)
            } else {
                toast.error(data.error || 'Failed to save preferences')
            }
        } catch (e) {
            console.error(e)
            toast.error('Failed to save preferences. Please try again.')
        } finally {
            setPrefsSaving(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            if (res.ok) {
                toast.success('Profile updated successfully!')
                fetchProfile() // Refresh
            } else {
                toast.error(data.error || 'Failed to update profile')
            }
        } catch (e) {
            console.error(e)
            toast.error('Failed to update profile. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Loading profile...</div>

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <User className="w-8 h-8 text-blue-500" />
                My Profile
            </h1>
            
            {/* Tabs */}
            <div className="flex gap-2 mb-8 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'profile' 
                            ? 'border-blue-500 text-blue-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <User className="w-4 h-4 inline mr-2" />
                    Profile
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'notifications' 
                            ? 'border-blue-500 text-blue-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Bell className="w-4 h-4 inline mr-2" />
                    Notifications
                </button>
            </div>

            {activeTab === 'profile' ? (
                <div className="grid md:grid-cols-3 gap-8">
                {/* Left Column: ID Card style */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden text-center p-6 relative group">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-500 to-indigo-600 -z-10" />

                        <div className="w-32 h-32 mx-auto bg-white rounded-full p-1 shadow-lg mb-4 relative">
                            <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 relative">
                                {formData.profilePic ? (
                                    <img src={formData.profilePic} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-full h-full p-4 text-slate-300" />
                                )}
                            </div>
                            <div className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow-md cursor-help" title="To change image, paste URL in the form">
                                <Camera className="w-4 h-4 text-slate-600" />
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-slate-900">{formData.firstName} {formData.lastName}</h2>
                        <p className="text-blue-600 font-medium">{user?.jobTitle}</p>
                        <p className="text-slate-400 text-sm mt-1">{user?.department}</p>

                        <div className="mt-6 pt-6 border-t border-slate-100 text-left space-y-3">
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <Briefcase className="w-4 h-4 text-slate-400" />
                                {user?.employeeId}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span className="truncate">{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                Joined {new Date(user?.joiningDate).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Edit Form */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Personal Details</h3>
                            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">Editable</span>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">First Name</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <Phone className="w-4 h-4" /> Phone Number
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+91..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> Address
                                </label>
                                <textarea
                                    name="address"
                                    rows="3"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Enter your full address..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none text-slate-900"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <Camera className="w-4 h-4" /> Profile Picture URL
                                </label>
                                <input
                                    type="text"
                                    name="profilePic"
                                    value={formData.profilePic}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-mono text-slate-900"
                                />
                                <p className="text-xs text-slate-400">Paste a direct image link (e.g. from GitHub or Imgur).</p>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-70"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            ) : (
                /* Notification Preferences Tab */
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200 p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Settings className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Notification Preferences</h3>
                            </div>
                            <p className="text-sm text-slate-600 ml-11">Manage how you receive updates and alerts</p>
                        </div>
                        
                        <div className="p-6">
                            {prefsLoading ? (
                                <div className="py-12 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                                    <p className="text-slate-500">Loading preferences...</p>
                                </div>
                            ) : notifPrefs ? (
                            <div className="space-y-6">
                                {/* Email Notifications */}
                                <div>
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 mb-4">
                                        <Mail className="w-5 h-5 text-blue-600" />
                                        <h4 className="font-semibold text-lg text-slate-900">Email Notifications</h4>
                                    </div>
                                    <div className="space-y-2">
                                        <TogglePreference
                                            label="Leave Updates"
                                            description="Get notified when your leave requests are approved or rejected"
                                            checked={notifPrefs.emailLeaveUpdates}
                                            onChange={(v) => handleNotifPrefChange('emailLeaveUpdates', v)}
                                        />
                                        <TogglePreference
                                            label="Payroll Generated"
                                            description="Get notified when your payslip is ready"
                                            checked={notifPrefs.emailPayrollGenerated}
                                            onChange={(v) => handleNotifPrefChange('emailPayrollGenerated', v)}
                                        />
                                        <TogglePreference
                                            label="Announcements"
                                            description="Company-wide announcements and updates"
                                            checked={notifPrefs.emailAnnouncements}
                                            onChange={(v) => handleNotifPrefChange('emailAnnouncements', v)}
                                        />
                                        <TogglePreference
                                            label="Attendance Alerts"
                                            description="Reminders for check-in/check-out"
                                            checked={notifPrefs.emailAttendanceAlerts}
                                            onChange={(v) => handleNotifPrefChange('emailAttendanceAlerts', v)}
                                        />
                                    </div>
                                </div>
                                
                                {/* In-App Notifications */}
                                <div>
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 mb-4">
                                        <Bell className="w-5 h-5 text-indigo-600" />
                                        <h4 className="font-semibold text-lg text-slate-900">In-App Notifications</h4>
                                    </div>
                                    <div className="space-y-2">
                                        <TogglePreference
                                            label="Leave Updates"
                                            description="Show notification when leave status changes"
                                            checked={notifPrefs.inAppLeaveUpdates}
                                            onChange={(v) => handleNotifPrefChange('inAppLeaveUpdates', v)}
                                        />
                                        <TogglePreference
                                            label="Payroll Generated"
                                            description="Show notification when payslip is available"
                                            checked={notifPrefs.inAppPayrollGenerated}
                                            onChange={(v) => handleNotifPrefChange('inAppPayrollGenerated', v)}
                                        />
                                        <TogglePreference
                                            label="Announcements"
                                            description="Show company announcements"
                                            checked={notifPrefs.inAppAnnouncements}
                                            onChange={(v) => handleNotifPrefChange('inAppAnnouncements', v)}
                                        />
                                        <TogglePreference
                                            label="Attendance Alerts"
                                            description="Show check-in/check-out reminders"
                                            checked={notifPrefs.inAppAttendanceAlerts}
                                            onChange={(v) => handleNotifPrefChange('inAppAttendanceAlerts', v)}
                                        />
                                    </div>
                                </div>
                                
                                <div className="pt-6 border-t border-slate-200 flex justify-end gap-3">
                                    <button
                                        onClick={fetchNotificationPrefs}
                                        disabled={prefsSaving}
                                        className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        onClick={saveNotifPrefs}
                                        disabled={prefsSaving}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-8 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {prefsSaving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" />
                                                Save Preferences
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
                                    <AlertCircle className="w-8 h-8 text-red-600" />
                                </div>
                                <p className="text-slate-800 font-medium mb-2">Failed to load preferences</p>
                                <p className="text-sm text-slate-500 mb-4">There was an error loading your notification settings</p>
                                <button
                                    onClick={fetchNotificationPrefs}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                </div>
            )}
        </div>
    )
}

export default function ProfilePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        }>
            <ProfileContent />
        </Suspense>
    )
}

function TogglePreference({ label, description, checked, onChange }) {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group">
            <div className="flex-1 pr-4">
                <p className="font-medium text-slate-800 mb-0.5">{label}</p>
                <p className="text-sm text-slate-500">{description}</p>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    checked ? 'bg-blue-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={checked}
                aria-label={`Toggle ${label}`}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        checked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </button>
        </div>
    )
}
