import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to sign out");
      }

      window.location.assign("/login");
    } catch {
      toast.error("Nie udało się wylogować. Spróbuj ponownie.");
      setIsSigningOut(false);
    }
  };

  return (
    <Button
      variant="ghost"
      className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
      onClick={handleSignOut}
      disabled={isSigningOut}
    >
      {isSigningOut ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <LogOut className="size-4" aria-hidden />
      )}
      Wyloguj
    </Button>
  );
}
