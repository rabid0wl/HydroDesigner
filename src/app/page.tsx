"use client";

import * as React from "react";
import {
  BrainCircuit,
  Droplets,
  LayoutDashboard,
  Fan,
  Replace,
  Waves,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Dashboard } from "@/components/dashboard";
import { OpenChannelDesign } from "@/components/open-channel-design";
import { CulvertSizing } from "@/components/culvert-sizing";
import { PipeSizing } from "@/components/pipe-sizing";
import { PumpDesign } from "@/components/pump-design";
import { AiDesignAssistant } from "@/components/ai-design-assistant";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type Units = "metric" | "us";
type View =
  | "dashboard"
  | "open-channel"
  | "culvert-sizing"
  | "pipe-sizing"
  | "pump-design"
  | "ai-assistant";

export default function Home() {
  const [activeView, setActiveView] = React.useState<View>("dashboard");
  const [units, setUnits] = React.useState<Units>("us");

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard />;
      case "open-channel":
        return <OpenChannelDesign units={units} />;
      case "culvert-sizing":
        return <CulvertSizing units={units} />;
      case "pipe-sizing":
        return <PipeSizing units={units} />;
      case "pump-design":
        return <PumpDesign units={units} />;
      case "ai-assistant":
        return <AiDesignAssistant />;
      default:
        return <Dashboard />;
    }
  };

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "open-channel", icon: Waves, label: "Open Channel Design" },
    { id: "culvert-sizing", icon: Replace, label: "Culvert Sizing" },
    { id: "pipe-sizing", icon: Droplets, label: "Pipe Sizing" },
    { id: "pump-design", icon: Fan, label: "Pump Design & Sizing" },
    { id: "ai-assistant", icon: BrainCircuit, label: "AI Design Assistant" },
  ];

  return (
    <SidebarProvider>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="size-10 bg-primary/10 text-primary hover:bg-primary/20">
              <Waves className="size-5" />
            </Button>
            <h1 className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              HydroDesign
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => setActiveView(item.id as View)}
                  isActive={activeView === item.id}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="flex md:hidden" />
            <h2 className="text-lg font-semibold sm:text-xl">
              {menuItems.find((item) => item.id === activeView)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="units-toggle" className="text-sm">
              Metric
            </Label>
            <Switch
              id="units-toggle"
              checked={units === "us"}
              onCheckedChange={(checked) => setUnits(checked ? "us" : "metric")}
              aria-label="Toggle units"
            />
            <Label htmlFor="units-toggle" className="text-sm">
              US
            </Label>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">{renderView()}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}