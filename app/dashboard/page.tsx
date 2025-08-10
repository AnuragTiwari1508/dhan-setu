"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Plus,
  Eye,
  Copy,
  ExternalLink,
  Wallet,
  Settings,
  Bell,
  BarChart3,
} from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const [selectedNetwork, setSelectedNetwork] = useState("ethereum")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentCurrency, setPaymentCurrency] = useState("ETH")
  const [stats, setStats] = useState([
    {
      title: "Total Revenue",
      value: "$0.00",
      change: "+0%",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: "Transactions",
      value: "0",
      change: "+0%",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      title: "Active Subscriptions",
      value: "0",
      change: "+0%",
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: "Success Rate",
      value: "0%",
      change: "+0%",
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ])
  const [recentTransactions, setRecentTransactions] = useState([])

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch payment stats
        const paymentStatsResponse = await fetch('/api/payments/stats');
        const paymentStats = await paymentStatsResponse.json();
        
        // Fetch subscription stats
        const subscriptionStatsResponse = await fetch('/api/subscriptions/stats');
        const subscriptionStats = await subscriptionStatsResponse.json();
        
        // Fetch recent payments
        const paymentsResponse = await fetch('/api/payments?limit=5');
        const paymentsData = await paymentsResponse.json();

        // Update stats
        setStats([
          {
            title: "Total Revenue",
            value: `$${paymentStats.totalAmount.toFixed(2)}`,
            change: "+12.5%", // You can calculate this based on historical data
            icon: <DollarSign className="h-4 w-4" />,
          },
          {
            title: "Transactions",
            value: paymentStats.totalPayments.toString(),
            change: "+8.2%",
            icon: <CreditCard className="h-4 w-4" />,
          },
          {
            title: "Active Subscriptions",
            value: subscriptionStats.activeSubscriptions.toString(),
            change: "+23.1%",
            icon: <Users className="h-4 w-4" />,
          },
          {
            title: "Success Rate",
            value: paymentStats.totalPayments > 0 
              ? `${((paymentStats.confirmedPayments / paymentStats.totalPayments) * 100).toFixed(1)}%`
              : "0%",
            change: "+0.3%",
            icon: <TrendingUp className="h-4 w-4" />,
          },
        ]);

        // Update recent transactions
        setRecentTransactions(paymentsData.payments || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const generatePaymentLink = async () => {
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentAmount,
          currency: paymentCurrency,
          network: selectedNetwork,
          description: 'Quick payment from dashboard'
        })
      });

      if (response.ok) {
        const payment = await response.json();
        navigator.clipboard.writeText(payment.paymentLink);
        alert("Payment link copied to clipboard!");
      } else {
        alert("Failed to create payment link");
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert("Error creating payment link");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">DS</span>
                </div>
                <span className="text-xl font-bold">DhanSetu</span>
              </Link>
              <Badge variant="secondary">Dashboard</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                <div className="text-gray-400">{stat.icon}</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="payments" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="payments" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Your latest crypto payment transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transaction ID</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Network</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentTransactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="font-mono text-sm">{tx.id}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{tx.amount} {tx.currency}</div>
                                <div className="text-sm text-gray-500">${(parseFloat(tx.amount) * 2500).toFixed(2)}</div>
                              </div>
                            </TableCell>
                            <TableCell>{tx.metadata?.customerEmail || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={tx.status === "confirmed" ? "default" : tx.status === "pending" ? "secondary" : "destructive"}>
                                {tx.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="capitalize">{tx.network}</TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(tx.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="icon" asChild>
                                  <Link href={`/pay/${tx.id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                                {tx.transactionHash && (
                                  <Button variant="outline" size="icon" asChild>
                                    <Link href={`https://etherscan.io/tx/${tx.transactionHash}`} target="_blank">
                                      <ExternalLink className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {recentTransactions.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                              No transactions yet. Create your first payment to get started.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="subscriptions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Subscriptions</CardTitle>
                    <CardDescription>Manage recurring payment subscriptions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">Premium Plan</h3>
                          <p className="text-sm text-gray-500">Monthly subscription - $29.99</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge>Active</Badge>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">API Access</h3>
                          <p className="text-sm text-gray-500">Annual subscription - $299.99</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge>Active</Badge>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Analytics</CardTitle>
                    <CardDescription>Detailed insights into your payment performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Analytics charts will be displayed here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>API Configuration</CardTitle>
                    <CardDescription>Configure your API keys and webhook endpoints</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="api-key">API Key</Label>
                      <div className="flex space-x-2">
                        <Input id="api-key" value="ds_live_sk_1234567890abcdef" readOnly className="font-mono" />
                        <Button variant="outline" size="icon">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="webhook-url">Webhook URL</Label>
                      <Input id="webhook-url" placeholder="https://your-app.com/webhooks/dhansetu" />
                    </div>
                    <Button>Save Settings</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" asChild>
                  <Link href="/payments/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Payment
                  </Link>
                </Button>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/subscriptions/create">
                    <Users className="h-4 w-4 mr-2" />
                    New Subscription
                  </Link>
                </Button>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/wallets">
                    <Wallet className="h-4 w-4 mr-2" />
                    Manage Wallets
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Create Payment Link */}
            <Card>
              <CardHeader>
                <CardTitle>Create Payment Link</CardTitle>
                <CardDescription>Generate a quick payment link</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={paymentCurrency} onValueChange={setPaymentCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="MATIC">MATIC</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="USDT">USDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="network">Network</Label>
                  <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                      <SelectItem value="polygon">Polygon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={generatePaymentLink}>
                  Generate Link
                </Button>
              </CardContent>
            </Card>

            {/* Network Status */}
            <Card>
              <CardHeader>
                <CardTitle>Network Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Ethereum</span>
                  <Badge variant="default">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Polygon</span>
                  <Badge variant="default">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Fiat Bridge</span>
                  <Badge variant="default">Online</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
