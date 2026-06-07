import React, { useState, useRef, useEffect } from 'react';
import { IrisSample, FeatureName } from '../types';
import { fitScaler, applyScale, predictKNN } from '../utils/mathHelpers';
import { BrainCircuit, Info, Star, MousePointerClick, HelpCircle } from 'lucide-react';

interface KNNEngineProps {
  trainingSet: IrisSample[];
  k: number;
  setK: (k: number) => void;
  useScaling: boolean;
}

export default function KNNEngine({
  trainingSet,
  k,
  setK,
  useScaling
}: KNNEngineProps) {
  // Features to plot
  const xAxis: FeatureName = 'petalLength';
  const yAxis: FeatureName = 'petalWidth';

  // State of current query pointer coords (in intermediate scale range or raw range depending on scaling toggle)
  // Let's set a default query coordinate near Versicolor/Virginica boundary
  const [queryRawX, setQueryRawX] = useState<number>(4.8);
  const [queryRawY, setQueryRawY] = useState<number>(1.6);

  const scalerParams = fitScaler(trainingSet);

  const querySample = {
    sepalLength: 5.8, // Hold sepal constants for 2D simplified demo
    sepalWidth: 3.0,
    petalLength: queryRawX,
    petalWidth: queryRawY
  };

  // Run the true KNN algorithm on current query location!
  const predictionResult = predictKNN(querySample, trainingSet, k, useScaling, scalerParams);

  // SVG parameters
  const width = 500;
  const height = 300;
  const margin = { top: 25, right: 30, bottom: 40, left: 50 };

  // Feature parameters to map coords
  const xMin = 1.0; const xMax = 7.0; // Petal Length constraints
  const yMin = 0.1; const yMax = 2.5; // Petal Width constraints

  const getSvgCoords = (rawX: number, rawY: number) => {
    if (useScaling) {
      // Map scaled Z values [-2.5, 2.5] to SVG dimensions
      const scaledX = (rawX - scalerParams[xAxis].mean) / scalerParams[xAxis].std;
      const scaledY = (rawY - scalerParams[yAxis].mean) / scalerParams[yAxis].std;
      
      const xRange = width - margin.left - margin.right;
      const yRange = height - margin.top - margin.bottom;
      
      const x = margin.left + ((scaledX + 2.5) / 5.0) * xRange;
      const y = height - margin.bottom - ((scaledY + 2.5) / 5.0) * yRange;
      return { x, y };
    } else {
      // Map raw coordinates to SVG dimensions
      const xRange = width - margin.left - margin.right;
      const yRange = height - margin.top - margin.bottom;
      
      const x = margin.left + ((rawX - xMin) / (xMax - xMin)) * xRange;
      const y = height - margin.bottom - ((rawY - yMin) / (yMax - yMin)) * yRange;
      return { x, y };
    }
  };

  // Reverse mapping for mouse clicks to update query location!
  const svgRef = useRef<SVGSVGElement | null>(null);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Boundary check
    if (clickX < margin.left || clickX > width - margin.right || clickY < margin.top || clickY > height - margin.bottom) {
      return;
    }

    const xRange = width - margin.left - margin.right;
    const yRange = height - margin.top - margin.bottom;

    if (useScaling) {
      // Scaled coords mapping
      const pctX = (clickX - margin.left) / xRange;
      const pctY = 1 - (clickY - margin.top) / yRange; // Inverted

      const scaledX = pctX * 5.0 - 2.5;
      const scaledY = pctY * 5.0 - 2.5;

      const rawX = scaledX * scalerParams[xAxis].std + scalerParams[xAxis].mean;
      const rawY = scaledY * scalerParams[yAxis].std + scalerParams[yAxis].mean;

      // Bound safeguards
      setQueryRawX(Math.max(xMin, Math.min(xMax, rawX)));
      setQueryRawY(Math.max(yMin, Math.min(yMax, rawY)));
    } else {
      // Raw mapping
      const pctX = (clickX - margin.left) / xRange;
      const pctY = 1 - (clickY - margin.top) / yRange; // Inverted

      const rawX = xMin + pctX * (xMax - xMin);
      const rawY = yMin + pctY * (yMax - yMin);

      setQueryRawX(Math.max(xMin, Math.min(xMax, rawX)));
      setQueryRawY(Math.max(yMin, Math.min(yMax, rawY)));
    }
  };

  // Convert raw query and neighbors to SVG coords
  const querySvg = getSvgCoords(queryRawX, queryRawY);

  const speciesThemes = {
    Setosa: { fill: '#22d3ee', border: '#0891b2', bg: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' },
    Versicolor: { fill: '#c084fc', border: '#9333ea', bg: 'bg-purple-500/10 text-purple-300 border border-purple-500/20' },
    Virginica: { fill: '#f43f5e', border: '#e11d48', bg: 'bg-rose-500/10 text-rose-300 border border-rose-500/20' },
  };

  const speciesFeedbackThemes = {
    Setosa: { bg: 'bg-cyan-500/20 border border-cyan-400/30 text-cyan-100 shadow-[0_0_15px_rgba(34,211,238,0.2)]' },
    Versicolor: { bg: 'bg-purple-500/20 border border-purple-400/30 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.2)]' },
    Virginica: { bg: 'bg-rose-500/20 border border-rose-400/30 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.2)]' },
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-5 flex flex-col h-full shadow-2xl rounded-2xl text-white">
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1 px-1.5 rounded-lg bg-white/10 text-cyan-300 border border-white/10">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-display">
              Step 3: Algorithmic Neighborhood & $K$-Nearest Neighbor Votes
            </h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* KNN Controls Panel */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-white/45 font-mono block">
            Hyperparameter Tuning
          </span>

          {/* K slider */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-white/95">
              <span className="flex items-center gap-1.5">
                Number of Neighbors ($K$)
              </span>
              <span className="font-mono text-cyan-300 font-extrabold text-sm">K = {k}</span>
            </div>
            <input
              id="knn-k-field"
              type="range"
              min="1"
              max="21"
              step="2" // Odd numbers to minimize ties
              value={k}
              onChange={(e) => setK(parseInt(e.target.value))}
              className="w-full h-1 bg-white/15 rounded-lg cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[9px] text-white/40 font-mono">
              <span>K = 1 (Overfit/Noise)</span>
              <span>K = 21 (Smooth/Generic)</span>
            </div>
          </div>

          {/* Interactive Proximity Instruction */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-[11px] text-white/60 leading-relaxed flex gap-2">
            <MousePointerClick className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block mb-0.5">Clickable Canvas Playground</span>
              Click anywhere on the scatter plot canvas to reposition the target Query Point and watch neighbor boundary links rewrite dynamically.
            </div>
          </div>

          {/* Core Prediction Feedback block */}
          <div className={`mt-auto p-4 rounded-xl text-center ${speciesFeedbackThemes[predictionResult.predictedClass].bg}`}>
            <span className="text-[10px] uppercase tracking-wider font-semibold font-mono opacity-80 block mb-1">
              Live Area Diagnosis
            </span>
            <div className="font-bold font-display text-lg">
              Iris {predictionResult.predictedClass}
            </div>
            <span className="text-[10px] font-mono block opacity-90 mt-0.5">
              Distance metric: Euclidean Dist (d)
            </span>
          </div>
        </div>

        {/* Dynamic Proximity Canvas Scatter plot */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 p-3 relative min-h-[300px]">
          <div className="absolute top-3 left-3 z-10 text-[10px] text-white/50 font-mono flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded border border-white border-dashed animate-pulse"></span>
            Proximity Dotted Nodes: Training Set
          </div>

          {/* Canvas SVG */}
          <svg
            ref={svgRef}
            onClick={handleSvgClick}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full cursor-crosshair select-none"
          >
            {/* Axis grid divisions */}
            {Array.from({ length: 6 }).map((_, i) => {
              const stepX = margin.left + (i * (width - margin.left - margin.right)) / 5;
              const stepY = margin.top + (i * (height - margin.top - margin.bottom)) / 5;
              return (
                <g key={i}>
                  <line x1={stepX} y1={margin.top} x2={stepX} y2={height - margin.bottom} stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="1" />
                  <line x1={margin.left} y1={stepY} x2={width - margin.right} y2={stepY} stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="1" />
                </g>
              );
            })}

            {/* Dotted lines establishing KNN coordinates */}
            {predictionResult.neighbors.map((neighbor, idx) => {
              const neighborSvg = getSvgCoords(neighbor.sample[xAxis], neighbor.sample[yAxis]);
              const strokeColor = speciesThemes[neighbor.sample.species].fill;
              return (
                <line
                  key={idx}
                  x1={querySvg.x}
                  y1={querySvg.y}
                  x2={neighborSvg.x}
                  y2={neighborSvg.y}
                  stroke={strokeColor}
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  className="animate-[dash_1s_linear_infinite]"
                  opacity="0.85"
                />
              );
            })}

            {/* Scatter points of training records */}
            {trainingSet.map((sample) => {
              const { x, y } = getSvgCoords(sample[xAxis], sample[yAxis]);
              
              // Highlight this node if it is in the active top nearest neighbors array
              const isNeighbor = predictionResult.neighbors.some(n => n.sample.id === sample.id);
              const theme = speciesThemes[sample.species];

              return (
                <circle
                  key={sample.id}
                  cx={x}
                  cy={y}
                  r={isNeighbor ? "7" : "3.5"}
                  fill={theme.fill}
                  stroke={isNeighbor ? "#ffffff" : theme.border}
                  strokeWidth={isNeighbor ? "1.5" : "1"}
                  opacity={isNeighbor ? "1.0" : "0.35"}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* SVG Query Point Render */}
            <g transform={`translate(${querySvg.x}, ${querySvg.y})`} className="cursor-grab">
              {/* Outer proximity highlight wave */}
              <circle r="15" fill="#22d3ee" opacity="0.15" className="animate-ping" />
              {/* Query element border */}
              <circle r="9" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" />
              {/* White Question mark overlay representing queried coordinates */}
              <text y="3" textAnchor="middle" fill="#ffffff" className="text-[10px] font-sans font-extrabold font-mono">
                ?
              </text>
            </g>

            {/* Axes Lines */}
            <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.2" />
            <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.2" />

            {/* Labels and values */}
            <text
              x={margin.left + (width - margin.left - margin.right) / 2}
              y={height - 8}
              textAnchor="middle"
              className="text-[9px] fill-current fill-white/60 font-semibold font-mono tracking-wide"
            >
              Iris Petal Length {useScaling ? '(Z Standard Scaled)' : '(cm)'}
            </text>

            <text
              transform={`rotate(-90, ${15}, ${margin.top + (height - margin.top - margin.bottom) / 2})`}
              x={15}
              y={margin.top + (height - margin.top - margin.bottom) / 2}
              textAnchor="middle"
              className="text-[9px] fill-current fill-white/60 font-semibold font-mono tracking-wide"
            >
              Iris Petal Width {useScaling ? '(Z Standard Scaled)' : '(cm)'}
            </text>

            {/* Tick annotations */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const xValue = xMin + (i / 5) * (xMax - xMin);
              const yValue = yMin + (i / 5) * (yMax - yMin);
              const x = margin.left + (i / 5) * (width - margin.left - margin.right);
              const y = height - margin.bottom - (i / 5) * (height - margin.top - margin.bottom);
              return (
                <g key={i}>
                  <text x={x} y={height - margin.bottom + 10} textAnchor="middle" className="text-[7.5px] font-mono fill-current fill-white/40">
                    {useScaling ? (i - 2.5).toFixed(1) : xValue.toFixed(1)}
                  </text>
                  <text x={margin.left - 5} y={y + 3.5} textAnchor="end" className="text-[7.5px] font-mono fill-current fill-white/40">
                    {useScaling ? (i - 2.5).toFixed(1) : yValue.toFixed(1)}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="px-3 pb-1 text-[10px] text-white/40 font-mono text-right">
            Slide 11 Target: Top Nearest Neighbors vote ($K={k}$). Lines point directly of distance (d) bounds.
          </div>
        </div>
      </div>
    </div>
  );
}
