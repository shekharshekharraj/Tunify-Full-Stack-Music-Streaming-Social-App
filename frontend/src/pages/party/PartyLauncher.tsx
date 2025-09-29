import { useState } from "react";
import { axiosInstance } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PartyLauncher() {
  const [code, setCode] = useState("");
  const [created, setCreated] = useState<{ id: string; code: string } | null>(null);

  const createParty = async () => {
    const r = await axiosInstance.post("/party/create");
    setCreated(r.data.party);
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div className="space-y-3">
        <Button onClick={createParty} className="w-full">Start Listen Party</Button>
        {created && (
          <div className="text-sm text-zinc-400">
            Share this code with friends:&nbsp;
            <span className="font-mono text-white">{created.code}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input placeholder="Enter join code" value={code} onChange={(e) => setCode(e.target.value)} />
        <a className="inline-flex items-center justify-center px-4 rounded bg-zinc-800 text-white" href={`/party/${code}`}>
          Join
        </a>
      </div>
    </div>
  );
}
