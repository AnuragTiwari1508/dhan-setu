"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code, Copy, ArrowLeft, Webhook, Book, Globe } from "lucide-react"
import Link from "next/link"

export default function ApiDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState("create-payment")
  const [apiKey, setApiKey] = useState("ds_live_sk_1234567890abcdef")

  const endpoints = [
    {
      id: "create-payment",
      method: "POST",
      path: "/api/v1/payments",
      title: "Create Payment",
      description: "Create a new crypto payment request",
    },
    {
      id: "get-payment",
      method: "GET",
      path: "/api/v1/payments/{id}",
      title: "Get Payment",
      description: "Retrieve payment details by ID",
    },
    {
      id: "list-payments",
      method: "GET",
      path: "/api/v1/payments",
      title: "List Payments",
      description: "Get all payments with pagination",
    },
    {
      id: "create-subscription",
      method: "POST",
      path: "/api/v1/subscriptions",
      title: "Create Subscription",
      description: "Set up recurring payments",
    },
    {
      id: "webhooks",
      method: "POST",
      path: "/webhooks",
      title: "Webhooks",
      description: "Receive payment notifications",
    },
  ]

  const codeExamples = {
    "create-payment": {
      curl: `curl -X POST https://api.dhansetu.com/v1/payments \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": "0.5",
    "currency": "ETH",
    "network": "ethereum",
    "description": "Payment for services",
    "customer_email": "customer@example.com",
    "redirect_url": "https://yoursite.com/success"
  }'`,
      javascript: `const payment = await fetch('https://api.dhansetu.com/v1/payments', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: '0.5',
    currency: 'ETH', 
    network: 'ethereum',
    description: 'Payment for services',
    customer_email: 'customer@example.com',
    redirect_url: 'https://yoursite.com/success'
  })
});

const result = await payment.json();
console.log(result);`,
      python: `import requests

url = "https://api.dhansetu.com/v1/payments"
headers = {
    "Authorization": f"Bearer ${apiKey}",
    "Content-Type": "application/json"
}
data = {
    "amount": "0.5",
    "currency": "ETH",
    "network": "ethereum", 
    "description": "Payment for services",
    "customer_email": "customer@example.com",
    "redirect_url": "https://yoursite.com/success"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`,
    },
    "get-payment": {
      curl: `curl -X GET https://api.dhansetu.com/v1/payments/pay_1234567890 \\
  -H "Authorization: Bearer ${apiKey}"`,
      javascript: `const payment = await fetch('https://api.dhansetu.com/v1/payments/pay_1234567890', {
  headers: {
    'Authorization': 'Bearer ${apiKey}'
  }
});

const result = await payment.json();
console.log(result);`,
      python: `import requests

url = "https://api.dhansetu.com/v1/payments/pay_1234567890"
headers = {"Authorization": f"Bearer ${apiKey}"}

response = requests.get(url, headers=headers)
print(response.json())`,
    },
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">API Documentation</h1>
              <p className="text-gray-600">Integrate DhanSetu into your application</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg">API Reference</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {endpoints.map((endpoint) => (
                    <button
                      key={endpoint.id}
                      onClick={() => setSelectedEndpoint(endpoint.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedEndpoint === endpoint.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant={endpoint.method === "POST" ? "default" : "secondary"} className="text-xs">
                          {endpoint.method}
                        </Badge>
                        <span className="font-medium text-sm">{endpoint.title}</span>
                      </div>
                      <div className="text-xs text-gray-500 font-mono">{endpoint.path}</div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Getting Started */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Book className="h-5 w-5" />
                    <span>Getting Started</span>
                  </CardTitle>
                  <CardDescription>Quick start guide to integrate DhanSetu API</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">1. Get your API Key</h3>
                    <div className="flex space-x-2">
                      <Input value={apiKey} readOnly className="font-mono" />
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(apiKey)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">2. Base URL</h3>
                    <code className="block bg-gray-100 p-2 rounded text-sm">https://api.dhansetu.com/v1</code>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">3. Authentication</h3>
                    <p className="text-sm text-gray-600 mb-2">Include your API key in the Authorization header:</p>
                    <code className="block bg-gray-100 p-2 rounded text-sm">Authorization: Bearer YOUR_API_KEY</code>
                  </div>
                </CardContent>
              </Card>

              {/* API Endpoint Details */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Badge
                          variant={
                            endpoints.find((e) => e.id === selectedEndpoint)?.method === "POST"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {endpoints.find((e) => e.id === selectedEndpoint)?.method}
                        </Badge>
                        <span>{endpoints.find((e) => e.id === selectedEndpoint)?.title}</span>
                      </CardTitle>
                      <CardDescription>{endpoints.find((e) => e.id === selectedEndpoint)?.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Endpoint URL */}
                    <div>
                      <Label className="text-sm font-medium">Endpoint</Label>
                      <code className="block bg-gray-100 p-3 rounded mt-1 font-mono text-sm">
                        {endpoints.find((e) => e.id === selectedEndpoint)?.method}{" "}
                        {endpoints.find((e) => e.id === selectedEndpoint)?.path}
                      </code>
                    </div>

                    {/* Request Parameters */}
                    {selectedEndpoint === "create-payment" && (
                      <div>
                        <Label className="text-sm font-medium">Request Body</Label>
                        <div className="mt-2 space-y-2">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="font-medium">Parameter</div>
                            <div className="font-medium">Type</div>
                            <div className="font-medium">Description</div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm py-2 border-t">
                            <code>amount</code>
                            <span>string</span>
                            <span>Payment amount</span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm py-2 border-t">
                            <code>currency</code>
                            <span>string</span>
                            <span>ETH, MATIC, USDC, USDT</span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm py-2 border-t">
                            <code>network</code>
                            <span>string</span>
                            <span>ethereum, polygon</span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm py-2 border-t">
                            <code>description</code>
                            <span>string</span>
                            <span>Payment description</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Code Examples */}
                    <div>
                      <Label className="text-sm font-medium">Code Examples</Label>
                      <Tabs defaultValue="curl" className="mt-2">
                        <TabsList>
                          <TabsTrigger value="curl">cURL</TabsTrigger>
                          <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                          <TabsTrigger value="python">Python</TabsTrigger>
                        </TabsList>

                        {Object.entries(codeExamples[selectedEndpoint] || {}).map(([lang, code]) => (
                          <TabsContent key={lang} value={lang}>
                            <div className="relative">
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                                <code>{code}</code>
                              </pre>
                              <Button
                                variant="outline"
                                size="icon"
                                className="absolute top-2 right-2 bg-transparent"
                                onClick={() => copyToClipboard(code)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </div>

                    {/* Response Example */}
                    <div>
                      <Label className="text-sm font-medium">Response</Label>
                      <pre className="bg-gray-100 p-4 rounded-lg mt-2 text-sm overflow-x-auto">
                        <code>{`{
  "id": "pay_1234567890",
  "amount": "0.5",
  "currency": "ETH",
  "network": "ethereum",
  "status": "pending",
  "payment_url": "https://pay.dhansetu.com/pay_1234567890",
  "wallet_address": "0x742d35Cc6634C0532925a3b8D4C9db96590c6C87",
  "qr_code": "data:image/png;base64,iVBOR...",
  "expires_at": "2024-01-16T14:30:00Z",
  "created_at": "2024-01-15T14:30:00Z"
}`}</code>
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Webhooks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Webhook className="h-5 w-5" />
                    <span>Webhooks</span>
                  </CardTitle>
                  <CardDescription>Receive real-time notifications about payment events</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Webhook URL</Label>
                    <Input placeholder="https://yoursite.com/webhooks/dhansetu" />
                  </div>

                  <div>
                    <Label>Events</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="payment.completed" defaultChecked />
                        <label htmlFor="payment.completed" className="text-sm">
                          payment.completed
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="payment.failed" defaultChecked />
                        <label htmlFor="payment.failed" className="text-sm">
                          payment.failed
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="subscription.renewed" defaultChecked />
                        <label htmlFor="subscription.renewed" className="text-sm">
                          subscription.renewed
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Webhook Payload Example</Label>
                    <pre className="bg-gray-100 p-4 rounded-lg mt-2 text-sm overflow-x-auto">
                      <code>{`{
  "event": "payment.completed",
  "data": {
    "id": "pay_1234567890",
    "amount": "0.5",
    "currency": "ETH",
    "network": "ethereum",
    "transaction_hash": "0xabc123...",
    "customer_email": "customer@example.com",
    "completed_at": "2024-01-15T14:35:00Z"
  }
}`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* SDKs and Libraries */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="h-5 w-5" />
                    <span>SDKs & Libraries</span>
                  </CardTitle>
                  <CardDescription>Official libraries for popular programming languages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Node.js</h3>
                      <code className="text-sm bg-gray-100 p-2 rounded block mb-2">npm install @dhansetu/node</code>
                      <Button variant="outline" size="sm">
                        <Globe className="h-4 w-4 mr-2" />
                        Documentation
                      </Button>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Python</h3>
                      <code className="text-sm bg-gray-100 p-2 rounded block mb-2">pip install dhansetu</code>
                      <Button variant="outline" size="sm">
                        <Globe className="h-4 w-4 mr-2" />
                        Documentation
                      </Button>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">PHP</h3>
                      <code className="text-sm bg-gray-100 p-2 rounded block mb-2">composer require dhansetu/php</code>
                      <Button variant="outline" size="sm">
                        <Globe className="h-4 w-4 mr-2" />
                        Documentation
                      </Button>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">React</h3>
                      <code className="text-sm bg-gray-100 p-2 rounded block mb-2">npm install @dhansetu/react</code>
                      <Button variant="outline" size="sm">
                        <Globe className="h-4 w-4 mr-2" />
                        Documentation
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
