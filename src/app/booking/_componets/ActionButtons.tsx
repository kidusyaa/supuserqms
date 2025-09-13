"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ActionButtonsProps {
  onJoinQueue: () => void;
  isJoinQueueDisabled: boolean;
  queueCount: number;
}

export default function ActionButtons({ onJoinQueue, isJoinQueueDisabled, queueCount }: ActionButtonsProps) {
  const router = useRouter();
  return (
    <div className="flex gap-4 pt-6">
      <Button variant="outline" onClick={() => router.back()}>
        Back to Company
      </Button>
      <Button onClick={onJoinQueue} disabled={isJoinQueueDisabled}>
        Join Queue (current: {queueCount})
      </Button>
    </div>
  );
}