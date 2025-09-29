import { useEffect, useState } from "react";

export default function EmojiLayer({ bus }: { bus: EventTarget }) {
  const [items, setItems] = useState<{ id: string; emoji: string }[]>([]);

  useEffect(() => {
    const handler = (e: any) => {
      const emoji = e.detail;
      const id = Math.random().toString(36).slice(2, 8);
      setItems((prev) => [...prev, { id, emoji }]);
      setTimeout(() => setItems((p) => p.filter((i) => i.id !== id)), 2000);
    };
    bus.addEventListener("emoji", handler as any);
    return () => bus.removeEventListener("emoji", handler as any);
  }, [bus]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((i) => (
        <div
          key={i.id}
          className="absolute left-[calc(50%-12px)] bottom-8 animate-[floatUp_2s_ease-out_forwards] text-3xl"
        >
          {i.emoji}
        </div>
      ))}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 0.9; }
          100% { transform: translateY(-160px) scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
