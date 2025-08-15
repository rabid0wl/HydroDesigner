import {
  PipeSizingInputs,
  PipeSizingResults,
  PipeSizingResult,
  PipeSize,
  CalculationMethod,
  CalculationResult,
  EconomicResults,
  ValidationError
} from './types';
import { calculateHydraulics } from './calculations';
import { 
  getAllAvailableSizes, 
  getMaterialProperties, 
  isCommonSize,
  getSizeAvailability 
} from './standard-sizes';

export class PipeSizingCalculator {
  private cache: Map<string, PipeSizingResult> = new Map();
  private calculationStartTime: number = 0;
  private cacheHits: number = 0;

  constructor(
    private inputs: PipeSizingInputs,
    private calculationMethod: CalculationMethod = CalculationMethod.HAZEN_WILLIAMS
  ) {
    this.validateInputs();
  }

  /**
   * Main method to calculate pipe sizing recommendations
   * @returns Comprehensive pipe sizing results
   */
  public calculateRecommendations(): CalculationResult<PipeSizingResults> {
    this.calculationStartTime = performance.now();
    this.cache.clear();
    this.cacheHits = 0;

    try {
      // Get available pipe sizes based on material preferences
      const availableSizes = this.getFilteredPipeSizes();
      
      if (availableSizes.length === 0) {
        return {
          success: false,
          errors: [{
            field: 'materials',
            message: 'No pipe sizes available for selected materials',
            severity: 'error'
          }]
        };
      }

      // Evaluate each pipe size
      const evaluatedResults: PipeSizingResult[] = [];
      const warnings: string[] = [];

      for (const pipeSize of availableSizes) {
        try {
          const result = this.evaluatePipeSize(pipeSize);
          if (result.success && result.data) {
            evaluatedResults.push(result.data);
          } else if (result.warnings) {
            warnings.push(...result.warnings);
          }
        } catch (error) {
          // Log error but continue with other sizes
          console.warn(`Failed to evaluate pipe size ${pipeSize.nominalDiameter}" ${pipeSize.material}:`, error);
        }
      }

      if (evaluatedResults.length === 0) {
        return {
          success: false,
          errors: [{
            field: 'calculation',
            message: 'No viable pipe sizes found for the given parameters',
            severity: 'error'
          }],
          warnings: warnings.length > 0 ? warnings : undefined
        };
      }

      // Sort results by suitability score (descending)
      evaluatedResults.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

      // Filter viable options (meet design criteria)
      const viableOptions = evaluatedResults.filter(result => result.meetsDesignCriteria);
      
      // If no options meet criteria, relax constraints and include best alternatives
      const finalRecommendations = viableOptions.length > 0 ? viableOptions : evaluatedResults.slice(0, 5);

      // Select best option
      const bestOption = finalRecommendations[0];

      // Prepare alternative options
      const alternativeOptions = finalRecommendations.slice(1, Math.min(6, finalRecommendations.length));

      // Calculate summary statistics
      const costs = finalRecommendations.map(r => r.economics.totalCapitalCost);
      const velocities = finalRecommendations.map(r => r.hydraulics.velocity);

      const results: PipeSizingResults = {
        recommendations: finalRecommendations,
        bestOption,
        alternativeOptions,
        summary: {
          totalOptions: evaluatedResults.length,
          viableOptions: viableOptions.length,
          costRange: {
            min: Math.min(...costs),
            max: Math.max(...costs)
          },
          velocityRange: {
            min: Math.min(...velocities),
            max: Math.max(...velocities)
          }
        },
        calculations: {
          timestamp: new Date().toISOString(),
          calculationTime: performance.now() - this.calculationStartTime,
          cacheHits: this.cacheHits
        }
      };

      return {
        success: true,
        data: results,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'calculation',
          message: error instanceof Error ? error.message : 'Unknown calculation error',
          severity: 'error'
        }]
      };
    }
  }

  /**
   * Evaluate a single pipe size
   * @param pipeSize Pipe size to evaluate
   * @returns Evaluation result
   */
  private evaluatePipeSize(pipeSize: PipeSize): CalculationResult<PipeSizingResult> {
    // Check cache first
    const cacheKey = this.generateCacheKey(pipeSize);
    if (this.cache.has(cacheKey)) {
      this.cacheHits++;
      return {
        success: true,
        data: this.cache.get(cacheKey)!
      };
    }

    try {
      // Calculate hydraulics
      const hydraulicResult = calculateHydraulics(this.inputs, pipeSize, this.calculationMethod);
      
      if (!hydraulicResult.success || !hydraulicResult.data) {
        return {
          success: false,
          errors: hydraulicResult.errors,
          warnings: hydraulicResult.warnings
        };
      }

      const hydraulics = hydraulicResult.data;

      // Calculate economics
      const economics = this.calculateEconomics(pipeSize, hydraulics);

      // Evaluate design criteria compliance
      const meetsDesignCriteria = this.evaluateDesignCriteria(pipeSize, hydraulics);

      // Calculate suitability score
      const suitabilityScore = this.calculateSuitabilityScore(pipeSize, hydraulics, economics);

      // Generate specific warnings for this pipe size
      const warnings = this.generatePipeSpecificWarnings(pipeSize, hydraulics, economics);
      
      // Combine with hydraulic warnings
      const allWarnings = [
        ...(hydraulicResult.warnings || []),
        ...warnings
      ];

      const result: PipeSizingResult = {
        pipeSize,
        hydraulics,
        economics,
        warnings: allWarnings,
        suitabilityScore,
        meetsDesignCriteria,
        headLossRatio: this.calculateHeadLossRatio(hydraulics),
        velocityRatio: this.calculateVelocityRatio(pipeSize, hydraulics),
        capacityFactor: this.calculateCapacityFactor(pipeSize, hydraulics)
      };

      // Cache the result
      this.cache.set(cacheKey, result);

      return {
        success: true,
        data: result
      };

    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'evaluation',
          message: error instanceof Error ? error.message : 'Evaluation failed',
          severity: 'error'
        }]
      };
    }
  }

  /**
   * Calculate economic analysis for pipe size
   * @param pipeSize Pipe size
   * @param hydraulics Hydraulic results
   * @returns Economic results
   */
  private calculateEconomics(pipeSize: PipeSize, hydraulics: any): EconomicResults {
    const materialProps = getMaterialProperties(pipeSize.material);
    
    // Material cost calculation
    const pipeVolume = pipeSize.area * this.inputs.pipeLength;
    const materialCostPerUnit = this.getMaterialCostPerUnit(pipeSize.material);
    const materialCost = pipeVolume * materialCostPerUnit * materialProps.costFactor;

    // Installation cost (varies by size and method)
    const installationCostPerUnit = this.getInstallationCostPerUnit(pipeSize);
    const installationCost = this.inputs.pipeLength * installationCostPerUnit;

    // Excavation cost
    const excavationVolume = this.calculateExcavationVolume(pipeSize);
    const excavationCostPerUnit = this.inputs.units === 'metric' ? 25 : 15; // $/m³ or $/yd³
    const excavationCost = excavationVolume * excavationCostPerUnit;

    // Fittings cost (estimated as percentage of material cost)
    const fittingsCostFactor = this.calculateFittingsCostFactor();
    const fittingsCost = materialCost * fittingsCostFactor;

    // Total capital cost
    const totalCapitalCost = materialCost + installationCost + excavationCost + fittingsCost;

    // Annual energy cost (for pumped systems)
    const annualEnergyCost = this.calculateAnnualEnergyCost(hydraulics);

    // Life cycle cost (NPV)
    const annualOMCost = totalCapitalCost * 0.02; // 2% of capital cost
    const lifeCycleCost = this.calculateNPV(
      totalCapitalCost,
      annualOMCost + (annualEnergyCost || 0),
      this.inputs.projectLife,
      this.inputs.discountRate
    );

    return {
      materialCost,
      installationCost,
      excavationCost,
      fittingsCost,
      totalCapitalCost,
      annualEnergyCost,
      lifeCycleCost,
      maintenanceCost: annualOMCost
    };
  }

  /**
   * Evaluate if pipe size meets design criteria
   * @param pipeSize Pipe size
   * @param hydraulics Hydraulic results
   * @returns True if meets all design criteria
   */
  private evaluateDesignCriteria(pipeSize: PipeSize, hydraulics: any): boolean {
    const materialProps = getMaterialProperties(pipeSize.material);
    
    // Velocity criteria
    const minVel = this.inputs.minVelocity || materialProps.minVelocity;
    const maxVel = this.inputs.maxVelocity || materialProps.maxVelocity;
    
    if (hydraulics.velocity < minVel || hydraulics.velocity > maxVel) {
      return false;
    }

    // Head loss criteria
    if (this.inputs.maxHeadLoss && hydraulics.headLoss > this.inputs.maxHeadLoss) {
      return false;
    }

    // Pressure criteria
    const maxPressure = materialProps.maxPressure * 0.8; // 80% of rating
    if (hydraulics.pressureDrop > maxPressure) {
      return false;
    }

    // Safety factor check
    const actualSafety = this.calculateActualSafetyFactor(pipeSize, hydraulics);
    if (actualSafety < this.inputs.safetyFactor) {
      return false;
    }

    return true;
  }

  /**
   * Calculate suitability score (0-100)
   * @param pipeSize Pipe size
   * @param hydraulics Hydraulic results
   * @param economics Economic results
   * @returns Suitability score
   */
  private calculateSuitabilityScore(pipeSize: PipeSize, hydraulics: any, economics: EconomicResults): number {
    let score = 0;
    const materialProps = getMaterialProperties(pipeSize.material);

    // Velocity score (30% weight) - optimal velocity around 4-6 ft/s
    const optimalVelocity = this.inputs.units === 'metric' ? 1.5 : 5.0;
    const velocityScore = Math.max(0, 100 - Math.abs(hydraulics.velocity - optimalVelocity) * 10);
    score += velocityScore * 0.3;

    // Head loss score (25% weight) - lower is better
    const maxReasonableHeadLoss = this.inputs.units === 'metric' ? 5 : 15;
    const headLossScore = Math.max(0, 100 - (hydraulics.headLoss / maxReasonableHeadLoss) * 100);
    score += headLossScore * 0.25;

    // Cost score (20% weight) - based on life cycle cost
    const avgLifeCycleCost = economics.lifeCycleCost;
    const costScore = Math.max(0, 100 - Math.min(50, (avgLifeCycleCost / 100000) * 50));
    score += costScore * 0.2;

    // Availability score (15% weight) - common sizes get higher scores
    const availabilityScore = isCommonSize(pipeSize.nominalDiameter, pipeSize.material) ? 100 : 70;
    score += availabilityScore * 0.15;

    // Material suitability score (10% weight)
    const materialScore = this.getMaterialSuitabilityScore(pipeSize.material);
    score += materialScore * 0.1;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Get filtered pipe sizes based on input preferences
   * @returns Array of pipe sizes to evaluate
   */
  private getFilteredPipeSizes(): PipeSize[] {
    const materials = this.inputs.preferredMaterials.filter(
      material => !this.inputs.excludedMaterials?.includes(material)
    );

    const allSizes = getAllAvailableSizes(materials);
    
    // Filter by reasonable size range based on flow rate
    const minSize = this.estimateMinimumPipeSize();
    const maxSize = this.estimateMaximumPipeSize();

    return allSizes.filter(size => 
      size.nominalDiameter >= minSize && 
      size.nominalDiameter <= maxSize
    );
  }

  /**
   * Estimate minimum pipe size based on flow rate and maximum velocity
   * @returns Minimum nominal diameter in inches
   */
  private estimateMinimumPipeSize(): number {
    const maxVelocity = this.inputs.units === 'metric' ? 3.0 : 10.0; // Conservative maximum
    const flowCfs = this.inputs.units === 'metric' ? 
      this.inputs.designFlow / 28.317 : // L/s to cfs
      this.inputs.designFlow / 448.831;  // gpm to cfs
    
    const minArea = flowCfs / maxVelocity;
    const minDiameter = Math.sqrt(4 * minArea / Math.PI);
    const minNominalInches = minDiameter * (this.inputs.units === 'metric' ? 39.37 : 12);
    
    return Math.max(4, Math.floor(minNominalInches));
  }

  /**
   * Estimate maximum pipe size based on flow rate and minimum velocity
   * @returns Maximum nominal diameter in inches
   */
  private estimateMaximumPipeSize(): number {
    const minVelocity = this.inputs.units === 'metric' ? 0.6 : 2.0; // Conservative minimum
    const flowCfs = this.inputs.units === 'metric' ? 
      this.inputs.designFlow / 28.317 : // L/s to cfs
      this.inputs.designFlow / 448.831;  // gpm to cfs
    
    const maxArea = flowCfs / minVelocity;
    const maxDiameter = Math.sqrt(4 * maxArea / Math.PI);
    const maxNominalInches = maxDiameter * (this.inputs.units === 'metric' ? 39.37 : 12);
    
    return Math.min(72, Math.ceil(maxNominalInches * 1.5)); // Allow 50% larger for optimization
  }

  /**
   * Generate cache key for pipe size evaluation
   * @param pipeSize Pipe size
   * @returns Cache key string
   */
  private generateCacheKey(pipeSize: PipeSize): string {
    return `${pipeSize.nominalDiameter}-${pipeSize.material}-${this.inputs.designFlow}-${this.inputs.pipeLength}`;
  }

  /**
   * Calculate head loss ratio (actual/allowable)
   * @param hydraulics Hydraulic results
   * @returns Head loss ratio
   */
  private calculateHeadLossRatio(hydraulics: any): number {
    const maxAllowableHeadLoss = this.inputs.maxHeadLoss || 
      (this.inputs.units === 'metric' ? 10 : 30);
    return hydraulics.headLoss / maxAllowableHeadLoss;
  }

  /**
   * Calculate velocity ratio (actual/optimal)
   * @param pipeSize Pipe size
   * @param hydraulics Hydraulic results
   * @returns Velocity ratio
   */
  private calculateVelocityRatio(pipeSize: PipeSize, hydraulics: any): number {
    const materialProps = getMaterialProperties(pipeSize.material);
    const optimalVelocity = (materialProps.minVelocity + materialProps.maxVelocity) / 2;
    return hydraulics.velocity / optimalVelocity;
  }

  /**
   * Calculate capacity factor (design flow / pipe capacity)
   * @param pipeSize Pipe size
   * @param hydraulics Hydraulic results
   * @returns Capacity factor
   */
  private calculateCapacityFactor(pipeSize: PipeSize, hydraulics: any): number {
    const materialProps = getMaterialProperties(pipeSize.material);
    const maxCapacityVelocity = materialProps.maxVelocity;
    const maxFlow = maxCapacityVelocity * pipeSize.area;
    const designFlowCfs = this.inputs.units === 'metric' ?
      this.inputs.designFlow / 28.317 :
      this.inputs.designFlow / 448.831;
    return designFlowCfs / maxFlow;
  }

  /**
   * Validate input parameters
   * @throws Error if inputs are invalid
   */
  private validateInputs(): void {
    const errors: string[] = [];

    if (this.inputs.designFlow <= 0) {
      errors.push('Design flow must be positive');
    }

    if (this.inputs.pipeLength <= 0) {
      errors.push('Pipe length must be positive');
    }

    if (this.inputs.preferredMaterials.length === 0) {
      errors.push('At least one preferred material must be specified');
    }

    if (this.inputs.safetyFactor < 1.0) {
      errors.push('Safety factor must be at least 1.0');
    }

    if (errors.length > 0) {
      throw new Error(`Input validation failed: ${errors.join(', ')}`);
    }
  }

  // Helper methods for economic calculations

  private getMaterialCostPerUnit(material: string): number {
    // Simplified cost per cubic unit ($/ft³ or $/m³)
    const costs = {
      pvc: this.inputs.units === 'metric' ? 300 : 200,
      ductileIron: this.inputs.units === 'metric' ? 450 : 300,
      steel: this.inputs.units === 'metric' ? 600 : 400,
      hdpe: this.inputs.units === 'metric' ? 400 : 275,
      concrete: this.inputs.units === 'metric' ? 350 : 225,
      'cast-iron': this.inputs.units === 'metric' ? 500 : 325
    };
    return costs[material as keyof typeof costs] || costs.pvc;
  }

  private getInstallationCostPerUnit(pipeSize: PipeSize): number {
    const baseCost = this.inputs.units === 'metric' ? 150 : 100; // $/m or $/ft
    const sizeFactor = 1 + (pipeSize.nominalDiameter / (this.inputs.units === 'metric' ? 600 : 24));
    const methodFactor = this.inputs.installationMethod === 'trenchless' ? 2.5 : 1.0;
    return baseCost * sizeFactor * methodFactor;
  }

  private calculateExcavationVolume(pipeSize: PipeSize): number {
    const pipeWidth = pipeSize.nominalDiameter / (this.inputs.units === 'metric' ? 1000 : 12);
    const trenchWidth = pipeWidth + (this.inputs.units === 'metric' ? 0.6 : 2); // working space
    const trenchDepth = pipeWidth + (this.inputs.frostDepth || 
      (this.inputs.units === 'metric' ? 0.75 : 2.5));
    return trenchWidth * trenchDepth * this.inputs.pipeLength;
  }

  private calculateFittingsCostFactor(): number {
    const baseFactor = 0.15; // 15% of pipe cost for basic fittings
    const fittingsCount = this.inputs.fittings.reduce((sum, fitting) => sum + fitting.quantity, 0);
    return baseFactor + (fittingsCount * 0.05); // 5% per additional fitting type
  }

  private calculateAnnualEnergyCost(hydraulics: any): number | undefined {
    if (this.inputs.systemType !== 'pumped' || !this.inputs.energyCost) {
      return undefined;
    }

    // Simplified energy cost calculation
    const pumpPower = hydraulics.totalHeadLoss * this.inputs.designFlow * 0.746 / 3960; // kW
    const annualHours = 8760; // hours per year
    return pumpPower * annualHours * this.inputs.energyCost;
  }

  private calculateNPV(capital: number, annualCost: number, years: number, discountRate: number): number {
    const pvFactor = (1 - Math.pow(1 + discountRate / 100, -years)) / (discountRate / 100);
    return capital + (annualCost * pvFactor);
  }

  private calculateActualSafetyFactor(pipeSize: PipeSize, hydraulics: any): number {
    const materialProps = getMaterialProperties(pipeSize.material);
    const maxCapacityVelocity = materialProps.maxVelocity;
    return maxCapacityVelocity / hydraulics.velocity;
  }

  private getMaterialSuitabilityScore(material: string): number {
    // Score based on material properties and suitability for application
    const scores = {
      pvc: 90,        // Excellent for most applications
      ductileIron: 85, // Good all-around choice
      hdpe: 80,        // Good for corrosive environments
      steel: 75,       // Good for high pressure
      concrete: 70,    // Good for gravity systems
      'cast-iron': 60  // Legacy material
    };
    return scores[material as keyof typeof scores] || 70;
  }

  private generatePipeSpecificWarnings(pipeSize: PipeSize, hydraulics: any, economics: EconomicResults): string[] {
    const warnings: string[] = [];
    
    // Size availability warning
    const availability = getSizeAvailability(pipeSize.nominalDiameter, pipeSize.material);
    if (availability === 'special-order') {
      warnings.push(`${pipeSize.nominalDiameter}" ${pipeSize.material} pipe requires special order - longer lead time and higher cost`);
    } else if (availability === 'unavailable') {
      warnings.push(`${pipeSize.nominalDiameter}" ${pipeSize.material} pipe may not be readily available`);
    }

    // Cost warnings
    if (economics.totalCapitalCost > 100000) {
      warnings.push('High capital cost - consider value engineering alternatives');
    }

    // Installation warnings
    if (this.inputs.installationMethod === 'trenchless' && pipeSize.nominalDiameter > 36) {
      warnings.push('Large diameter trenchless installation may be challenging');
    }

    return warnings;
  }
}