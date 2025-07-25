
'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Camera, Upload, Trash2, SwitchCamera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Card } from './ui/card';

interface ImagePickerProps {
  value: string;
  onChange: (value: string) => void;
  name: string;
}

export function ImagePicker({ value, onChange, name }: ImagePickerProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
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

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/png');
        onChange(dataUrl);
        setIsCameraOpen(false);
      }
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
         <AvatarFallback className="text-2xl">{name.charAt(0) || 'P'}</AvatarFallback>
       </Avatar>
       <div className="flex flex-col gap-2">
         <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Importer
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />
            <Button type="button" variant="outline" onClick={() => setIsCameraOpen(true)}>
                <Camera className="mr-2 h-4 w-4" /> Prendre une photo
            </Button>
            {value && (
                <Button type="button" variant="destructive" size="icon" onClick={removeImage}>
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
           </div>
           <DialogFooter className="flex-row justify-between w-full">
            <Button type="button" variant="outline" onClick={toggleFacingMode}><SwitchCamera className="mr-2 h-4 w-4"/>Changer</Button>
             <div className='flex gap-2'>
                <DialogClose asChild><Button type="button" variant="ghost">Annuler</Button></DialogClose>
                <Button type="button" onClick={takePicture} disabled={!hasCameraPermission}>Capturer</Button>
             </div>
           </DialogFooter>
         </DialogContent>
       </Dialog>
    </Card>
  );
}
