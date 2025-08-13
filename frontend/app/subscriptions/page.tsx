"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Calendar, DollarSign, Users, Pause, Play, ArrowLeft, Settings, Eye } from "lucide-react"
import Link from "next/link"

interface Subscription {
  id: string;
  planId: string;
  customerEmail: string;
  amount: string;
  currency: string;
  interval: string;
  status: string;
  nextBilling?: string;
  createdAt: string;
  metadata?: any;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  amount: string;
  currency: string;
  interval: string;
  trialDays?: number;
  metadata?: any;
}

interface Stats {
  activeSubscriptions: number;
  totalRevenue: string;
  monthlyRevenue: string;
  nextBilling: string;
}

export default function SubscriptionsPage() {
  const [selectedPlan, setSelectedPlan] = useState("")
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch subscriptions
      const subsResponse = await fetch('/api/subscriptions')
      if (subsResponse.ok) {
        const subsData = await subsResponse.json()
        setSubscriptions(subsData.subscriptions || [])
      }

      // Fetch plans
      const plansResponse = await fetch('/api/subscriptions/plans')
      if (plansResponse.ok) {
        const plansData = await plansResponse.json()
        setPlans(plansData.plans || [])
      }

      // Fetch stats
      const statsResponse = await fetch('/api/subscriptions/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSubscription = async (subscriptionId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active'
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        // Refresh data
        fetchData()
      } else {
        console.error('Failed to update subscription status')
      }
    } catch (error) {
      console.error('Error updating subscription:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "paused":
        return <Badge variant="secondary">Paused</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Subscriptions</h1>
                <p className="text-gray-600">Manage recurring crypto payments</p>
              </div>
            </div>
            <Button asChild>
              <Link href="/subscriptions/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Subscription
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Subscriptions</CardTitle>
              <div className="text-gray-400"><Users className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats?.activeSubscriptions || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Monthly Recurring Revenue</CardTitle>
              <div className="text-gray-400"><DollarSign className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats?.monthlyRevenue || "$0.00"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Next Billing</CardTitle>
              <div className="text-gray-400"><Calendar className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats?.nextBilling || "N/A"}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="active" className="space-y-6">
              <TabsList>
                <TabsTrigger value="active">Active Subscriptions</TabsTrigger>
                <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Subscriptions</CardTitle>
                    <CardDescription>Manage your recurring payment subscriptions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Next Billing</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              Loading subscriptions...
                            </TableCell>
                          </TableRow>
                        ) : subscriptions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                              No subscriptions yet. Create your first subscription plan to get started.
                            </TableCell>
                          </TableRow>
                        ) : (
                          subscriptions.map((sub) => (
                            <TableRow key={sub.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{sub.customerEmail}</div>
                                  <div className="text-sm text-gray-500">ID: {sub.id}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{plans.find(p => p.id === sub.planId)?.name || sub.planId}</div>
                                  <div className="text-sm text-gray-500">{sub.interval}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {sub.amount} {sub.currency}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Created: {new Date(sub.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(sub.status)}</TableCell>
                              <TableCell className="text-sm">
                                {sub.nextBilling ? new Date(sub.nextBilling).toLocaleDateString() : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="icon">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="icon"
                                    onClick={() => handleToggleSubscription(sub.id, sub.status)}
                                  >
                                    {sub.status === "active" ? (
                                      <Pause className="h-4 w-4" />
                                    ) : (
                                      <Play className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button variant="outline" size="icon">
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="plans" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Plans</CardTitle>
                    <CardDescription>Configure your subscription offerings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      {loading ? (
                        <div className="col-span-3 text-center py-8">Loading plans...</div>
                      ) : plans.length === 0 ? (
                        <div className="col-span-3 text-center py-8 text-gray-500">
                          No subscription plans created yet.
                        </div>
                      ) : (
                        plans.map((plan) => (
                          <Card key={plan.id} className="border-2 hover:border-blue-200 transition-colors">
                            <CardHeader>
                              <CardTitle className="text-lg">{plan.name}</CardTitle>
                              <div className="text-2xl font-bold">
                                {plan.amount} {plan.currency}
                                <span className="text-sm font-normal text-gray-500">/{plan.interval}</span>
                              </div>
                              {plan.trialDays && (
                                <div className="text-sm text-blue-600">
                                  {plan.trialDays} day trial
                                </div>
                              )}
                            </CardHeader>
                            <CardContent>
                              {plan.metadata?.features && (
                                <ul className="space-y-2 mb-4">
                                  {plan.metadata.features.map((feature: string, index: number) => (
                                    <li key={index} className="text-sm flex items-center">
                                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              <Button variant="outline" className="w-full bg-transparent">
                                Edit Plan
                              </Button>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Analytics</CardTitle>
                    <CardDescription>Track your subscription performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                      <div className="text-center">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Subscription analytics will be displayed here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Create */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Create</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="quick-plan">Select Plan</Label>
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - {plan.price} {plan.currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customer-email">Customer Email</Label>
                  <Input id="customer-email" type="email" placeholder="customer@example.com" />
                </div>
                <Button className="w-full">Create Subscription</Button>
              </CardContent>
            </Card>

            {/* Subscription Stats */}
            <Card>
              <CardHeader>
                <CardTitle>This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">New Subscriptions</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cancelled</span>
                  <span className="font-medium">1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Churn Rate</span>
                  <span className="font-medium">5.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Revenue</span>
                  <span className="font-medium">$159.94</span>
                </div>
              </CardContent>
            </Card>

            {/* Smart Contract Info */}
            <Card>
              <CardHeader>
                <CardTitle>Smart Contract</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ERC-948 Contract</span>
                  <Badge variant="default">Deployed</Badge>
                </div>
                <div className="text-xs font-mono bg-gray-100 p-2 rounded">0x1234...abcd</div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Network</span>
                  <span className="text-sm">Ethereum</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gas Optimized</span>
                  <span className="text-sm text-green-600">Yes</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
