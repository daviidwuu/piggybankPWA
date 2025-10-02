import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Send, Bot, DollarSign } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 md:px-8 border-b bg-card">
      <div className="flex items-center gap-2">
        <DollarSign className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold font-headline">FinTrack Mini</h1>
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <Send className="mr-2 h-4 w-4" />
            Connect Telegram
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Bot /> Telegram Integration
            </SheetTitle>
            <SheetDescription>
              Connect your Telegram account to receive automated notifications
              and updates directly in your chat.
            </SheetDescription>
          </SheetHeader>
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              This feature is coming soon!
            </p>
            <Button disabled>Link Telegram Bot</Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Once connected, you'll be able to manage your finances right from
            your Telegram app.
          </p>
        </SheetContent>
      </Sheet>
    </header>
  );
}
