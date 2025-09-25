// src/pages/admin/AdminPage.tsx
import { useAuthStore } from "@/stores/useAuthStore";
import Header from "./components/Header";
import DashboardStats from "./components/DashboardStats";
import { Album, Music } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SongsTabContent from "./components/SongsTabContent";
import AlbumsTabContent from "./components/AlbumsTabContent";
import { useEffect, useState } from "react";
import { useMusicStore } from "@/stores/useMusicStore";
import { useUser } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";

const AdminPage = () => {
  const { isAdmin, checkAdminStatus } = useAuthStore();
  const { isLoaded, isSignedIn } = useUser();
  const { fetchAlbums, fetchSongs, fetchStats } = useMusicStore();

  const [probing, setProbing] = useState(true);

  // Re-probe locally on mount to avoid stale store value
  useEffect(() => {
    const run = async () => {
      if (!isLoaded || !isSignedIn) return;
      await checkAdminStatus(); // uses fresh token now
      setProbing(false);
    };
    run();
  }, [isLoaded, isSignedIn, checkAdminStatus]);

  useEffect(() => {
    if (!probing && isAdmin) {
      fetchAlbums();
      fetchSongs();
      fetchStats();
    }
  }, [probing, isAdmin, fetchAlbums, fetchSongs, fetchStats]);

  if (!isLoaded || probing) {
    return (
      <div className='flex h-full min-h-screen items-center justify-center bg-zinc-900'>
        <Loader2 className='h-16 w-16 animate-spin text-emerald-500' />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className='flex h-full min-h-screen items-center justify-center bg-zinc-900 text-white'>
        Unauthorized
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-zinc-100 p-8'>
      <Header />
      <DashboardStats />
      <Tabs defaultValue='songs' className='space-y-6'>
        <TabsList className='p-1 bg-zinc-800/50'>
          <TabsTrigger value='songs' className='data-[state=active]:bg-zinc-700'>
            <Music className='mr-2 size-4' />
            Songs
          </TabsTrigger>
          <TabsTrigger value='albums' className='data-[state=active]:bg-zinc-700'>
            <Album className='mr-2 size-4' />
            Albums
          </TabsTrigger>
        </TabsList>
        <TabsContent value='songs'>
          <SongsTabContent />
        </TabsContent>
        <TabsContent value='albums'>
          <AlbumsTabContent />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
