"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Link as LinkIcon, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

const MOCK_MEETINGS = [
  {
    id: "1",
    name: "Strategy Session",
    date: "Dec 24, 2024",
    time: "10:00 AM",
    status: "confirmed",
    link: "https://meet.google.com/abc-defg-hij"
  },
  {
    id: "2",
    name: "Product Review",
    date: "Dec 28, 2024",
    time: "02:30 PM",
    status: "pending",
  },
  {
    id: "3",
    name: "Budget Planning",
    date: "Dec 15, 2024",
    time: "09:00 AM",
    status: "rejected",
  }
]

export default function HistoryPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-headline font-bold">Meeting History</h2>
          <p className="text-muted-foreground">Manage your upcoming and past appointments.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {MOCK_MEETINGS.map((meeting) => (
          <Card key={meeting.id} className="overflow-hidden bg-white/50 backdrop-blur-sm border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-4">
                <div className="flex gap-4 items-center">
                  <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{meeting.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {meeting.date}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {meeting.time}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <Badge 
                    variant={meeting.status === 'confirmed' ? 'default' : meeting.status === 'pending' ? 'secondary' : 'destructive'}
                    className="capitalize px-3 py-1"
                  >
                    {meeting.status}
                  </Badge>
                  
                  {meeting.status === 'confirmed' && meeting.link && (
                    <Button variant="outline" size="sm" className="gap-2 border-primary text-primary hover:bg-primary/5">
                      <LinkIcon className="h-3 w-3" /> Join Meeting
                    </Button>
                  )}
                  
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {MOCK_MEETINGS.length === 0 && (
        <div className="text-center py-20 bg-white/30 rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">No meetings found. Schedule your first one!</p>
        </div>
      )}
    </div>
  )
}