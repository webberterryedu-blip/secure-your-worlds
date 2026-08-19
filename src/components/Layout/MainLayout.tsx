import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Navigation/Sidebar";
import { ThemeAndLangToggle } from "@/components/ThemeAndLangToggle";
import VaultUnlockGate from "@/components/VaultUnlockGate";

export default function MainLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          <div className="flex justify-end mb-4">
            <ThemeAndLangToggle />
          </div>
          <VaultUnlockGate>
            <Outlet />
          </VaultUnlockGate>
        </div>
      </main>
    </div>
  );
}
