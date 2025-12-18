import { Button } from "@/components/ui/button";
import { Share2, Twitter, Facebook, Linkedin } from "lucide-react";
import { useState } from "react";

interface SocialShareProps {
  title: string;
  url: string;
}

export const SocialShare = ({ title, url }: SocialShareProps) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const shareUrl = encodeURIComponent(url);
  const shareTitle = encodeURIComponent(title);
  
  const socialLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
  };
  
  const handleShare = (platform: string) => {
    window.open(socialLinks[platform as keyof typeof socialLinks], "_blank", "width=600,height=400");
  };
  
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        className="gap-2 hover:scale-105 transition-transform"
      >
        <Share2 className="h-4 w-4" />
        공유하기
      </Button>
      
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute top-full mt-2 right-0 z-50 bg-card border rounded-lg shadow-xl p-2 min-w-[160px] animate-fade-in">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleShare("twitter")}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left w-full"
              >
                <div className="w-8 h-8 rounded-full bg-[#1DA1F2] flex items-center justify-center">
                  <Twitter className="h-4 w-4 text-white" fill="white" />
                </div>
                <span className="text-sm font-medium">Twitter</span>
              </button>
              
              <button
                onClick={() => handleShare("facebook")}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left w-full"
              >
                <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center">
                  <Facebook className="h-4 w-4 text-white" fill="white" />
                </div>
                <span className="text-sm font-medium">Facebook</span>
              </button>
              
              <button
                onClick={() => handleShare("linkedin")}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left w-full"
              >
                <div className="w-8 h-8 rounded-full bg-[#0A66C2] flex items-center justify-center">
                  <Linkedin className="h-4 w-4 text-white" fill="white" />
                </div>
                <span className="text-sm font-medium">LinkedIn</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
