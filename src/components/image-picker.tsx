
'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Camera, Upload, Trash2, SwitchCamera, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Card } from './ui/card';

interface ImagePickerProps {
  value: string;
  onChange: (value: string) => void;
  name: string;
  disabled?: boolean;
}

const MAX_IMAGE_DIMENSION = 800; // max width/height
const IMAGE_QUALITY = 0.8; // 80% quality

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > MAX_IMAGE_DIMENSION) {
            height *= MAX_IMAGE_DIMENSION / width;
            width = MAX_IMAGE_DIMENSION;
          }
        } else {
          if (height > MAX_IMAGE_DIMENSION) {
            width *= MAX_IMAGE_DIMENSION / height;
            height = MAX_IMAGE_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', IMAGE_QUALITY));
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImagePicker({ value, onChange, name, disabled = false }: ImagePickerProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    let stream: MediaStream;
    const getCameraPermission = async () => {
      if (isCameraOpen) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Accès à la caméra refusé',
            description: 'Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.',
          });
        }
      }
    };

    getCameraPermission();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOpen, facingMode, toast]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      try {
        const compressedDataUrl = await compressImage(file);
        onChange(compressedDataUrl);
      } catch (error) {
        toast({
            variant: 'destructive',
            title: "Erreur de Traitement",
            description: "Impossible de traiter l'image sélectionnée.",
        });
        console.error("Image processing error:", error);
      } finally {
        setIsProcessing(false);
        // Reset file input to allow selecting the same file again
        if(fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
        setIsProcessing(true);
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // --- Compression logic ---
        let { videoWidth: width, videoHeight: height } = video;
        if (width > height) {
          if (width > MAX_IMAGE_DIMENSION) {
            height *= MAX_IMAGE_DIMENSION / width;
            width = MAX_IMAGE_DIMENSION;
          }
        } else {
          if (height > MAX_IMAGE_DIMENSION) {
            width *= MAX_IMAGE_DIMENSION / height;
            height = MAX_IMAGE_DIMENSION;
          }
        }
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
            onChange(dataUrl);
            setIsCameraOpen(false);
        }
        setIsProcessing(false);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const removeImage = () => {
    onChange('');
  }

  return (
    <Card className="p-4 flex items-center gap-4">
       <Avatar className="h-20 w-20">
         <AvatarImage src={value || undefined} data-ai-hint="person photo"/>
         <AvatarFallback className="text-2xl">{name?.charAt(0) || 'P'}</AvatarFallback>
       </Avatar>
       <div className="flex flex-col gap-2">
         <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={disabled || isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Importer
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={disabled}
            />
            <Button type="button" variant="outline" onClick={() => setIsCameraOpen(true)} disabled={disabled || isProcessing}>
                <Camera className="mr-2 h-4 w-4" /> Caméra
            </Button>
            {value && (
                <Button type="button" variant="destructive" size="icon" onClick={removeImage} disabled={disabled || isProcessing}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
         </div>
         <p className="text-xs text-muted-foreground">Téléchargez une photo ou utilisez votre caméra.</p>
       </div>
       <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle>Prendre une photo</DialogTitle>
           </DialogHeader>
           <div className="relative">
             <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline/>
             <canvas ref={canvasRef} className="hidden" />
             {hasCameraPermission === false && (
               <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                 <Alert variant="destructive" className="w-auto">
                   <AlertTitle>Caméra non accessible</AlertTitle>
                   <AlertDescription>Vérifiez les permissions.</AlertDescription>
                 </Alert>
               </div>
             )}
             {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-md">
                   <Loader2 className="h-8 w-8 animate-spin text-white" />
                 </div>
             )}
           </div>
           <DialogFooter className="flex-row justify-between w-full">
            <Button type="button" variant="outline" onClick={toggleFacingMode} disabled={isProcessing}><SwitchCamera className="mr-2 h-4 w-4"/>Changer</Button>
             <div className='flex gap-2'>
                <DialogClose asChild><Button type="button" variant="ghost">Annuler</Button></DialogClose>
                <Button type="button" onClick={takePicture} disabled={!hasCameraPermission || isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Capturer
                </Button>
             </div>
           </DialogFooter>
         </DialogContent>
       </Dialog>
    </Card>
  );
}

    