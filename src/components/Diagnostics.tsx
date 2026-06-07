import { useState, useMemo } from 'react';
import { IrisSample, ConfusionMatrix, ClassMetrics, MetricSummary } from '../types';
import { evaluateModel } from '../utils/mathHelpers';
import { ShieldAlert, BarChart3, Scale, Info, Check, HelpCircle } from 'lucide-react';

interface DiagnosticsProps {
  trainingSet: IrisSample[];
  testingSet: IrisSample[];
  k: number;
  useScaling: boolean;
}

export default function Diagnostics({
  trainingSet,
  testingSet,
  k,
  useScaling
}: DiagnosticsProps) {
  // Run true evaluation metrics on the active test set split!
  const results = useMemo(() => {
    return evaluateModel(trainingSet, testingSet, k, useScaling);
  }, [trainingSet, testingSet, k, useScaling]);

  // Selected class for class-specific detailed binary focal diagnostics (Setosa, Versicolor, Virginica)
  const [focalClass, setFocalClass] = useState<'Setosa' | 'Versicolor' | 'Virginica'>('Versicolor');

  const matrix = results.confusionMatrix.matrix;
  const metrics = results.classMetrics[focalClass];
  const overall = results.overallMetrics;

  // Let's compute weighing scale tilt degrees depending on Class-specific Precision vs. Recall
  const tiltAngle = useMemo(() => {
    const diff = metrics.precision - metrics.recall; // ranges [-1, 1]
    const maxTilt = 18; // maximum visual tilt degrees
    return diff * maxTilt;
  }, [metrics]);

  return (
    <div id="diagnostics-panel" className="backdrop-blur-xl bg-white/10 border border-white/20 p-5 flex flex-col h-full shadow-2xl rounded-2xl text-white">
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1 px-1.5 rounded-lg bg-white/10 text-cyan-300 border border-white/10">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-display">
              Step 5: Output Validation, Diagnostics & Strategic Trade-offs
            </h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* Left column (Col 4): Diagnostic Heatmap Multi-class matrix */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/45 font-mono block">
              3-Class Confusion Matrix Heatmap
            </span>
            <p className="text-[10px] text-white/60 leading-normal">
              Compare Actual target species (rows) against predicted class (columns). Clear diagonals represent correct hits (Slide 15).
            </p>
          </div>

          {/* Matrix table */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="grid grid-cols-4 gap-1 text-center font-mono text-[9px] font-bold text-white/40 uppercase tracking-wider select-none">
              <div></div>
              <div title="Predicted Setosa">Pred Set</div>
              <div title="Predicted Versicolor">Pred Ver</div>
              <div title="Predicted Virginica">Pred Virg</div>
            </div>

            {/* Setosa Row */}
            <div className="grid grid-cols-4 gap-1 mt-1.5 text-center items-center">
              <span className="text-[9px] font-bold text-white/40 uppercase text-left font-mono" title="Actual Setosa">Act Set</span>
              {/* Setosa -> Setosa */}
              <div className={`p-2 rounded font-mono text-xs font-bold border ${matrix.Setosa.Setosa > 0 ? 'bg-cyan-500/20 border-cyan-500/35 text-cyan-200' : 'bg-white/5 border-white/5 text-white/35'}`}>
                {matrix.Setosa.Setosa}
              </div>
              {/* Setosa -> Versicolor */}
              <div className={`p-2 rounded font-mono text-xs font-bold border ${matrix.Setosa.Versicolor > 0 ? 'bg-rose-500/20 border-rose-500/35 text-rose-200' : 'bg-white/5 border-white/5 text-white/35'}`}>
                {matrix.Setosa.Versicolor}
              </div>
              {/* Setosa -> Virginica */}
              <div className={`p-2 rounded font-mono text-xs font-bold border ${matrix.Setosa.Virginica > 0 ? 'bg-rose-500/20 border-rose-500/35 text-rose-200' : 'bg-white/5 border-white/5 text-white/35'}`}>
                {matrix.Setosa.Virginica}
              </div>
            </div>

            {/* Versicolor Row */}
            <div className="grid grid-cols-4 gap-1 mt-1 text-center items-center">
              <span className="text-[9px] font-bold text-white/40 uppercase text-left font-mono" title="Actual Versicolor">Act Ver</span>
              {/* Versicolor -> Setosa */}
              <div className={`p-2 rounded font-mono text-xs font-bold border ${matrix.Versicolor.Setosa > 0 ? 'bg-rose-500/20 border-rose-500/35 text-rose-200' : 'bg-white/5 border-white/5 text-white/35'}`}>
                {matrix.Versicolor.Setosa}
              </div>
              {/* Versicolor -> Versicolor */}
              <div className={`p-2 rounded font-mono text-xs font-bold border ${matrix.Versicolor.Versicolor > 0 ? 'bg-cyan-500/20 border-cyan-500/35 text-cyan-200' : 'bg-white/5 border-white/5 text-white/35'}`}>
                {matrix.Versicolor.Versicolor}
              </div>
              {/* Versicolor -> Virginica */}
              <div className={`p-2 rounded font-mono text-xs font-bold border ${matrix.Versicolor.Virginica > 0 ? 'bg-rose-500/20 border-rose-500/35 text-rose-200' : 'bg-white/5 border-white/5 text-white/35'}`}>
                {matrix.Versicolor.Virginica}
              </div>
            </div>

            {/* Virginica Row */}
            <div className="grid grid-cols-4 gap-1 mt-1 text-center items-center">
              <span className="text-[9px] font-bold text-white/40 uppercase text-left font-mono" title="Actual Virginica">Act Virg</span>
              {/* Virginica -> Setosa */}
              <div className={`p-2 rounded font-mono text-xs font-bold border ${matrix.Virginica.Setosa > 0 ? 'bg-rose-500/20 border-rose-500/35 text-rose-200' : 'bg-white/5 border-white/5 text-white/35'}`}>
                {matrix.Virginica.Setosa}
              </div>
              {/* Virginica -> Versicolor */}
              <div className={`p-2 rounded font-mono text-xs font-bold border ${matrix.Virginica.Versicolor > 0 ? 'bg-rose-500/20 border-rose-500/35 text-rose-200' : 'bg-white/5 border-white/5 text-white/35'}`}>
                {matrix.Virginica.Versicolor}
              </div>
              {/* Virginica -> Virginica */}
              <div className={`p-2 rounded font-mono text-xs font-bold border ${matrix.Virginica.Virginica > 0 ? 'bg-cyan-500/20 border-cyan-500/35 text-cyan-200' : 'bg-white/5 border-white/5 text-white/35'}`}>
                {matrix.Virginica.Virginica}
              </div>
            </div>
          </div>

          {/* Slide 14: Accuracy Mirage warn card */}
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-2.5 text-[10px] text-white/70 leading-normal space-y-1">
            <span className="font-bold text-cyan-300 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Slide 14: Accuracy Mirage Rule
            </span>
            <p>
              Accuracy can be highly misleading in unbalanced datasets. To avoid accuracy blindspots, inspect individual Class indices in the focal lens.
            </p>
          </div>
        </div>

        {/* Center column (Col 4): Focus Class 2x2 representation */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/45 font-mono block">
              1-vs-All Diagnostic Lens
            </span>
            
            {/* Focal Class selection */}
            <div className="grid grid-cols-3 gap-1 bg-white/5 border border-white/10 p-0.5 rounded-lg text-[10px] font-bold">
              {['Setosa', 'Versicolor', 'Virginica'].map(cls => (
                <button
                  key={cls}
                  id={`focus-${cls}`}
                  onClick={() => setFocalClass(cls as any)}
                  className={`py-1 rounded-md transition-colors ${focalClass === cls ? 'bg-white/15 text-white border border-white/10 shadow' : 'text-white/50 hover:text-white'}`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Classic 4-quadrant slide 15 layout */}
          <div className="grid grid-cols-2 gap-1.5 text-center font-mono my-3.5 select-none">
            {/* True Positive */}
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-2.5 hover:bg-cyan-500/15 transition-all">
              <span className="text-[8px] text-cyan-200 font-bold block">True Positive (TP)</span>
              <span className="text-xl font-extrabold text-white">{metrics.tp}</span>
              <span className="text-[8px] text-cyan-300 block mt-0.5 font-sans">Correct Detection</span>
            </div>

            {/* False Positive (Type I False Alarm) */}
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 hover:bg-rose-500/15 transition-all">
              <span className="text-[8px] text-rose-200 font-bold block">False Positive (FP)</span>
              <span className="text-xl font-extrabold text-white">{metrics.fp}</span>
              <span className="text-[7.5px] text-rose-300 block mt-0.5 leading-none font-sans">Type I: False Alarm</span>
            </div>

            {/* False Negative (Type II Missed Detection) */}
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 hover:bg-rose-500/15 transition-all">
              <span className="text-[8px] text-rose-200 font-bold block">False Negative (FN)</span>
              <span className="text-xl font-extrabold text-white">{metrics.fn}</span>
              <span className="text-[7.5px] text-rose-300 block mt-0.5 leading-none font-sans">Type II: Missed Det</span>
            </div>

            {/* True Negative */}
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-2.5 hover:bg-cyan-500/15 transition-all">
              <span className="text-[8px] text-cyan-200 font-bold block">True Negative (TN)</span>
              <span className="text-xl font-extrabold text-white">{metrics.tn}</span>
              <span className="text-[8px] text-cyan-300 block mt-0.5 font-sans">Correct Rejection</span>
            </div>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono bg-white/5 p-3 rounded-lg border border-white/10">
            <div className="flex justify-between items-center text-[10px] text-white/40 font-semibold">
              <span>Overall Macro Summary</span>
              <span>Test Count: {testingSet.length}</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Pipeline Accuracy</span>
              <span className="font-bold text-cyan-300">{(overall.accuracy * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>Macro F1-Score</span>
              <span className="font-bold text-cyan-300">{(overall.f1Score * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Right column (Col 4): slide 16 strategic balancing scale */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 p-4 relative overflow-hidden min-h-[280px]">
          <div className="space-y-1.5 pb-2 border-b border-white/10">
            <span className="text-[10px] font-bold text-white/45 uppercase font-mono block">
              Slide 16 Weighted Balanced Scale
            </span>
            <p className="text-[10px] text-white/60 leading-normal font-sans">
              Observe Slide 16’s Precision-Recall trade-off. Choosing K changes the tilt.
            </p>
          </div>

          {/* Reactive Weighing-Scale Canvas simulation */}
          <div className="flex flex-col items-center justify-center py-4 relative flex-1">
            <svg viewBox="0 0 160 110" className="w-full max-w-[200px]" style={{ height: 'auto' }}>
              {/* Supporting triangle post */}
              <polygon points="80,50 74,95 86,95" fill="rgba(255,255,255,0.15)" />
              {/* Bottom base pedestal */}
              <rect x="64" y="94" width="32" height="6" rx="2" fill="rgba(255,255,255,0.25)" />
              
              {/* Center Fulcrum pivot pin (Harmonic Mean F1-Score) */}
              <circle cx="80" cy="50" r="4.5" fill="#22d3ee" stroke="#ffffff" strokeWidth="1" />
              
              {/* Tilting crossbeam beam of the scale */}
              <g style={{ transform: `rotate(${tiltAngle}deg)`, transformOrigin: '80px 50px', transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                {/* Horizontal scale support line */}
                <line x1="20" y1="50" x2="140" y2="50" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeLinecap="round" />
                
                {/* Left tray hanging assembly */}
                <line x1="25" y1="50" x2="25" y2="70" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                {/* Left physical tray */}
                <path d="M12,70 Q25,82 38,70" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                
                {/* Right tray hanging assembly */}
                <line x1="135" y1="50" x2="135" y2="70" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                {/* Right physical tray */}
                <path d="M122,70 Q135,82 148,70" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                
                {/* Visual weights labels */}
                {/* Left (Precision) weight */}
                <g transform="translate(18, 54)">
                  <rect x="0" y="0" width="14" height="15" rx="1.5" fill="#0891b2" />
                  <rect x="4" y="-3" width="6" height="3" fill="#06768e" />
                  <text x="7" y="10" textAnchor="middle" fill="#ffffff" className="text-[7.5px] font-mono font-bold">P</text>
                </g>

                {/* Right (Recall) weight */}
                <g transform="translate(128, 54)">
                  <rect x="0" y="0" width="14" height="15" rx="1.5" fill="#e11d48" />
                  <rect x="4" y="-3" width="6" height="3" fill="#be123c" />
                  <text x="7" y="10" textAnchor="middle" fill="#ffffff" className="text-[7.5px] font-mono font-bold">R</text>
                </g>
              </g>

              {/* Central fulcrum text anchor label (The F1 Fulcrum) */}
              <text x="80" y="40" textAnchor="middle" className="text-[8px] font-bold font-mono fill-cyan-300">
                F1 FULCRUM
              </text>
            </svg>
          </div>

          {/* Trade-off scorecard */}
          <div className="grid grid-cols-3 gap-1 text-center text-xs mt-auto font-mono">
            {/* Precision metrics */}
            <div className="bg-cyan-500/15 border border-cyan-500/25 p-1.5 rounded">
              <span className="text-[8px] text-cyan-300 uppercase font-bold block">Precision</span>
              <span className="font-extrabold text-white">{(metrics.precision * 100).toFixed(0)}%</span>
            </div>

            {/* F1 Score metrics */}
            <div className="bg-purple-500/15 border border-purple-500/25 p-1.5 rounded">
              <span className="text-[8px] text-purple-300 uppercase font-bold block">F1 Value</span>
              <span className="font-extrabold text-white">{(metrics.f1Score * 100).toFixed(0)}%</span>
            </div>

            {/* Recall metrics */}
            <div className="bg-rose-500/15 border border-rose-500/25 p-1.5 rounded">
              <span className="text-[8px] text-rose-300 uppercase font-bold block">Recall</span>
              <span className="font-extrabold text-white">{(metrics.recall * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
