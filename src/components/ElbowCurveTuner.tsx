import { useState, useMemo } from 'react';
import { IrisSample } from '../types';
import { computeElbowCurve, ElbowPoint } from '../utils/mathHelpers';
import { AreaChart, HelpCircle, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';

interface ElbowCurveTunerProps {
  trainingSet: IrisSample[];
  testingSet: IrisSample[];
  k: number;
  setK: (k: number) => void;
  useScaling: boolean;
}

export default function ElbowCurveTuner({
  trainingSet,
  testingSet,
  k,
  setK,
  useScaling
}: ElbowCurveTunerProps) {
  // Compute true error rate arrays dynamically!
  const curveData = useMemo(() => {
    return computeElbowCurve(trainingSet, testingSet, useScaling);
  }, [trainingSet, testingSet, useScaling]);

  // Identify the local optimal "Elbow" (minimum error rate).
  // In machine learning, if there's a tie, we prefer smaller K to keep calculation lightweight, but odd numbers to avoid ties.
  const optimalPoint = useMemo(() => {
    if (curveData.length === 0) return null;
    let opt = curveData[0];
    for (const pt of curveData) {
      // Find the first minimum error rate
      if (pt.errorRate < opt.errorRate) {
        opt = pt;
      }
    }
    return opt;
  }, [curveData]);

  // SVG parameters
  const width = 500;
  const height = 280;
  const margin = { top: 25, right: 30, bottom: 40, left: 45 };

  // Coordinates mapping
  const points = useMemo(() => {
    if (curveData.length === 0) return [];
    
    const xRange = width - margin.left - margin.right;
    const yRange = height - margin.top - margin.bottom;
    
    // Scale X: K spans [1, 25] (or curveData length)
    const maxX = Math.max(...curveData.map(d => d.k));
    const minX = 1;
    
    // Scale Y: Error Rate spans [0, 1]
    return curveData.map(pt => {
      const x = margin.left + ((pt.k - minX) / (maxX - minX)) * xRange;
      // Invert Y coordinate so 0% error is at bottom and 100% error is at top
      const y = height - margin.bottom - pt.errorRate * yRange;
      return { x, y, pt };
    });
  }, [curveData]);

  // Draw smooth polyline coordinates path
  const polylinePath = useMemo(() => {
    return points.map(p => `${p.x},${p.y}`).join(' ');
  }, [points]);

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-5 flex flex-col h-full shadow-2xl rounded-2xl text-white">
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1 px-1.5 rounded-lg bg-white/10 text-cyan-300 border border-white/10">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-display">
              Step 4: Hyperparameter Tuning & Choosing the Optimal $K$ (The Elbow)
            </h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* Dynamic commentary scorecard */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <span className="text-[10px] uppercase font-bold tracking-wider text-white/45 font-mono block">
            Hyperparameter Commentary
          </span>

          {/* Core Advice */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-300" />
              <span className="text-xs font-semibold text-white/90">The Elbow Recommendation</span>
            </div>
            <p className="text-[11px] text-white/60 leading-relaxed">
              Our real-time analyzer evaluated the pipeline across all $K$ parameters. The **minimum validation error rate** is achieved at:
            </p>
            {optimalPoint && (
              <div className="bg-white/5 rounded-xl border border-white/10 p-2.5 text-center shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                <span className="text-[10px] text-white/40 font-mono block">Calculated Optimal K</span>
                <span className="text-lg font-extrabold text-cyan-300 font-display">K = {optimalPoint.k}</span>
                <span className="text-[10px] text-white/70 font-mono block">
                  Error: {(optimalPoint.errorRate * 100).toFixed(1)}% | Accuracy: {(optimalPoint.accuracy * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {/* Underfitting vs Overfitting warnings */}
          <div className="space-y-2">
            <div className="bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-white/70 rounded-lg p-2.5 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-cyan-200 block text-[10.5px]">K=1: High Variance (Overfitting)</span>
                Very sensitive to outlier noise and training sample anomalies. Highly spiked decision margins.
              </div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 text-[10px] text-white/70 rounded-lg p-2.5 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-purple-300 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-purple-200 block text-[10.5px]">K=Large: High Bias (Underfitting)</span>
                Averages too broad of a neighborhood. Smooth boundaries ignore fine species details.
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Elbow Line chart (Col 8) */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 p-3 relative min-h-[280px]">
          <div className="absolute top-3 left-3 z-10 text-[10px] text-white/50 font-mono flex items-center justify-between w-[92%]">
            <span>Diagnostic Plot: Error Rate vs. K Value</span>
            <span className="text-cyan-300 font-semibold animate-pulse">Click a data point below to select $K$!</span>
          </div>

          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none">
            {/* Grid references */}
            {Array.from({ length: 6 }).map((_, i) => {
              const xRange = width - margin.left - margin.right;
              const yRange = height - margin.top - margin.bottom;
              const pct = i / 5;
              
              const stepX = margin.left + pct * xRange;
              const stepY = margin.top + pct * yRange;
              
              return (
                <g key={i}>
                  <line x1={stepX} y1={margin.top} x2={stepX} y2={height - margin.bottom} stroke="rgba(255, 255, 255, 0.06)" strokeWidth="0.8" />
                  <line x1={margin.left} y1={stepY} x2={width - margin.right} y2={stepY} stroke="rgba(255, 255, 255, 0.06)" strokeWidth="0.8" />
                </g>
              );
            })}

            {/* Overfitting vs Underfitting text overlay */}
            <g opacity="0.25">
              <text x={margin.left + 15} y={margin.top + 30} className="text-[9px] fill-cyan-400 font-extrabold font-mono uppercase tracking-wider">
                ⚠️ OVERFITTING ZONE (K=1)
              </text>
              <text x={width - margin.right - 15} y={margin.top + 30} textAnchor="end" className="text-[9px] fill-purple-400 font-extrabold font-mono uppercase tracking-wider">
                ⚠️ UNDERFITTING ZONE (K=25)
              </text>
            </g>

            {/* Path representing the actual error rate (Line) */}
            {polylinePath && (
              <polyline
                fill="none"
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth="2.5"
                points={polylinePath}
                opacity="0.7"
              />
            )}

            {/* Highlighted path points */}
            {points.map((p) => {
              const isSelectedK = p.pt.k === k;
              const isOptimalK = optimalPoint && p.pt.k === optimalPoint.k;

              let fillColor = 'rgba(255, 255, 255, 0.3)';
              let strokeColor = 'rgba(255, 255, 255, 0.1)';
              let radius = '4';

              if (isSelectedK) {
                fillColor = '#22d3ee'; // Cyan selector
                strokeColor = '#ffffff';
                radius = '6.5';
              } else if (isOptimalK) {
                fillColor = '#c084fc'; // Purple suggestion
                strokeColor = '#ffffff';
                radius = '5.5';
              }

              return (
                <g key={p.pt.k} className="cursor-pointer" onClick={() => setK(p.pt.k)}>
                  {/* Outer pulsing ring for selected model K */}
                  {isSelectedK && (
                    <circle cx={p.x} cy={p.y} r="10" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.6" className="animate-ping" />
                  )}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={radius}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth="1.5"
                    className="hover:scale-150 transition-transform duration-200"
                  >
                    <title>{`K = ${p.pt.k} | Error Rate = ${(p.pt.errorRate * 100).toFixed(1)}%`}</title>
                  </circle>
                  
                  {/* Subtle label numbers */}
                  {isSelectedK && (
                    <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#22d3ee" className="text-[8.5px] font-bold font-mono">
                      K={p.pt.k} ({ (p.pt.errorRate*100).toFixed(0) }% err)
                    </text>
                  )}
                </g>
              );
            })}

            {/* Chart Axes bounding line */}
            <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.2" />
            <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.2" />

            {/* Labels */}
            <text
              x={margin.left + (width - margin.left - margin.right) / 2}
              y={height - 8}
              textAnchor="middle"
              className="text-[9px] fill-current fill-white/60 font-semibold font-mono uppercase tracking-wide"
            >
              Hyperparameter Value ($K$ Neighbors)
            </text>

            <text
              transform={`rotate(-90, ${15}, ${margin.top + (height - margin.top - margin.bottom) / 2})`}
              x={15}
              y={margin.top + (height - margin.top - margin.bottom) / 2}
              textAnchor="middle"
              className="text-[9px] fill-current fill-white/60 font-semibold font-mono uppercase tracking-wide"
            >
              Pipeline Error Rate (1 - Accuracy)
            </text>

            {/* Axis Ticks */}
            {[1, 5, 10, 15, 20, 25].map(v => {
              const xRange = width - margin.left - margin.right;
              const xCoord = margin.left + ((v - 1) / 24) * xRange;
              return (
                <text key={v} x={xCoord} y={height - margin.bottom + 11} textAnchor="middle" className="text-[8px] font-mono fill-current fill-white/40">
                  {v}
                </text>
              );
            })}

            {/* Y axis ticks representing percentage errors */}
            {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map(v => {
              const yRange = height - margin.top - margin.bottom;
              const yCoord = height - margin.bottom - v * yRange;
              return (
                <text key={v} x={margin.left - 5} y={yCoord + 3.5} textAnchor="end" className="text-[8px] font-mono fill-current fill-white/40">
                  {Math.round(v * 100)}%
                </text>
              );
            })}
          </svg>

          <div className="px-3 pb-1 text-[10px] text-white/40 font-mono text-right">
            Slide 12: Finding the Curve &quot;Elbow&quot; minimizes error without causing variance noise (overfitting).
          </div>
        </div>
      </div>
    </div>
  );
}
