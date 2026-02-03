'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'

function ResetPasswordForm() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [errors, setErrors] = useState([])
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    useEffect(() => {
        if (!token) {
            setError('Invalid reset link. Please request a new password reset')
        }
    }, [token])

    const validatePassword = (pwd) => {
        const validationErrors = []
        if (pwd.length < 8) validationErrors.push('At least 8 characters')
        if (!/[A-Z]/.test(pwd)) validationErrors.push('One uppercase letter')
        if (!/[a-z]/.test(pwd)) validationErrors.push('One lowercase letter')
        if (!/[0-9]/.test(pwd)) validationErrors.push('One number')
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) validationErrors.push('One special character')
        return validationErrors
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setMessage('')
        setErrors([])

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        const validationErrors = validatePassword(password)
        if (validationErrors.length > 0) {
            setErrors(validationErrors)
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password })
            })

            const data = await response.json()

            if (response.ok) {
                setMessage(data.message)
                setTimeout(() => {
                    router.push('/login')
                }, 2000)
            } else {
                setError(data.error || 'Failed to reset password')
                if (data.details) {
                    setErrors(data.details)
                }
            }
        } catch (err) {
            setError('Network error. Please try again')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Password</h1>
                    <p className="text-slate-600">
                        Enter your new password below
                    </p>
                </div>

                {message && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6"
                    >
                        <p className="text-sm">{message}</p>
                        <p className="text-xs mt-2">Redirecting to login...</p>
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6"
                    >
                        <p className="text-sm">{error}</p>
                    </motion.div>
                )}

                {errors.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <p className="text-sm font-medium text-yellow-900 mb-2">Password must contain:</p>
                        <ul className="text-xs text-yellow-800 space-y-1">
                            {errors.map((err, idx) => (
                                <li key={idx}>• {err}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {token && !message && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Enter new password"
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-900 placeholder:text-slate-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Confirm new password"
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-900 placeholder:text-slate-400"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                {!token && (
                    <div className="text-center">
                        <Link
                            href="/auth/forgot-password"
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Request a new reset link →
                        </Link>
                    </div>
                )}

                <div className="mt-6 text-center">
                    <Link
                        href="/login"
                        className="text-sm text-slate-600 hover:text-slate-800 font-medium"
                    >
                        ← Back to Login
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    )
}
