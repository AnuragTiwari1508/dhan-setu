"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, Copy, ExternalLink, CheckCircle, Clock, CreditCard, AlertCircle } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

export default function PaymentPage({ params }: { params: { id: string } }) {
  const [paymentStatus, setPaymentStatus] = useState("pending")
  const [connectedWallet, setConnectedWallet] = useState(null)
  const [transactionHash, setTransactionHash] = useState("")
  const [paymentData, setPaymentData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch payment data from API
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        const response = await fetch(`/api/payments/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setPaymentData(data);
          setPaymentStatus(data.status);
        } else {
          console.error('Payment not found');
        }
      } catch (error) {
        console.error('Error fetching payment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Not Found</h1>
          <p className="text-gray-600">The payment link you're looking for doesn't exist or has expired.</p>
        </div>
      </div>
    );
  }

  const qrData = paymentData?.qrData || `ethereum:${paymentData?.walletAddress}?value=${Number.parseFloat(paymentData?.amount || '0') * 1e18}&gas=21000`

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
        setConnectedWallet(accounts[0])
      } catch (error) {
        console.error("Failed to connect wallet:", error)
      }
    } else {
      alert("Please install MetaMask or another Web3 wallet")
    }
  }

  const sendPayment = async () => {
    if (!connectedWallet) {
      await connectWallet()
      return
    }

    try {
      setPaymentStatus("processing")

      // In a real implementation, you would:
      // 1. Send the transaction using the connected wallet
      // 2. Get the transaction hash
      // 3. Validate the payment via the API

      // For now, simulate the process
      const mockTxHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      
      // Validate payment with backend
      const response = await fetch(`/api/payments/${params.id}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionHash: mockTxHash
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.valid) {
          setTransactionHash(mockTxHash);
          setPaymentStatus("completed");
        } else {
          setPaymentStatus("failed");
        }
      } else {
        setPaymentStatus("failed");
      }
    } catch (error) {
      console.error("Payment failed:", error)
      setPaymentStatus("failed")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "processing":
        return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (paymentStatus) {
      case "completed":
        return "bg-green-50 border-green-200"
      case "processing":
        return "bg-yellow-50 border-yellow-200"
      case "failed":
        return "bg-red-50 border-red-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-xl">DS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{paymentData.merchantName}</h1>
          <p className="text-gray-600">Secure crypto payment powered by DhanSetu</p>
        </div>

        {/* Payment Status */}
        <Card className={`mb-6 ${getStatusColor()}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              {getStatusIcon()}
              <span className="font-medium capitalize">{paymentStatus}</span>
            </div>
            {paymentStatus === "completed" && transactionHash && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 mb-2">Transaction Hash:</p>
                <div className="flex items-center justify-center space-x-2">
                  <code className="text-xs bg-white px-2 py-1 rounded border">{transactionHash.slice(0, 20)}...</code>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(transactionHash)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Payment Request
              <Badge variant="outline">{paymentData.network}</Badge>
            </CardTitle>
            <CardDescription>{paymentData.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Amount:</span>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {paymentData.amount} {paymentData.currency}
                  </div>
                  <div className="text-sm text-gray-500">{paymentData.usdValue}</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Network:</span>
                <Badge>{paymentData.network}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Expires:</span>
                <span className="text-sm">{new Date(paymentData.expiresAt).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        {paymentStatus === "pending" && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="wallet" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="wallet">Wallet</TabsTrigger>
                  <TabsTrigger value="qr">QR Code</TabsTrigger>
                  {paymentData.enableFiatBridge && <TabsTrigger value="fiat">Fiat Bridge</TabsTrigger>}
                </TabsList>

                <TabsContent value="wallet" className="space-y-4">
                  <div className="text-center space-y-4">
                    {connectedWallet ? (
                      <div>
                        <Alert>
                          <Wallet className="h-4 w-4" />
                          <AlertDescription>
                            Connected: {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
                          </AlertDescription>
                        </Alert>
                        <Button className="w-full mt-4" onClick={sendPayment} disabled={paymentStatus === "processing"}>
                          {paymentStatus === "processing"
                            ? "Processing..."
                            : `Pay ${paymentData.amount} ${paymentData.currency}`}
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-600 mb-4">Connect your wallet to pay with {paymentData.currency}</p>
                        <Button className="w-full" onClick={connectWallet}>
                          <Wallet className="h-4 w-4 mr-2" />
                          Connect Wallet
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="qr" className="space-y-4">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 bg-white border rounded-lg">
                        <QRCodeSVG value={qrData} size={200} level="M" includeMargin={true} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Scan with any Ethereum wallet</p>
                      <div className="space-y-2">
                        <div>
                          <Label>Wallet Address</Label>
                          <div className="flex space-x-2">
                            <Input value={paymentData.walletAddress} readOnly className="font-mono text-sm" />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(paymentData.walletAddress)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {paymentData.enableFiatBridge && (
                  <TabsContent value="fiat" className="space-y-4">
                    <div className="text-center space-y-4">
                      <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg">
                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="font-medium mb-2">Pay with Credit Card</h3>
                        <p className="text-sm text-gray-600 mb-4">Convert fiat to crypto automatically</p>
                        <Button className="w-full">Pay {paymentData.usdValue} with Card</Button>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {paymentStatus === "completed" && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-green-900 mb-2">Payment Successful!</h2>
              <p className="text-green-700 mb-4">
                Your payment of {paymentData.amount} {paymentData.currency} has been confirmed.
              </p>
              <Button variant="outline">Return to Merchant</Button>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Powered by <span className="font-medium">DhanSetu</span> • Secure • Decentralized
          </p>
        </div>
      </div>
    </div>
  )
}
