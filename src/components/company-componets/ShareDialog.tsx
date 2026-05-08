"use client"

import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Icon } from "@iconify/react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyUrl: string;
  companyName: string;
}

export default function ShareDialog({ open, onOpenChange, companyUrl, companyName }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `Check out ${companyName} - amazing services and great experience!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(companyUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
    onOpenChange(false);
  };

  const shareOptions = [
    {
      name: 'Facebook',
      icon: 'ic:baseline-facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(companyUrl)}&quote=${encodeURIComponent(shareText)}`
    },
    {
      name: 'Telegram',
      icon: 'ic:baseline-telegram',
      url: `https://t.me/share/url?url=${encodeURIComponent(companyUrl)}&text=${encodeURIComponent(shareText)}`
    },
    {
      name: 'X',
      icon: 'prime:twitter',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(companyUrl)}&text=${encodeURIComponent(shareText)}`
    },
    {
      name: 'Instagram',
      icon: 'mdi:instagram',
      url: `https://www.instagram.com/` // Instagram doesn't support direct URL sharing, so we'll copy the text
    },
    {
      name: 'Snapchat',
      icon: 'ic:baseline-snapchat',
      url: `https://www.snapchat.com/` // Snapchat doesn't support direct URL sharing, so we'll copy the text
    },
    {
      name: 'Copy Link',
      icon: 'ic:outline-link',
      action: 'copy'
    }
  ];

  const handleShare = (option: typeof shareOptions[0]) => {
    if (option.action === 'copy' || option.name === 'Instagram' || option.name === 'Snapchat') {
      handleCopyLink();
      if (option.name === 'Instagram') {
        toast.info("Link copied! You can now share it on Instagram");
      } else if (option.name === 'Snapchat') {
        toast.info("Link copied! You can now share it on Snapchat");
      }
    } else {
      window.open(option.url, '_blank', 'width=600,height=400');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2 text-gray-700">
            <Share2 className="h-5 w-5" />
            <span className="font-medium">share</span>
          </div>
          
          {/* Social Media Icons */}
          <div className="flex items-center gap-3 justify-center">
            {shareOptions.map((option) => (
              <button
                key={option.name}
                onClick={() => handleShare(option)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                  option.name === 'Copy Link' 
                    ? 'bg-gray-200 text-gray-700' 
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
                title={option.name}
              >
                <Icon icon={option.icon} className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
