"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Video, Users, Shield, Clock, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect authenticated users to their dashboard
      if (user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Video className="h-8 w-8 text-indigo-500" />
              <span className="text-xl font-bold text-white">VideoConf</span>
            </div>
            <div className="flex space-x-4">
              <Link href="/login" className="btn-outline">
                Sign In
              </Link>
              <Link href="/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Professional Video
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              {" "}
              Conferencing
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Connect, collaborate, and communicate with crystal-clear video calls, advanced admin controls, and
            enterprise-grade security.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary text-lg px-8 py-4">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="/login" className="btn-outline text-lg px-8 py-4">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything you need for professional meetings
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            From small team calls to large webinars, our platform scales with your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">HD Video & Audio</h3>
            <p className="text-slate-400">
              Crystal-clear video calls with advanced noise cancellation and adaptive bitrate
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Team Collaboration</h3>
            <p className="text-slate-400">
              Screen sharing, chat, file sharing, and interactive whiteboards for seamless collaboration
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Admin Controls</h3>
            <p className="text-slate-400">Advanced moderation tools, user management, and comprehensive analytics</p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Meeting Recording</h3>
            <p className="text-slate-400">Automatic recording with cloud storage and easy sharing capabilities</p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Enterprise Security</h3>
            <p className="text-slate-400">
              End-to-end encryption, SSO integration, and compliance with industry standards
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowRight className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Easy Integration</h3>
            <p className="text-slate-400">Seamless integration with popular calendar and productivity tools</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="card text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to transform your meetings?</h2>
          <p className="text-slate-400 text-lg mb-8">
            Join thousands of teams already using our platform for better communication
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary text-lg px-8 py-4">
              Start Your Free Trial
            </Link>
            <Link href="/login" className="btn-outline text-lg px-8 py-4">
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Video className="h-6 w-6 text-indigo-500" />
              <span className="text-lg font-semibold text-white">VideoConf</span>
            </div>
            <div className="text-slate-400 text-sm">© 2024 VideoConf. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
