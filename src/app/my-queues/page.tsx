"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Users, ArrowLeft, Calendar, CheckCircle, XCircle, Eye } from "lucide-react"
import Link from "next/link"

// Mock data for user's queues
const mockUserQueues = {
  active: [
    {
      id: "q1",
      serviceName: "Classic Haircut",
      companyName: "Classic Cuts Barbershop",
      position: 2,
      estimatedWait: 10,
      joinedAt: new Date(Date.now() - 15 * 60 * 1000),
      status: "waiting" as const,
      queueType: "provider-specific" as const,
      providerName: "John Smith",
    },
    {
      id: "q2",
      serviceName: "Relaxation Massage",
      companyName: "Serenity Wellness Spa",
      position: 5,
      estimatedWait: 35,
      joinedAt: new Date(Date.now() - 5 * 60 * 1000),
      status: "waiting" as const,
      queueType: "general" as const,
    },
  ],
  completed: [
    {
      id: "q3",
      serviceName: "Hair Styling",
      companyName: "Glamour Hair Studio",
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: "served" as const,
      rating: 5,
      providerName: "Sarah Johnson",
    },
    {
      id: "q4",
      serviceName: "Beard Trim",
      companyName: "Classic Cuts Barbershop",
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: "served" as const,
      rating: 4,
      providerName: "John Smith",
    },
  ],
  cancelled: [
    {
      id: "q5",
      serviceName: "Facial Treatment",
      companyName: "Beauty Spa",
      cancelledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: "cancelled" as const,
      reason: "Cancelled by user",
    },
  ],
}

export default function MyQueuesPage() {
  const [activeTab, setActiveTab] = useState("active")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Queues</h1>
              <p className="text-gray-600">Track all your queue activities</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Active ({mockUserQueues.active.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Completed ({mockUserQueues.completed.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Cancelled ({mockUserQueues.cancelled.length})
              </TabsTrigger>
            </TabsList>

            {/* Active Queues */}
            <TabsContent value="active" className="space-y-4">
              {mockUserQueues.active.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Queues</h3>
                    <p className="text-gray-600 mb-4">You're not currently in any queues</p>
                    <Link href="/">
                      <Button>Find Services</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                mockUserQueues.active.map((queue) => (
                  <Card key={queue.id} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{queue.serviceName}</CardTitle>
                          <CardDescription>{queue.companyName}</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">#{queue.position}</div>
                          <div className="text-sm text-gray-500">in line</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Wait Time</div>
                          <div className="font-medium flex items-center gap-1">
                            <Clock className="w-4 h-4 text-orange-500" />
                            {queue.estimatedWait} min
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Queue Type</div>
                          <Badge variant="outline" className="capitalize text-xs">
                            {queue.queueType.replace("-", " ")}
                          </Badge>
                        </div>
                        <div>
                          <div className="text-gray-600">Joined</div>
                          <div className="font-medium">
                            {queue.joinedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        {queue.providerName && (
                          <div>
                            <div className="text-gray-600">Provider</div>
                            <div className="font-medium">{queue.providerName}</div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/queue-status/${queue.id}`} className="flex-1">
                          <Button className="w-full">
                            <Eye className="w-4 h-4 mr-2" />
                            View Status
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          Leave Queue
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Completed Queues */}
            <TabsContent value="completed" className="space-y-4">
              {mockUserQueues.completed.map((queue) => (
                <Card key={queue.id} className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{queue.serviceName}</CardTitle>
                        <CardDescription>{queue.companyName}</CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Completed</div>
                        <div className="font-medium flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-green-500" />
                          {queue.completedAt.toLocaleDateString()}
                        </div>
                      </div>
                      {queue.providerName && (
                        <div>
                          <div className="text-gray-600">Provider</div>
                          <div className="font-medium">{queue.providerName}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-gray-600">Your Rating</div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${i < queue.rating ? "text-yellow-400" : "text-gray-300"}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Book Again
                      </Button>
                      <Button variant="ghost" size="sm">
                        Write Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Cancelled Queues */}
            <TabsContent value="cancelled" className="space-y-4">
              {mockUserQueues.cancelled.map((queue) => (
                <Card key={queue.id} className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{queue.serviceName}</CardTitle>
                        <CardDescription>{queue.companyName}</CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Cancelled
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Cancelled</div>
                        <div className="font-medium flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-red-500" />
                          {queue.cancelledAt.toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Reason</div>
                        <div className="font-medium">{queue.reason}</div>
                      </div>
                    </div>

                    <Button variant="outline" size="sm">
                      Book Again
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
