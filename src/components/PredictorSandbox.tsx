import { useState } from 'react';
import { IrisSample } from '../types';
import { predictKNN, fitScaler, ScaleParams } from '../utils/mathHelpers';
import { Sliders, HelpCircle, Check, Sparkles, Scale } from 'lucide-react';

interface PredictorSandboxProps {
  trainingSet: IrisSample[];
  k: number;
  useScaling: boolean;
  scalerParams?: ScaleParams;
}

export default function PredictorSandbox({
  trainingSet,
  k,
  useScaling,
  scalerParams
}: PredictorSandboxProps) {
  // Controlled slide inputs based on natural Iris benchmarks
  const [sepalLength, setSepalLength] = useState<number>(5.8);
  const [sepalWidth, setSepalWidth] = useState<number>(3.0);
  const [petalLength, setPetalLength] = useState<number>(4.35);
  const [petalWidth, setPetalWidth] = useState<number>(1.3);

  // Compute scaler on the fly if needed (fallback if not provided)
  const activeScalerParams = scalerParams || fitScaler(trainingSet);

  const querySample = {
    sepalLength,
    sepalWidth,
    petalLength,
    petalWidth
  };

  // Run the classification model on user inputs
  const result = predictKNN(querySample, trainingSet, k, useScaling, activeScalerParams);

  // Matching themes for species to be fully frosted and glowing
  const speciesThemes = {
    Setosa: {
      bg: 'backdrop-blur-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-300/10',
      text: 'text-cyan-300',
      pill: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]',
      trail: 'bg-white/5 border border-white/10',
      accent: '#22d3ee'
    },
    Versicolor: {
      bg: 'backdrop-blur-md bg-purple-500/15 border border-purple-500/30 text-purple-300 shadow-lg shadow-purple-300/10',
      text: 'text-purple-300',
      pill: 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]',
      trail: 'bg-white/5 border border-white/10',
      accent: '#c084fc'
    },
    Virginica: {
      bg: 'backdrop-blur-md bg-rose-500/15 border border-rose-500/30 text-rose-300 shadow-lg shadow-rose-300/10',
      text: 'text-rose-300',
      pill: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
      trail: 'bg-white/5 border border-white/10',
      accent: '#f43f5e'
    }
  };

  // Helper to format scaled value display
  const getScaledValue = (val: number, mean: number, std: number) => {
    const scaled = (val - mean) / std;
    return `${scaled >= 0 ? '+' : ''}${scaled.toFixed(2)}`;
  };

  return (
    <div id="sandbox-container" className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-5 flex flex-col h-full text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1 px-1.5 rounded-md bg-white/10 text-cyan-300 border border-white/10">
            <Sliders className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold tracking-tight text-white font-display">
            Sandbox Playground Predictor
          </h2>
        </div>
        <span className="text-xs bg-white/10 px-2.5 py-0.5 rounded text-cyan-300 border border-white/10 font-mono">
          Live KNN (K={k})
        </span>
      </div>

      <p className="text-xs text-white/70 mb-4 leading-relaxed">
        Simulate custom testing values to observe the immediate effect of supervised classification, neighbor proximity, and scaling rules.
      </p>

      {/* Inputs Section */}
      <div className="space-y-4 mb-5">
        {/* Sepal Length Slider */}
        <div className="space-y-1.5 bg-white/5 p-2.5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between text-xs font-semibold text-white/80">
            <span>Sepal Length</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-white font-bold">{sepalLength.toFixed(1)} cm</span>
              {useScaling && (
                <span className="text-white/40 text-[10px]">
                  (Scaled: {getScaledValue(sepalLength, activeScalerParams.sepalLength.mean, activeScalerParams.sepalLength.std)})
                </span>
              )}
            </div>
          </div>
          <input
            id="sl-input"
            type="range"
            min="4.0"
            max="8.0"
            step="0.1"
            value={sepalLength}
            onChange={(e) => setSepalLength(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/15 rounded-lg cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Sepal Width Slider */}
        <div className="space-y-1.5 bg-white/5 p-2.5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between text-xs font-semibold text-white/80">
            <span>Sepal Width</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-white font-bold">{sepalWidth.toFixed(1)} cm</span>
              {useScaling && (
                <span className="text-white/40 text-[10px]">
                  (Scaled: {getScaledValue(sepalWidth, activeScalerParams.sepalWidth.mean, activeScalerParams.sepalWidth.std)})
                </span>
              )}
            </div>
          </div>
          <input
            id="sw-input"
            type="range"
            min="2.0"
            max="4.5"
            step="0.1"
            value={sepalWidth}
            onChange={(e) => setSepalWidth(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/15 rounded-lg cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Petal Length Slider */}
        <div className="space-y-1.5 bg-white/5 p-2.5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between text-xs font-semibold text-white/80">
            <span>Petal Length</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-white font-bold">{petalLength.toFixed(1)} cm</span>
              {useScaling && (
                <span className="text-white/40 text-[10px]">
                  (Scaled: {getScaledValue(petalLength, activeScalerParams.petalLength.mean, activeScalerParams.petalLength.std)})
                </span>
              )}
            </div>
          </div>
          <input
            id="pl-input"
            type="range"
            min="1.0"
            max="7.0"
            step="0.1"
            value={petalLength}
            onChange={(e) => setPetalLength(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/15 rounded-lg cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Petal Width Slider */}
        <div className="space-y-1.5 bg-white/5 p-2.5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between text-xs font-semibold text-white/80">
            <span>Petal Width</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-white font-bold">{petalWidth.toFixed(1)} cm</span>
              {useScaling && (
                <span className="text-white/40 text-[10px]">
                  (Scaled: {getScaledValue(petalWidth, activeScalerParams.petalWidth.mean, activeScalerParams.petalWidth.std)})
                </span>
              )}
            </div>
          </div>
          <input
            id="pw-input"
            type="range"
            min="0.1"
            max="2.5"
            step="0.1"
            value={petalWidth}
            onChange={(e) => setPetalWidth(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/15 rounded-lg cursor-pointer accent-cyan-400"
          />
        </div>
      </div>

      {/* Model Output Prediction Panel */}
      <div className={`p-4 rounded-xl border mb-5 transition-all text-center ${speciesThemes[result.predictedClass].bg}`}>
        <span className="text-[10px] uppercase tracking-wider font-semibold opacity-75 font-mono">
          Engine Classification Output
        </span>
        <div className="flex items-center justify-center gap-2 mt-1">
          <Sparkles className={`w-5 h-5 ${speciesThemes[result.predictedClass].text}`} />
          <h3 className={`text-xl font-bold font-display ${speciesThemes[result.predictedClass].text}`}>
            Iris {result.predictedClass}
          </h3>
        </div>
        <p className="text-[11px] text-white/70 mt-1">
          {result.probabilities[result.predictedClass] * 100}% majority vote among nearest $K$ points.
        </p>
      </div>

      {/* Probabilities Gauges */}
      <div className="space-y-3 mb-4 bg-white/5 p-3 rounded-lg border border-white/10">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-white/90">Neighbor Distribution</span>
          <span className="text-[10px] text-white/40 font-mono uppercase">Calculated Votes</span>
        </div>
        
        {/* Setosa */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-white/70">
            <span className="font-semibold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] block"></span> Setosa
            </span>
            <span className="font-mono text-white">{(result.probabilities.Setosa * 100).toFixed(0)}%</span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${speciesThemes.Setosa.trail}`}>
            <div className={`h-full ${speciesThemes.Setosa.pill}`} style={{ width: `${result.probabilities.Setosa * 100}%` }}></div>
          </div>
        </div>

        {/* Versicolor */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-white/70">
            <span className="font-semibold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_#a855f7] block"></span> Versicolor
            </span>
            <span className="font-mono text-white">{(result.probabilities.Versicolor * 100).toFixed(0)}%</span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${speciesThemes.Versicolor.trail}`}>
            <div className={`h-full ${speciesThemes.Versicolor.pill}`} style={{ width: `${result.probabilities.Versicolor * 100}%` }}></div>
          </div>
        </div>

        {/* Virginica */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-white/70">
            <span className="font-semibold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_#f43f5e] block"></span> Virginica
            </span>
            <span className="font-mono text-white">{(result.probabilities.Virginica * 100).toFixed(0)}%</span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${speciesThemes.Virginica.trail}`}>
            <div className={`h-full ${speciesThemes.Virginica.pill}`} style={{ width: `${result.probabilities.Virginica * 100}%` }}></div>
          </div>
        </div>
      </div>

      {/* Proximity / Nearest Neighbor Details */}
      <div className="mt-auto">
        <h4 className="text-[10px] uppercase font-bold tracking-wider text-white/40 mb-2 font-mono flex items-center justify-between">
          <span>Identified Closest $K={k}$ Points</span>
          <span>Proximity Principle</span>
        </h4>
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {result.neighbors.map((neighbor, idx) => {
            const speciesColor = speciesThemes[neighbor.sample.species].pill;
            const speciesText = speciesThemes[neighbor.sample.species].text;

            return (
              <div key={idx} className="flex items-center justify-between text-[10px] p-1.5 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full bg-white/10 font-mono flex items-center justify-center text-[8px] text-cyan-300 border border-white/10 font-bold`}>
                    {idx + 1}
                  </span>
                  <span className={`w-2.5 h-2.5 rounded-full ${speciesColor}`}></span>
                  <span className={`font-semibold ${speciesText}`}>Iris {neighbor.sample.species}</span>
                  <span className="text-white/40 text-[9px] font-mono">ID {neighbor.sample.id}</span>
                </div>
                <div className="font-mono text-white/70">
                  d = <span className="font-bold text-cyan-300">{neighbor.distance.toFixed(3)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
