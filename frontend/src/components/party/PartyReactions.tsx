import EmojiLayer from "./EmojiLayer";
import { Button } from "@/components/ui/button";

export default function PartyReactions({
  socket,
  partyId,
  bus,
}: {
  socket: any;
  partyId: string;
  bus: EventTarget;
}) {
  const send = (emoji: string) =>
    socket?.emit("party:emoji", { partyId, emoji });

  return (
    <div className="relative h-64 rounded-md border border-zinc-800/60 p-3 overflow-hidden">
      <div className="mb-2 text-sm text-zinc-400">Reactions</div>
      <div className="flex flex-wrap gap-2">
        {["🎧", "🔥", "👏", "💚", "🎵", "🤘", "😂", "😮"].map((e) => (
          <Button key={e} variant="secondary" onClick={() => send(e)}>
            {e}
          </Button>
        ))}
      </div>
      <EmojiLayer bus={bus} />
    </div>
  );
}
