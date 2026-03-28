import { ChatInterface } from "@/components/chat/ChatInterface";
import { ZagrebMap } from "@/components/map/ZagrebMap";

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Zagreb Hackathon</h1>
          <p className="text-muted-foreground">Next.js 16 · Supabase · Claude · Mapbox · D3 · Framer Motion</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <ZagrebMap zoom={13} />
          <ChatInterface />
        </div>
      </div>
    </main>
  );
}
