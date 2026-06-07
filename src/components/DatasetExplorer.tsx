import { useState } from 'react';
import { IrisSample, FeatureName } from '../types';
import { fitScaler, applyScale } from '../utils/mathHelpers';
import { Info, HelpCircle, TableProperties, Sparkles, Scale, Percent } from 'lucide-react';

interface DatasetExplorerProps {
  dataset: IrisSample[];
}

export default function DatasetExplorer({ dataset }: DatasetExplorerProps) {
  // Axes for SVG scatter plot
  const [xAxis, setXAxis] = useState<FeatureName>('petalLength');
  const [yAxis, setYAxis] = useState<FeatureName>('petalWidth');
  const [isScaled, setIsScaled] = useState<boolean>(true);
  
  // Tab control for exploration mode (Visualizer vs Data Table)
  const [explorerTab, setExplorerTab] = useState<'visualizer' | 'table'>('visualizer');

  // Page index for data table
  const [tablePage, setTablePage] = useState<number>(0);
  const itemsPerPage = 8;

  // Fit scaler on full dataset to show standard stats
  const scalerParams = fitScaler(dataset);

  // Feature metadata
  const featureMeta: Record<FeatureName, { label: string; min: number; max: number; unit: string }> = {
    sepalLength: { label: 'Sepal Length', min: 4.0, max: 8.0, unit: 'cm' },
    sepalWidth: { label: 'Sepal Width', min: 2.0, max: 4.5, unit: 'cm' },
    petalLength: { label: 'Petal Length', min: 1.0, max: 7.0, unit: 'cm' },
    petalWidth: { label: 'Petal Width', min: 0.1, max: 2.5, unit: 'cm' },
  };

  // Class themes
  const classColors = {
    Setosa: { fill: '#22d3ee', border: '#0891b2', bg: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' },
    Versicolor: { fill: '#c084fc', border: '#9333ea', bg: 'bg-purple-500/10 text-purple-300 border border-purple-500/20' },
    Virginica: { fill: '#f43f5e', border: '#e11d48', bg: 'bg-rose-500/10 text-rose-300 border border-rose-500/20' },
  };

  // Calculate statistics of full dataset for current active axes
  const getStats = (f: FeatureName) => {
    const rawValues = dataset.map(d => d[f]);
    const rawMean = rawValues.reduce((sum, v) => sum + v, 0) / rawValues.length;
    const rawVariance = rawValues.reduce((sum, v) => sum + Math.pow(v - rawMean, 2), 0) / rawValues.length;
    const rawStd = Math.sqrt(rawVariance);

    const scaledValues = dataset.map(d => (d[f] - scalerParams[f].mean) / scalerParams[f].std);
    const scaledMean = scaledValues.reduce((sum, v) => sum + v, 0) / scaledValues.length;
    const scaledVariance = scaledValues.reduce((sum, v) => sum + Math.pow(v - scaledMean, 2), 0) / scaledValues.length;
    const scaledStd = Math.sqrt(scaledVariance);

    return {
      raw: { mean: rawMean, variance: rawVariance, std: rawStd },
      scaled: { mean: scaledMean, variance: scaledVariance, std: scaledStd }
    };
  };

  const xStats = getStats(xAxis);
  const yStats = getStats(yAxis);

  // SVG dimensions & margins
  const width = 450;
  const height = 300;
  const margin = { top: 25, right: 30, bottom: 40, left: 55 };

  // Helper to map data values to SVG coordinates
  const getSvgCoordinates = (sample: IrisSample) => {
    let rawX = sample[xAxis];
    let rawY = sample[yAxis];

    if (isScaled) {
      // Scaled coord is typically in range [-2.5, 2.5]
      const scaledX = (rawX - scalerParams[xAxis].mean) / scalerParams[xAxis].std;
      const scaledY = (rawY - scalerParams[yAxis].mean) / scalerParams[yAxis].std;
      
      // Map [-3, 3] to [margin.left, width - margin.right]
      const xRange = width - margin.left - margin.right;
      const yRange = height - margin.top - margin.bottom;
      
      const x = margin.left + ((scaledX + 3) / 6) * xRange;
      const y = height - margin.bottom - ((scaledY + 3) / 6) * yRange;
      return { x, y, valX: scaledX, valY: scaledY };
    } else {
      // Map raw min to max
      const xMeta = featureMeta[xAxis];
      const yMeta = featureMeta[yAxis];
      
      const xRange = width - margin.left - margin.right;
      const yRange = height - margin.top - margin.bottom;
      
      const x = margin.left + ((rawX - xMeta.min) / (xMeta.max - xMeta.min)) * xRange;
      const y = height - margin.bottom - ((rawY - yMeta.min) / (yMeta.max - yMeta.min)) * yRange;
      return { x, y, valX: rawX, valY: rawY };
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-5 flex flex-col h-full shadow-2xl rounded-2xl text-white">
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1 px-1.5 rounded-lg bg-white/10 text-cyan-300 border border-white/10">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-display">
              Step 1: Input Data & Features Exploration
            </h2>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl text-xs border border-white/10">
          <button
            id="tab-visualizer"
            onClick={() => setExplorerTab('visualizer')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              explorerTab === 'visualizer'
                ? 'bg-white/15 text-white border border-white/10 shadow-lg'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Data Visualizer
          </button>
          <button
            id="tab-table"
            onClick={() => setExplorerTab('table')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              explorerTab === 'table'
                ? 'bg-white/15 text-white border border-white/10 shadow-lg'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Tabular View
          </button>
        </div>
      </div>

      {explorerTab === 'visualizer' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
          {/* Controls & Mini Statistics sidebar (Col 5) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/45 block font-mono">
                Select Visual Dimensions
              </span>

              {/* X Axis select */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-white/70">X-Axis Variable</label>
                <select
                  id="x-axis-select"
                  value={xAxis}
                  onChange={(e) => setXAxis(e.target.value as FeatureName)}
                  className="w-full text-xs p-2 rounded-lg border border-white/15 bg-slate-900/90 text-white font-bold outline-none backdrop-blur-md"
                >
                  {Object.entries(featureMeta).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
              </div>

              {/* Y Axis select */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-white/70">Y-Axis Variable</label>
                <select
                  id="y-axis-select"
                  value={yAxis}
                  onChange={(e) => setYAxis(e.target.value as FeatureName)}
                  className="w-full text-xs p-2 rounded-lg border border-white/15 bg-slate-900/90 text-white font-bold outline-none backdrop-blur-md"
                >
                  {Object.entries(featureMeta).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
              </div>

              {/* Scaling Option Rule */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-cyan-300" />
                    <span className="text-xs font-bold text-white">StandardScaler</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      id="scaling-toggle"
                      type="checkbox"
                      checked={isScaled}
                      onChange={() => setIsScaled(!isScaled)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-400"></div>
                  </label>
                </div>
                <p className="text-[10.5px] text-white/60 leading-relaxed">
                  Adjust data so each feature has $\mu = 0$ and $\sigma^2 = 1$ (Balanced). This eliminates feature range bias in spacing algorithms.
                </p>
              </div>
            </div>

            {/* Scale calculations scorecard */}
            <div className="mt-auto bg-white/5 border border-white/10 rounded-xl p-4 space-y-2.5">
              <span className="text-[9px] uppercase font-bold tracking-wider text-white/45 font-mono block">
                Live Mathematical Moments
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="space-y-1 bg-white/5 p-2 rounded-lg border border-white/5">
                  <span className="text-[9px] text-white/50 block font-semibold uppercase">X Mean (μ)</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {isScaled ? xStats.scaled.mean.toFixed(0) : xStats.raw.mean.toFixed(2)} {!isScaled && featureMeta[xAxis].unit}
                  </span>
                </div>
                <div className="space-y-1 bg-white/5 p-2 rounded-lg border border-white/5">
                  <span className="text-[9px] text-white/50 block font-semibold uppercase">X Std (σ)</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {isScaled ? xStats.scaled.std.toFixed(0) : xStats.raw.std.toFixed(2)}
                  </span>
                </div>
                <div className="space-y-1 bg-white/5 p-2 rounded-lg border border-white/5 col-span-2">
                  <span className="text-[9px] text-white/50 block font-semibold uppercase">Range Balance Rule</span>
                  <div className="flex gap-1.5 items-center">
                    <span className={`w-1.5 h-1.5 rounded-full ${isScaled ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'}`}></span>
                    <span className="font-sans font-bold text-white">
                      {isScaled ? 'Isotropic Ball (Balanced)' : 'Capsule Clustered (Biased)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Plot SVG (Col 8) */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-3 relative min-h-[300px]">
            {/* Class legend overlays */}
            <div className="absolute top-3 right-3 flex gap-2 z-10">
              {['Setosa', 'Versicolor', 'Virginica'].map(cls => (
                <div key={cls} className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${classColors[cls as 'Setosa'].bg}`}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: classColors[cls as 'Setosa'].fill }}></span>
                  {cls}
                </div>
              ))}
            </div>

            {/* Main Scatter plot SVG */}
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none">
              {/* Plot Grid lines */}
              {Array.from({ length: 7 }).map((_, i) => {
                const stepX = margin.left + (i * (width - margin.left - margin.right)) / 6;
                const stepY = margin.top + (i * (height - margin.top - margin.bottom)) / 6;
                return (
                  <g key={i}>
                    {/* Vertical grid line */}
                    <line x1={stepX} y1={margin.top} x2={stepX} y2={height - margin.bottom} stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="2" />
                    {/* Horizontal grid line */}
                    <line x1={margin.left} y1={stepY} x2={width - margin.right} y2={stepY} stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="2" />
                  </g>
                );
              })}

              {/* Central axis ticks for standard scaling */}
              {isScaled && (
                <g>
                  {/* Y = 0 center line */}
                  <line
                    x1={margin.left}
                    y1={margin.top + (3 / 6) * (height - margin.top - margin.bottom)}
                    x2={width - margin.right}
                    y2={margin.top + (3 / 6) * (height - margin.top - margin.bottom)}
                    stroke="rgba(255, 255, 255, 0.25)"
                    strokeWidth="1"
                    opacity="0.5"
                  />
                  {/* X = 0 center line */}
                  <line
                    x1={margin.left + (3 / 6) * (width - margin.left - margin.right)}
                    y1={margin.top}
                    x2={margin.left + (3 / 6) * (width - margin.left - margin.right)}
                    y2={height - margin.bottom}
                    stroke="rgba(255, 255, 255, 0.25)"
                    strokeWidth="1"
                    opacity="0.5"
                  />
                </g>
              )}

              {/* Plotting points */}
              {dataset.map((sample) => {
                const { x, y } = getSvgCoordinates(sample);
                const theme = classColors[sample.species];
                return (
                  <circle
                    key={sample.id}
                    cx={x}
                    cy={y}
                    r="4.5"
                    fill={theme.fill}
                    stroke={theme.border}
                    strokeWidth="1"
                    opacity="0.8"
                    className="hover:scale-150 transition-transform cursor-pointer"
                  >
                    <title>{`ID ${sample.id} (Iris ${sample.species}): X=${sample[xAxis]}, Y=${sample[yAxis]}`}</title>
                  </circle>
                );
              })}

              {/* Axes Boundaries */}
              <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" />
              <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" />

              {/* X Axis Name */}
              <text
                x={margin.left + (width - margin.left - margin.right) / 2}
                y={height - 8}
                textAnchor="middle"
                className="text-[10px] font-semibold text-white/60 uppercase font-mono tracking-wide fill-current"
              >
                {featureMeta[xAxis].label} {isScaled ? '(Z-Score Scale)' : `(${featureMeta[xAxis].unit})`}
              </text>

              {/* Y Axis Name */}
              <text
                transform={`rotate(-90, ${15}, ${margin.top + (height - margin.top - margin.bottom) / 2})`}
                x={15}
                y={margin.top + (height - margin.top - margin.bottom) / 2}
                textAnchor="middle"
                className="text-[10px] font-semibold text-white/60 uppercase font-mono tracking-wide fill-current"
              >
                {featureMeta[yAxis].label} {isScaled ? '(Z-Score Scale)' : `(${featureMeta[yAxis].unit})`}
              </text>

              {/* Grid ticks values */}
              {isScaled ? (
                // Scaled ranges [-3, -2, -1, 0, 1, 2, 3]
                [-3, -2, -1, 0, 1, 2, 3].map((val, idx) => {
                  const x = margin.left + (idx / 6) * (width - margin.left - margin.right);
                  const y = height - margin.bottom - (idx / 6) * (height - margin.top - margin.bottom);
                  return (
                    <g key={val}>
                      {/* X Tick Text */}
                      <text x={x} y={height - margin.bottom + 12} textAnchor="middle" className="text-[8px] font-mono text-white/40 fill-current">
                        {val}
                      </text>
                      {/* Y Tick Text */}
                      <text x={margin.left - 5} y={y + 3} textAnchor="end" className="text-[8px] font-mono text-white/40 fill-current">
                        {val}
                      </text>
                    </g>
                  );
                })
              ) : (
                // Raw bounds
                [0, 1, 2, 3, 4, 5, 6].map((i) => {
                  const xVal = featureMeta[xAxis].min + (i / 6) * (featureMeta[xAxis].max - featureMeta[xAxis].min);
                  const yVal = featureMeta[yAxis].min + (i / 6) * (featureMeta[yAxis].max - featureMeta[yAxis].min);
                  const x = margin.left + (i / 6) * (width - margin.left - margin.right);
                  const y = height - margin.bottom - (i / 6) * (height - margin.top - margin.bottom);
                  return (
                    <g key={i}>
                      <text x={x} y={height - margin.bottom + 12} textAnchor="middle" className="text-[8px] font-mono text-white/40 fill-current">
                        {xVal.toFixed(1)}
                      </text>
                      <text x={margin.left - 5} y={y + 3} textAnchor="end" className="text-[8px] font-mono text-white/40 fill-current">
                        {yVal.toFixed(1)}
                      </text>
                    </g>
                  );
                })
              )}
            </svg>
            <div className="px-3 pb-1 text-[10px] text-white/40 font-mono text-right">
              Slide 9: Standard Scale (Balanced variance and centered averages prevent distance weight biases).
            </div>
          </div>
        </div>
      ) : (
        /* Data Table Explorer */
        <div className="flex-1 flex flex-col justify-between">
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
            <table id="iris-data-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-white/50 text-[10px] uppercase tracking-wider font-mono border-b border-white/15">
                  <th className="p-2.5">ID</th>
                  <th className="p-2.5">Species</th>
                  <th className="p-2.5">{featureMeta.sepalLength.label}</th>
                  <th className="p-2.5">{featureMeta.sepalWidth.label}</th>
                  <th className="p-2.5">{featureMeta.petalLength.label}</th>
                  <th className="p-2.5">{featureMeta.petalWidth.label}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-xs">
                {dataset
                  .slice(tablePage * itemsPerPage, (tablePage + 1) * itemsPerPage)
                  .map((sample) => {
                    const scaled = applyScale(sample, scalerParams);
                    return (
                      <tr key={sample.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-2.5 font-mono text-white/40">#{sample.id}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${classColors[sample.species].bg}`}>
                            {sample.species}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-white">
                          {isScaled ? scaled.sepalLength.toFixed(2) : sample.sepalLength.toFixed(1)}
                          <span className="text-[10px] text-white/50 ml-0.5">{isScaled ? '' : 'cm'}</span>
                        </td>
                        <td className="p-2.5 font-mono text-white">
                          {isScaled ? scaled.sepalWidth.toFixed(2) : sample.sepalWidth.toFixed(1)}
                          <span className="text-[10px] text-white/50 ml-0.5">{isScaled ? '' : 'cm'}</span>
                        </td>
                        <td className="p-2.5 font-mono text-white">
                          {isScaled ? scaled.petalLength.toFixed(2) : sample.petalLength.toFixed(1)}
                          <span className="text-[10px] text-white/50 ml-0.5">{isScaled ? '' : 'cm'}</span>
                        </td>
                        <td className="p-2.5 font-mono text-white">
                          {isScaled ? scaled.petalWidth.toFixed(2) : sample.petalWidth.toFixed(1)}
                          <span className="text-[10px] text-white/50 ml-0.5">{isScaled ? '' : 'cm'}</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          <div className="flex items-center justify-between border-t border-white/15 pt-3 mt-3">
            <span className="text-xs text-white/50 font-mono">
              Displaying {tablePage * itemsPerPage + 1}-{Math.min((tablePage + 1) * itemsPerPage, dataset.length)} of {dataset.length} samples
            </span>
            <div className="flex gap-1">
              <button
                id="btn-prev-page"
                onClick={() => setTablePage(p => Math.max(0, p - 1))}
                disabled={tablePage === 0}
                className="px-3 py-1.5 text-xs border border-white/10 bg-white/10 text-white rounded-lg hover:bg-white/15 transition-colors disabled:opacity-30 font-semibold"
              >
                Prev
              </button>
              <button
                id="btn-next-page"
                onClick={() => setTablePage(p => Math.min(Math.ceil(dataset.length / itemsPerPage) - 1, p + 1))}
                disabled={(tablePage + 1) * itemsPerPage >= dataset.length}
                className="px-3 py-1.5 text-xs border border-white/10 bg-white/10 text-white rounded-lg hover:bg-white/15 transition-colors disabled:opacity-30 font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
