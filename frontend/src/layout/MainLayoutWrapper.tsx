// src/layout/MainLayoutWrapper.tsx
import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useChatStore } from "@/stores/useChatStore";

const MainLayoutWrapper = () => {
  const { user } = useUser();
  const { fetchUsers, initSocket } = useChatStore();

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      await fetchUsers(user.id); // Clerk ID
      initSocket(user.id);       // server expects Clerk ID
    })();
  }, [user?.id, fetchUsers, initSocket]);

  return null;
};

export default MainLayoutWrapper;
