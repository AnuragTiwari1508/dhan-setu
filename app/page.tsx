"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Shield, Zap, Code, Globe, Lock, Coins } from "lucide-react"

export default function HomePage() {
  const [isConnected, setIsConnected] = useState(false)

  const features = [
    {
      icon: <Code className="h-6 w-6" />,
      title: "Modular Architecture",
      description: "Plug-and-play integration like Node.js packages",
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "REST API Enabled",
      description: "Simple APIs for real-time payment processing",
    },
    {
      icon: <Coins className="h-6 w-6" />,
      title: "Multi-Chain Support",
      description: "Ethereum, Polygon, Bitcoin - no middlemen",
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "Self-Hosted & Secure",
      description: "Full control over data and infrastructure",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Smart Contract Billing",
      description: "Automated recurring payments on-chain",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Fiat-Crypto Bridge",
      description: "Seamless fiat to crypto conversion",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DS</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DhanSetu
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/payments" className="text-gray-600 hover:text-gray-900">
              Payments
            </Link>
            <Link href="/subscriptions" className="text-gray-600 hover:text-gray-900">
              Subscriptions
            </Link>
            <Link href="/api-docs" className="text-gray-600 hover:text-gray-900">
              API Docs
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            🚀 Open Source • Self-Hosted • Developer-First
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
            Direct Blockchain Payments
            <br />
            <span className="text-gray-900">for Modern Businesses</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Accept cryptocurrency payments directly without third-party processors. Built for developers, startups, and
            digital businesses who value control, transparency, and decentralization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/dashboard">
                Start Building <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent" asChild>
              <Link href="/demo">View Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need for Crypto Payments</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From simple integrations to complex billing automation, DhanSetu provides all the tools for modern crypto
              commerce.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-blue-600">{feature.icon}</div>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">$2.5M+</div>
              <div className="text-blue-100">Volume Processed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Active Merchants</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5+</div>
              <div className="text-blue-100">Blockchain Networks</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Accept Crypto Payments?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join hundreds of businesses already using DhanSetu for secure, direct blockchain payments.
          </p>
          <Button size="lg" className="text-lg px-8" asChild>
            <Link href="/dashboard">
              Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">DS</span>
                </div>
                <span className="text-xl font-bold">DhanSetu</span>
              </div>
              <p className="text-gray-400">Self-hosted crypto payment gateway for modern businesses.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/features">Features</Link>
                </li>
                <li>
                  <Link href="/pricing">Pricing</Link>
                </li>
                <li>
                  <Link href="/api-docs">API Docs</Link>
                </li>
                <li>
                  <Link href="/integrations">Integrations</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/docs">Documentation</Link>
                </li>
                <li>
                  <Link href="/guides">Guides</Link>
                </li>
                <li>
                  <Link href="/support">Support</Link>
                </li>
                <li>
                  <Link href="/status">Status</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/about">About</Link>
                </li>
                <li>
                  <Link href="/blog">Blog</Link>
                </li>
                <li>
                  <Link href="/careers">Careers</Link>
                </li>
                <li>
                  <Link href="/contact">Contact</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 DhanSetu. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
