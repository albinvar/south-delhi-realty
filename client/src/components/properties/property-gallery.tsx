import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { PropertyMedia } from "@shared/schema";
import { ChevronLeft, ChevronRight, Film, Image as ImageIcon, Play, X } from "lucide-react";
import { useState } from "react";

type PropertyGalleryProps = {
  media: PropertyMedia[];
};

export default function PropertyGallery({ media }: PropertyGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showAllMedia, setShowAllMedia] = useState(false);

  // If there are no media items, show a placeholder
  if (!media || media.length === 0) {
    return (
      <div className="rounded-lg overflow-hidden bg-gray-200 h-60 sm:h-96 flex items-center justify-center mb-8">
        <div className="text-center">
          <ImageIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-sm sm:text-base">No media available</p>
        </div>
      </div>
    );
  }

  // Separate images and videos
  const images = media.filter(item => item.mediaType === 'image');
  const videos = media.filter(item => item.mediaType === 'video');
  
  // Find the featured image or use the first available
  const featuredMedia = media.find(item => item.isFeatured) || media[0];
  
  // All media for lightbox
  const allMedia = [...images, ...videos];

  const navigateMedia = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentIndex(prev => 
        prev === 0 ? allMedia.length - 1 : prev - 1
      );
    } else {
      setCurrentIndex(prev => 
        prev === allMedia.length - 1 ? 0 : prev + 1
      );
    }
  };

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  // Get display media (limited or all based on toggle)
  const getDisplayMedia = () => {
    if (showAllMedia) {
      return allMedia;
    }
    // Show main featured + up to 8 thumbnails
    const otherMedia = allMedia.filter(item => item.id !== featuredMedia.id);
    return [featuredMedia, ...otherMedia.slice(0, 8)];
  };

  const displayMedia = getDisplayMedia();
  const remainingCount = allMedia.length - 9;

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <h2 className="text-lg sm:text-xl font-semibold">Property Gallery</h2>
          <div className="flex gap-2">
            {images.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs sm:text-sm">
                <ImageIcon className="h-3 w-3" />
                {images.length} Photo{images.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {videos.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs sm:text-sm">
                <Film className="h-3 w-3" />
                {videos.length} Video{videos.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
        {allMedia.length > 9 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAllMedia(!showAllMedia)}
            className="text-xs sm:text-sm"
          >
            {showAllMedia ? 'Show Less' : `View All ${allMedia.length} Media`}
          </Button>
        )}
      </div>

      {/* Responsive Gallery Layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-5 gap-4 mb-6">
        {/* Main Media Viewer - Full width on mobile, 3 columns on desktop */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogTrigger asChild>
            <div 
              className="lg:col-span-3 rounded-lg overflow-hidden cursor-pointer relative group bg-gray-100 h-64 sm:h-80 lg:h-[400px]"
              onClick={() => openLightbox(allMedia.findIndex(item => item.id === featuredMedia.id))}
            >
              {featuredMedia.mediaType === 'image' ? (
                <img 
                  src={featuredMedia.cloudinaryUrl} 
                  alt="Featured Property" 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="relative w-full h-full bg-black">
                  <video 
                    src={featuredMedia.cloudinaryUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                    <div className="bg-white/90 rounded-full p-2 sm:p-3 shadow-lg">
                      <Play className="h-6 w-6 sm:h-8 sm:w-8 text-black" />
                    </div>
                  </div>
                </div>
              )}
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                <Badge className="bg-black/70 text-white text-xs sm:text-sm">
                  {featuredMedia.mediaType === 'image' ? 'Featured' : 'Video Tour'}
                </Badge>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          </DialogTrigger>

          {/* Lightbox Content - Mobile Responsive */}
          <DialogContent className="max-w-[95vw] sm:max-w-5xl w-full bg-black/95 border-none p-2 sm:p-4">
            <VisuallyHidden>
              <DialogTitle>Property Media Gallery</DialogTitle>
              <DialogDescription>
                View and navigate through property images and videos. Use the arrow buttons to move between media items.
              </DialogDescription>
            </VisuallyHidden>
            <div className="relative w-full h-[60vh] sm:h-[70vh]">
              <div className="w-full h-full flex items-center justify-center bg-black/50 rounded-lg overflow-hidden">
                {allMedia[currentIndex]?.mediaType === 'image' ? (
                  <img 
                    src={allMedia[currentIndex]?.cloudinaryUrl} 
                    alt="Property" 
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <video 
                    src={allMedia[currentIndex]?.cloudinaryUrl}
                    controls
                    autoPlay
                    className="max-h-full max-w-full object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
              
              {/* Navigation Controls - Responsive */}
              {allMedia.length > 1 && (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 sm:h-10 sm:w-10"
                    onClick={() => navigateMedia('prev')}
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 sm:h-10 sm:w-10"
                    onClick={() => navigateMedia('next')}
                  >
                    <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
                  </Button>
                </>
              )}
              
              {/* Close Button - Responsive */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 sm:right-4 top-2 sm:top-4 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 sm:h-10 sm:w-10"
                onClick={() => setLightboxOpen(false)}
              >
                <X className="h-4 w-4 sm:h-6 sm:w-6" />
              </Button>
              
              {/* Media Counter and Info - Responsive */}
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full">
                <div className="flex items-center gap-2">
                  {allMedia[currentIndex]?.mediaType === 'video' && <Film className="h-3 w-3 sm:h-4 sm:w-4" />}
                  <span className="text-xs sm:text-sm">{currentIndex + 1} / {allMedia.length}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Thumbnail Grid - Full width on mobile, 2 columns on desktop */}
        <div className="lg:col-span-2 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-2">
          {displayMedia.slice(1, 9).map((item, index) => (
            <div 
              key={item.id} 
              className="rounded-lg overflow-hidden cursor-pointer relative group bg-gray-100 h-16 sm:h-20 lg:h-[95px]"
              onClick={() => openLightbox(allMedia.findIndex(media => media.id === item.id))}
            >
              {item.mediaType === 'image' ? (
                <img 
                  src={item.cloudinaryUrl} 
                  alt={`Property ${index + 2}`} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="relative w-full h-full bg-black">
                  <video 
                    src={item.cloudinaryUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-1 sm:p-1.5">
                      <Play className="h-2 w-2 sm:h-3 sm:w-3 text-black" />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Overlay for "+X more" on last thumbnail when not showing all */}
              {!showAllMedia && index === 6 && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-semibold text-xs sm:text-sm">+{remainingCount} more</span>
                </div>
              )}
              
              {/* Media type indicator - Responsive */}
              {item.mediaType === 'video' && (
                <div className="absolute top-1 right-1">
                  <Badge variant="secondary" className="text-xs py-0 px-1 hidden sm:flex">
                    <Film className="h-2 w-2 mr-1" />
                    Video
                  </Badge>
                  <div className="sm:hidden bg-black/60 rounded-full p-1">
                    <Film className="h-2 w-2 text-white" />
                  </div>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          ))}
          
          {/* Show remaining thumbnails if showing all media */}
          {showAllMedia && displayMedia.slice(9).map((item, index) => (
            <div 
              key={item.id} 
              className="rounded-lg overflow-hidden cursor-pointer relative group bg-gray-100 h-16 sm:h-20 lg:h-[95px]"
              onClick={() => openLightbox(allMedia.findIndex(media => media.id === item.id))}
            >
              {item.mediaType === 'image' ? (
                <img 
                  src={item.cloudinaryUrl} 
                  alt={`Property ${index + 10}`} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="relative w-full h-full bg-black">
                  <video 
                    src={item.cloudinaryUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-1 sm:p-1.5">
                      <Play className="h-2 w-2 sm:h-3 sm:w-3 text-black" />
                    </div>
                  </div>
                </div>
              )}
              
              {item.mediaType === 'video' && (
                <div className="absolute top-1 right-1">
                  <Badge variant="secondary" className="text-xs py-0 px-1 hidden sm:flex">
                    <Film className="h-2 w-2 mr-1" />
                    Video
                  </Badge>
                  <div className="sm:hidden bg-black/60 rounded-full p-1">
                    <Film className="h-2 w-2 text-white" />
                  </div>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* Media Summary - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm text-muted-foreground gap-2">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <span>Total: {allMedia.length} media files</span>
          {images.length > 0 && <span>• {images.length} images</span>}
          {videos.length > 0 && <span>• {videos.length} videos</span>}
        </div>
        <span className="hidden sm:block">All media watermarked with SOUTH DELHI REALTY</span>
      </div>
    </div>
  );
}
