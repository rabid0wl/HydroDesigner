"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';
import type { ChannelShape } from '@/lib/hydraulics/open-channel';
import type { CulvertMaterial } from '@/lib/hydraulics/culvert-types';

// Define the shape of a single point on the rating curve
export interface RatingCurvePoint {
  flow: number;
  depth: number;
}

// Define input state interfaces for each module
export interface OpenChannelInputs {
  flowRate: string;
  channelSlope: string;
  manningN: string;
  customManningN: string;
  channelShape: ChannelShape;
  bottomWidth: string;
  sideSlope: string;
  diameter: string;
}

export interface CulvertInputs {
  designFlow: string;
  maxHeadwater: string;
  culvertLength: string;
  culvertMaterial: CulvertMaterial;
  upstreamInvert: string;
  downstreamInvert: string;
  showAdvanced: boolean;
  entranceType: 'projecting' | 'headwall' | 'wingwall';
  skewAngle: string;
  blockageFactor: string;
  minCoverDepth: string;
  multipleCulverts: string;
  returnPeriod: string;
  aquaticPassage: boolean;
  fishVelocityLimit: string;
  fishDepthMin: string;
  debrisLoad: 'low' | 'medium' | 'high';
}

export interface PipeSizingInputs {
  flowRate: string;
  pipeLength: string;
  elevationChange: string;
  systemType: 'gravity' | 'pressure' | 'pumped';
  preferredMaterials: string[];
  safetyFactor: string;
  maxHeadLoss: string;
  minVelocity: string;
  maxVelocity: string;
  installationMethod: 'trench' | 'trenchless' | 'directional';
  projectLife: string;
  discountRate: string;
  temperature: string;
  corrosiveEnvironment: boolean;
}

export interface PumpDesignInputs {
  designFlow: string;
  totalHead: string;
  fluidType: string;
  fluidTemp: string;
}

// Define the shape of the context data
interface ProjectDataContextType {
  // Shared data
  channelRatingCurve: RatingCurvePoint[] | null;
  setChannelRatingCurve: (curve: RatingCurvePoint[] | null) => void;
  
  // Open Channel Design inputs
  openChannelInputs: OpenChannelInputs;
  setOpenChannelInputs: (inputs: Partial<OpenChannelInputs>) => void;
  
  // Culvert Sizing inputs
  culvertInputs: CulvertInputs;
  setCulvertInputs: (inputs: Partial<CulvertInputs>) => void;
  
  // Pipe Sizing inputs
  pipeSizingInputs: PipeSizingInputs;
  setPipeSizingInputs: (inputs: Partial<PipeSizingInputs>) => void;
  
  // Pump Design inputs
  pumpDesignInputs: PumpDesignInputs;
  setPumpDesignInputs: (inputs: Partial<PumpDesignInputs>) => void;
}

// Create the context with a default undefined value
const ProjectDataContext = createContext<ProjectDataContextType | undefined>(undefined);

/**
 * Provider component that wraps the application and makes project data available
 * to any child component that calls `useProjectData()`.
 */
export const ProjectDataProvider = ({ children }: { children: ReactNode }) => {
  const [channelRatingCurve, setChannelRatingCurve] = useState<RatingCurvePoint[] | null>(null);
  
  // Open Channel Design inputs
  const [openChannelInputs, setOpenChannelInputsState] = useState<OpenChannelInputs>({
    flowRate: "",
    channelSlope: "",
    manningN: "0.013",
    customManningN: "",
    channelShape: "rectangular",
    bottomWidth: "",
    sideSlope: "",
    diameter: "",
  });
  
  // Culvert Sizing inputs
  const [culvertInputs, setCulvertInputsState] = useState<CulvertInputs>({
    designFlow: "",
    maxHeadwater: "",
    culvertLength: "",
    culvertMaterial: "concrete",
    upstreamInvert: "",
    downstreamInvert: "",
    showAdvanced: false,
    entranceType: "headwall",
    skewAngle: "0",
    blockageFactor: "0.1",
    minCoverDepth: "2.0",
    multipleCulverts: "1",
    returnPeriod: "100",
    aquaticPassage: false,
    fishVelocityLimit: "4",
    fishDepthMin: "0.8",
    debrisLoad: "medium",
  });
  
  // Pipe Sizing inputs
  const [pipeSizingInputs, setPipeSizingInputsState] = useState<PipeSizingInputs>({
    flowRate: "",
    pipeLength: "",
    elevationChange: "",
    systemType: "pressure",
    preferredMaterials: ["pvc"],
    safetyFactor: "1.2",
    maxHeadLoss: "",
    minVelocity: "",
    maxVelocity: "",
    installationMethod: "trench",
    projectLife: "50",
    discountRate: "5",
    temperature: "68",
    corrosiveEnvironment: false,
  });
  
  // Pump Design inputs
  const [pumpDesignInputs, setPumpDesignInputsState] = useState<PumpDesignInputs>({
    designFlow: "",
    totalHead: "",
    fluidType: "",
    fluidTemp: "",
  });

  // Helper functions to update inputs partially
  const setOpenChannelInputs = (updates: Partial<OpenChannelInputs>) => {
    setOpenChannelInputsState(prev => ({ ...prev, ...updates }));
  };

  const setCulvertInputs = (updates: Partial<CulvertInputs>) => {
    setCulvertInputsState(prev => ({ ...prev, ...updates }));
  };

  const setPipeSizingInputs = (updates: Partial<PipeSizingInputs>) => {
    setPipeSizingInputsState(prev => ({ ...prev, ...updates }));
  };

  const setPumpDesignInputs = (updates: Partial<PumpDesignInputs>) => {
    setPumpDesignInputsState(prev => ({ ...prev, ...updates }));
  };

  const value = {
    channelRatingCurve,
    setChannelRatingCurve,
    openChannelInputs,
    setOpenChannelInputs,
    culvertInputs,
    setCulvertInputs,
    pipeSizingInputs,
    setPipeSizingInputs,
    pumpDesignInputs,
    setPumpDesignInputs,
  };

  return (
    <ProjectDataContext.Provider value={value}>
      {children}
    </ProjectDataContext.Provider>
  );
};

/**
 * Custom hook to use the ProjectDataContext.
 * This provides a convenient way to access shared project data.
 * @returns The project data context.
 * @throws Will throw an error if used outside of a ProjectDataProvider.
 */
export const useProjectData = () => {
  const context = useContext(ProjectDataContext);
  if (context === undefined) {
    throw new Error('useProjectData must be used within a ProjectDataProvider');
  }
  return context;
};
