'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

function VerifyEmailContent() {
    const [status, setStatus] = useState('verifying') // verifying, success, error
    const [message, setMessage] = useState('')
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    useEffect(() => {
        if (!token) {
            setStatus('error')
            setMessage('Invalid verification link')
            return
        }

        verifyEmail()
    }, [token])

    const verifyEmail = async () => {
        try {
            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            })

            const data = await response.json()

            if (response.ok) {
                setStatus('success')
                setMessage(data.message)
                setTimeout(() => {
                    router.push('/login')
                }, 3000)
            } else {
                setStatus('error')
                setMessage(data.error || 'Verification failed')
            }
        } catch (err) {
            setStatus('error')
            setMessage('Network error. Please try again')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center"
            >
                {status === 'verifying' && (
                    <>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="inline-block mb-6"
                        >
                            <Loader className="w-16 h-16 text-blue-600" />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Verifying Email...</h1>
                        <p className="text-slate-600">Please wait while we verify your email address</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className="inline-block mb-6"
                        >
                            <CheckCircle className="w-16 h-16 text-green-600" />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Email Verified!</h1>
                        <p className="text-slate-600 mb-4">{message}</p>
                        <p className="text-sm text-slate-500">Redirecting to login...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className="inline-block mb-6"
                        >
                            <XCircle className="w-16 h-16 text-red-600" />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed</h1>
                        <p className="text-slate-600 mb-6">{message}</p>
                        
                        <div className="space-y-3">
                            <Link
                                href="/auth/resend-verification"
                                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
                            >
                                Request New Link
                            </Link>
                            <Link
                                href="/login"
                                className="block w-full text-slate-600 hover:text-slate-800 font-medium"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    )
}
