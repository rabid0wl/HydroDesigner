"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrainCircuit, Droplets, Tunnel, Turbine, Waves } from "lucide-react";
import Image from "next/image";

const tools = [
  { name: "Open Channel Design", icon: Waves, description: "Design and analyze open channels for various flow conditions." },
  { name: "Culvert Sizing", icon: Tunnel, description: "Determine the optimal size for culverts based on hydraulic parameters." },
  { name: "Pipe Sizing", icon: Droplets, description: "Calculate appropriate pipe diameters for fluid transport systems." },
  { name: "Pump Design & Sizing", icon: Turbine, description: "Select and design pumps for your specific system requirements." },
  { name: "AI Design Assistant", icon: BrainCircuit, description: "Get AI-powered recommendations to optimize your designs." },
];

export function Dashboard() {
  return (
    <div className="flex flex-col gap-8">
      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-8 flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to the HydroDesign Toolkit</h1>
            <p className="text-muted-foreground mb-6">Your all-in-one solution for hydraulic and infrastructure design. Streamline your calculations, optimize your designs, and leverage AI for smarter engineering solutions.</p>
          </div>
          <div className="relative h-48 md:h-full w-full">
             <Image src="https://placehold.co/600x400.png" alt="Engineering blueprint" layout="fill" objectFit="cover" data-ai-hint="engineering blueprint" />
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Our Tools</h2>
        <p className="text-muted-foreground">
          Explore our suite of powerful, interactive tools designed for civil engineers.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Card key={tool.name} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center gap-4 pb-4">
              <div className="bg-primary/10 text-primary p-3 rounded-lg">
                <tool.icon className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg">{tool.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{tool.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
