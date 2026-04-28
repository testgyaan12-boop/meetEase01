import { ScheduleMeetingForm } from "@/components/meetings/schedule-form"

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="max-w-2xl mx-auto text-center space-y-2">
        <h2 className="text-3xl font-headline font-bold">New Appointment</h2>
        <p className="text-muted-foreground">Book a professional consultation session with our experts.</p>
      </div>
      <ScheduleMeetingForm />
    </div>
  )
}