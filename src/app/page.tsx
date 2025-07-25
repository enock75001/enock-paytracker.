
'use client';

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  return (
    <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center container mx-auto p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">PayTracker</CardTitle>
          <CardDescription>
            Veuillez sélectionner votre type de connexion.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <Button asChild className="w-full h-12 text-lg">
            <Link href="/dashboard">Connexion Administrateur</Link>
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                    Ou
                </span>
            </div>
          </div>

          <Button asChild variant="outline" className="w-full h-12 text-lg">
            <Link href="/manager-login">Connexion Responsable</Link>
          </Button>

        </CardContent>
      </Card>
    </div>
  )
}
