"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Copy, LinkIcon, Wallet, CreditCard } from "lucide-react"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"

export default function CreatePayment() {
  const [paymentData, setPaymentData] = useState({
    amount: "",
    currency: "ETH",
    network: "ethereum",
    description: "",
    customerEmail: "",
    redirectUrl: "",
    enableFiatBridge: false,
    expiresIn: "24",
  })

  const [generatedPayment, setGeneratedPayment] = useState(null)

  const handleCreatePayment = async () => {
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentData.amount,
          currency: paymentData.currency,
          network: paymentData.network,
          description: paymentData.description,
          customerEmail: paymentData.customerEmail,
          redirectUrl: paymentData.redirectUrl,
          expiresAt: new Date(Date.now() + parseInt(paymentData.expiresIn) * 60 * 60 * 1000).toISOString(),
          metadata: {
            enableFiatBridge: paymentData.enableFiatBridge
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment');
      }

      const payment = await response.json();
      
      setGeneratedPayment({
        id: payment.id,
        link: payment.paymentLink,
        walletAddress: payment.walletAddress,
        qrData: payment.qrData,
        expiresAt: payment.expiresAt,
        amount: payment.amount,
        currency: payment.currency,
        network: payment.network
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Failed to create payment. Please try again.');
    }
  }

  const copyToClipboard = (text) => {
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
              <h1 className="text-2xl font-bold">Create Payment</h1>
              <p className="text-gray-600">Generate a new crypto payment request</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>Configure your payment request settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency *</Label>
                    <Select
                      value={paymentData.currency}
                      onValueChange={(value) => setPaymentData({ ...paymentData, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ETH">ETH - Ethereum</SelectItem>
                        <SelectItem value="MATIC">MATIC - Polygon</SelectItem>
                        <SelectItem value="USDC">USDC - USD Coin</SelectItem>
                        <SelectItem value="USDT">USDT - Tether</SelectItem>
                        <SelectItem value="DAI">DAI - Dai Stablecoin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="network">Blockchain Network *</Label>
                  <Select
                    value={paymentData.network}
                    onValueChange={(value) => setPaymentData({ ...paymentData, network: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ethereum">Ethereum Mainnet</SelectItem>
                      <SelectItem value="polygon">Polygon (Matic)</SelectItem>
                      <SelectItem value="goerli">Ethereum Goerli (Testnet)</SelectItem>
                      <SelectItem value="mumbai">Polygon Mumbai (Testnet)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Payment for services, products, etc."
                    value={paymentData.description}
                    onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="customer-email">Customer Email</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    placeholder="customer@example.com"
                    value={paymentData.customerEmail}
                    onChange={(e) => setPaymentData({ ...paymentData, customerEmail: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="redirect-url">Success Redirect URL</Label>
                  <Input
                    id="redirect-url"
                    type="url"
                    placeholder="https://yoursite.com/success"
                    value={paymentData.redirectUrl}
                    onChange={(e) => setPaymentData({ ...paymentData, redirectUrl: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="fiat-bridge"
                    checked={paymentData.enableFiatBridge}
                    onCheckedChange={(checked) => setPaymentData({ ...paymentData, enableFiatBridge: checked })}
                  />
                  <Label htmlFor="fiat-bridge">Enable Fiat-to-Crypto Bridge</Label>
                </div>

                <div>
                  <Label htmlFor="expires">Expires In (hours)</Label>
                  <Select
                    value={paymentData.expiresIn}
                    onValueChange={(value) => setPaymentData({ ...paymentData, expiresIn: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="6">6 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="72">3 days</SelectItem>
                      <SelectItem value="168">1 week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  onClick={handleCreatePayment}
                  disabled={!paymentData.amount || !paymentData.currency}
                >
                  Create Payment Request
                </Button>
              </CardContent>
            </Card>

            {/* Generated Payment */}
            {generatedPayment && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Created Successfully</CardTitle>
                  <CardDescription>Share this payment link with your customer</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="link" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="link">Payment Link</TabsTrigger>
                      <TabsTrigger value="qr">QR Code</TabsTrigger>
                      <TabsTrigger value="embed">Embed</TabsTrigger>
                    </TabsList>

                    <TabsContent value="link" className="space-y-4">
                      <div>
                        <Label>Payment ID</Label>
                        <div className="flex space-x-2">
                          <Input value={generatedPayment.id} readOnly className="font-mono" />
                          <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedPayment.id)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label>Payment Link</Label>
                        <div className="flex space-x-2">
                          <Input value={generatedPayment.link} readOnly />
                          <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedPayment.link)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label>Wallet Address</Label>
                        <div className="flex space-x-2">
                          <Input value={generatedPayment.walletAddress} readOnly className="font-mono" />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(generatedPayment.walletAddress)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button asChild className="flex-1">
                          <Link href={generatedPayment.link}>
                            <LinkIcon className="h-4 w-4 mr-2" />
                            View Payment Page
                          </Link>
                        </Button>
                        <Button variant="outline" asChild className="flex-1 bg-transparent">
                          <Link href="/dashboard">Back to Dashboard</Link>
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="qr" className="space-y-4">
                      <div className="flex justify-center">
                        <div className="p-4 bg-white border rounded-lg">
                          <QRCodeSVG value={generatedPayment.qrData} size={200} level="M" includeMargin={true} />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Scan with any Ethereum wallet</p>
                        <Badge variant="secondary">
                          {generatedPayment.amount} {generatedPayment.currency}
                        </Badge>
                      </div>
                    </TabsContent>

                    <TabsContent value="embed" className="space-y-4">
                      <div>
                        <Label>HTML Embed Code</Label>
                        <Textarea
                          value={`<iframe src="${generatedPayment.link}" width="400" height="600" frameborder="0"></iframe>`}
                          readOnly
                          className="font-mono"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>JavaScript Widget</Label>
                        <Textarea
                          value={`<script src="https://dhansetu.com/widget.js"></script>
<div id="dhansetu-payment" data-payment-id="${generatedPayment.id}"></div>`}
                          readOnly
                          className="font-mono"
                          rows={3}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Payment Preview */}
            {!generatedPayment && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Preview</CardTitle>
                  <CardDescription>Preview how your payment request will look</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
                        <CreditCard className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">Payment Request</h3>
                        <p className="text-gray-500">
                          {paymentData.amount
                            ? `${paymentData.amount} ${paymentData.currency}`
                            : "Enter amount to preview"}
                        </p>
                      </div>
                      {paymentData.description && <p className="text-sm text-gray-600">{paymentData.description}</p>}
                      <div className="flex justify-center space-x-2">
                        <Badge variant="outline">
                          <Wallet className="h-3 w-3 mr-1" />
                          {paymentData.network}
                        </Badge>
                        {paymentData.enableFiatBridge && (
                          <Badge variant="outline">
                            <CreditCard className="h-3 w-3 mr-1" />
                            Fiat Bridge
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
