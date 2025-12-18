import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { NotificationProvider } from "@/contexts/NotificationContext"
import { NotificationContainer } from "@/components/ui/NotificationContainer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Video Conferencing App",
  description: "Professional video conferencing platform"
    
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <NotificationProvider>
            {children}
            <NotificationContainer />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
