"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Bell, 
  ShieldCheck, 
  User, 
  Search,
  CheckCircle2,
  Clock
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog"

const MOCK_REQUESTS = [
  {
    id: "req-1",
    name: "Michael Smith",
    mobile: "+1 555-0199",
    description: "Discussion about new software architecture and cloud migration strategy.",
    slot: "Dec 25, 2024 - 10:00 AM",
    status: "pending",
    proofUrl: "https://picsum.photos/seed/pay1/600/800",
  },
  {
    id: "req-2",
    name: "Sarah Jenkins",
    mobile: "+1 555-0122",
    description: "Marketing campaign review for the upcoming holiday season sale.",
    slot: "Dec 26, 2024 - 02:30 PM",
    status: "pending",
    proofUrl: "https://picsum.photos/seed/pay2/600/800",
  }
]

export default function AdminDashboard() {
  const [requests, setRequests] = useState(MOCK_REQUESTS)
  const { toast } = useToast()

  const handleAction = (id: string, action: 'confirmed' | 'rejected') => {
    setRequests(prev => prev.filter(r => r.id !== id))
    toast({
      title: action === 'confirmed' ? "Booking Confirmed" : "Booking Rejected",
      description: `Notification and email sent to the client.`,
    })
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-headline font-bold">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Manage incoming meeting requests</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-accent rounded-full animate-pulse" />
            </Button>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white shadow-sm border-none">
            <CardHeader className="pb-2">
              <CardDescription>Pending Requests</CardDescription>
              <CardTitle className="text-3xl font-headline">{requests.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white shadow-sm border-none">
            <CardHeader className="pb-2">
              <CardDescription>Verified Today</CardDescription>
              <CardTitle className="text-3xl font-headline">12</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white shadow-sm border-none">
            <CardHeader className="pb-2">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-3xl font-headline">$1,240</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-headline font-semibold">Verification Queue</h2>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search requests..." className="pl-10 bg-white" />
            </div>
          </div>

          <div className="grid gap-4">
            {requests.map((req) => (
              <Card key={req.id} className="bg-white border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  <div className="flex-1 p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold">{req.name}</h3>
                        <p className="text-sm text-muted-foreground">{req.mobile}</p>
                      </div>
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-none">
                        <Clock className="h-3 w-3 mr-1" /> {req.slot}
                      </Badge>
                    </div>
                    
                    <p className="text-sm line-clamp-2 bg-muted/50 p-3 rounded-md italic">
                      &quot;{req.description}&quot;
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" /> Verify Payment
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Payment Verification</DialogTitle>
                            <DialogDescription>Verify the screenshot provided by {req.name}</DialogDescription>
                          </DialogHeader>
                          <div className="relative aspect-[3/4] rounded-lg overflow-hidden border">
                            <img 
                              src={req.proofUrl} 
                              alt="Payment proof" 
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <DialogFooter className="sm:justify-between gap-2 pt-4">
                            <Button 
                              variant="destructive" 
                              className="flex-1" 
                              onClick={() => handleAction(req.id, 'rejected')}
                            >
                              <XCircle className="mr-2 h-4 w-4" /> Reject
                            </Button>
                            <Button 
                              className="flex-1 bg-primary" 
                              onClick={() => handleAction(req.id, 'confirmed')}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" /> Confirm & Notify
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <ExternalLink className="h-4 w-4 mr-1" /> Details
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {requests.length === 0 && (
              <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-headline font-semibold">Queue Clear!</h3>
                <p className="text-muted-foreground">No pending meeting requests to verify.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}