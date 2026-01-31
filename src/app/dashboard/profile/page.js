"use client"

import { useState, useEffect } from "react"
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Save, Loader2, Camera } from "lucide-react"

export default function ProfilePage() {
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

    useEffect(() => {
        fetchProfile()
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

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                // Show success feedback
                fetchProfile() // Refresh
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Loading profile...</div>

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <User className="w-8 h-8 text-blue-500" />
                My Profile
            </h1>

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
        </div>
    )
}
