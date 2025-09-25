import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/stores/useChatStore";
import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

const MessageInput = () => {
  const [newMessage, setNewMessage] = useState("");
  const { selectedUser, sendMessage } = useChatStore();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error("Please select a user to send a message to.");
      return;
    }
    if (!newMessage.trim()) return;

    sendMessage(selectedUser._id, newMessage.trim()); // receiver's MongoDB _id
    setNewMessage("");
  };

  return (
    <form onSubmit={handleSend} className='p-4 mt-auto border-t border-zinc-800'>
      <div className='flex gap-2'>
        <Input
          placeholder='Type a message'
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className='bg-zinc-800 border-none'
        />
        <Button size={"icon"} type='submit' disabled={!newMessage.trim() || !selectedUser}>
          <Send className='size-4' />
        </Button>
      </div>
    </form>
  );
};
export default MessageInput;
