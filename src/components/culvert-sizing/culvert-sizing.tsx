import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Alert, AlertDescription } from '../ui/alert'
import { Button } from '../ui/button'
import { CulvertCalculator } from '@/lib/hydraulics/culvert-calculator'
import { CulvertParams, CulvertShape, ScenarioResult } from '@/lib/hydraulics/culvert-types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

export function CulvertSizing() {
  const [params, setParams] = useState<CulvertParams>({
    projectName: '',
    location: '',
    designDate: new Date().toISOString().split('T')[0],
    designFlow: 100,
    returnPeriod: 25,
    upstreamInvert: 100,
    downstreamInvert: 98,
    culvertLength: 50,
    maxHeadwater: 10,
    tailwaterDepth: 2,
    streamSlope: 0.02,
    material: 'concrete',
    shape: 'circular',
    entranceType: 'headwall',
    multipleCulverts: 1,
    minCoverDepth: 2,
    maxWidth: 20,
    environmentalFactors: {
      debrisLoad: 'low',
      sedimentTransport: false,
      aquaticPassage: false
    },
    units: 'english'
  })

  const [results, setResults] = useState<{ [key in CulvertShape]?: ScenarioResult[] } | null>(null)
  const [activeTab, setActiveTab] = useState('input')

  useEffect(() => {
    if (isValidInput(params)) {
      const calculator = new CulvertCalculator(params)
      const newResults = calculator.evaluateCulvertScenarios()
      setResults(newResults)
    }
  }, [params])

  const isValidInput = (params: CulvertParams): boolean => {
    return params.designFlow > 0 &&
           params.culvertLength > 0 &&
           params.maxHeadwater > 0
  }

  const formatSize = (size: ScenarioResult['size']) => {
    if (size.diameter) {
      return `Diameter: ${size.diameter.toFixed(2)} ${params.units === 'english' ? 'ft' : 'm'}`
    }
    if (size.width && size.height) {
      return `Width: ${size.width.toFixed(2)} ${params.units === 'english' ? 'ft' : 'm'}, Height: ${size.height.toFixed(2)} ${params.units === 'english' ? 'ft' : 'm'}`
    }
    if (size.span && size.rise) {
        return `Span: ${size.span.toFixed(2)} ${params.units === 'english' ? 'ft' : 'm'}, Rise: ${size.rise.toFixed(2)} ${params.units === 'english' ? 'ft' : 'm'}`
    }
    return 'N/A'
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="input">Design Input</TabsTrigger>
          <TabsTrigger value="results" disabled={!results}>Results</TabsTrigger>
        </TabsList>

        <TabsContent value="input">
          {/* Input form remains the same */}
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="projectName">Project Name</Label>
                      <Input
                        id="projectName"
                        value={params.projectName}
                        onChange={(e) => setParams({...params, projectName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={params.location}
                        onChange={(e) => setParams({...params, location: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="units">Units</Label>
                    <Select
                      value={params.units}
                      onValueChange={(value: 'english' | 'metric') => setParams({...params, units: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English (ft³/s)</SelectItem>
                        <SelectItem value="metric">Metric (m³/s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Design Flow Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="designFlow">Design Flow ({params.units === 'english' ? 'ft³/s' : 'm³/s'})</Label>
                    <Input
                      id="designFlow"
                      type="number"
                      value={params.designFlow}
                      onChange={(e) => setParams({...params, designFlow: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="returnPeriod">Return Period (years)</Label>
                    <Select
                      value={params.returnPeriod.toString()}
                      onValueChange={(value) => setParams({...params, returnPeriod: parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 5, 10, 25, 50, 100].map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results">
          {results && Object.keys(results).length > 0 ? (
            <Tabs defaultValue={Object.keys(results)[0]}>
              <TabsList>
                {Object.keys(results).map((shape) => (
                  <TabsTrigger key={shape} value={shape}>
                    {shape.charAt(0).toUpperCase() + shape.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(results).map(([shape, scenarios]) => (
                <TabsContent key={shape} value={shape}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Top 3 {shape.charAt(0).toUpperCase() + shape.slice(1)} Culvert Options</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rank</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Headwater ({params.units === 'english' ? 'ft' : 'm'})</TableHead>
                            <TableHead>Velocity ({params.units === 'english' ? 'ft/s' : 'm/s'})</TableHead>
                            <TableHead>Warnings</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {scenarios.slice(0, 3).map((scenario, index) => (
                            <TableRow key={index} className={index === 0 ? 'bg-green-100' : ''}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{formatSize(scenario.size)}</TableCell>
                              <TableCell>{scenario.hydraulics.headwater.toFixed(2)}</TableCell>
                              <TableCell>{scenario.hydraulics.velocity.toFixed(2)}</TableCell>
                              <TableCell>{scenario.warnings.join(', ')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <Alert>
              <AlertDescription>
                No valid culvert scenarios found for the given parameters. Please adjust your design input.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
