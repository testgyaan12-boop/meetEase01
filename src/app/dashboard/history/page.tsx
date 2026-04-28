"use client"

import { useMemoFirebase, useFirestore, useUser, useCollection } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Link as LinkIcon, MoreHorizontal, Loader2, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

export default function HistoryPage() {
  const { user, isUserLoading } = useUser()
  const firestore = useFirestore()

  const meetingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null
    return query(
      collection(firestore, "meetings"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
  }, [firestore, user])

  const { data: meetings, isLoading: isMeetingsLoading } = useCollection(meetingsQuery)

  if (isUserLoading || isMeetingsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 w-48 mb-6"><Skeleton className="h-full w-full" /></div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-none shadow-sm h-24">
            <CardContent className="p-6 flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-headline font-bold text-primary">Meeting History</h2>
        <p className="text-muted-foreground">Manage your upcoming and past appointments.</p>
      </div>

      <div className="grid gap-4">
        {meetings?.map((meeting) => (
          <Card key={meeting.id} className="overflow-hidden bg-white/70 backdrop-blur-sm border-none shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-4">
                <div className="flex gap-4 items-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{meeting.clientName}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="h-3.5 w-3.5" /> 
                        {format(new Date(meeting.createdAt), "MMM do, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <Badge 
                    variant={
                      meeting.status === 'confirmed' ? 'default' : 
                      meeting.status === 'pending' ? 'secondary' : 'destructive'
                    }
                    className="capitalize px-4 py-1.5 font-bold"
                  >
                    {meeting.status}
                  </Badge>
                  
                  {meeting.status === 'confirmed' && meeting.meetingLink && (
                    <Button variant="outline" size="sm" className="gap-2 border-primary text-primary hover:bg-primary/10 font-bold" asChild>
                      <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                        <LinkIcon className="h-3.5 w-3.5" /> Join
                      </a>
                    </Button>
                  )}
                  
                  <Button variant="ghost" size="icon" className="hover:bg-primary/5">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!meetings || meetings.length === 0) && (
        <div className="text-center py-20 bg-white/40 rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center">
          <Inbox className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-headline font-bold text-muted-foreground">No meetings yet</h3>
          <p className="text-muted-foreground mb-6">Schedule your first professional session today.</p>
          <Button onClick={() => window.location.href = '/dashboard'} className="bg-primary">Schedule Now</Button>
        </div>
      )}
    </div>
  )
}
