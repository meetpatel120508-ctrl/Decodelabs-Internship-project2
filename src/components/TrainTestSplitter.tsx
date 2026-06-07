import { useState } from 'react';
import { IrisSample } from '../types';
import { seededShuffle } from '../utils/mathHelpers';
import { RefreshCw, LayoutGrid, HelpCircle, Shuffle, ShieldCheck } from 'lucide-react';

interface TrainTestSplitterProps {
  dataset: IrisSample[];
  trainRatio: number;
  setTrainRatio: (ratio: number) => void;
  shuffleSeed: number;
  setShuffleSeed: (seed: number) => void;
  shuffledData: IrisSample[];
  triggerShuffle: () => void;
}

export default function TrainTestSplitter({
  dataset,
  trainRatio,
  setTrainRatio,
  shuffleSeed,
  setShuffleSeed,
  shuffledData,
  triggerShuffle
}: TrainTestSplitterProps) {
  // Calculated split boundaries
  const totalCount = dataset.length;
  const trainCount = Math.round(totalCount * trainRatio);
  const testCount = totalCount - trainCount;

  // Species counter helper
  const countSpecies = (data: IrisSample[]) => {
    const counts = { Setosa: 0, Versicolor: 0, Virginica: 0 };
    data.forEach(d => {
      counts[d.species] += 1;
    });
    return counts;
  };

  const trainDataList = shuffledData.slice(0, trainCount);
  const testDataList = shuffledData.slice(trainCount);

  const trainSpeciesCounts = countSpecies(trainDataList);
  const testSpeciesCounts = countSpecies(testDataList);

  const colors = {
    Setosa: 'bg-cyan-500 border border-cyan-400/30 shadow-[0_0_8px_rgba(34,211,238,0.3)]',
    Versicolor: 'bg-purple-500 border border-purple-400/30 shadow-[0_0_8px_rgba(168,85,247,0.3)]',
    Virginica: 'bg-rose-500 border border-rose-400/30 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-5 flex flex-col h-full shadow-2xl rounded-2xl text-white">
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1 px-1.5 rounded-lg bg-white/10 text-cyan-300 border border-white/10">
            <Shuffle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-display">
              Step 2: Structural Integrity & Shuffled Train-Test Split
            </h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* Controls Column (Col 4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-white/45 font-mono block">
            Split Configuration Controls
          </span>

          {/* Ratio Slider */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-white/95">
              <span>Split Percentage</span>
              <span className="font-mono text-cyan-300">{Math.round(trainRatio * 100)}% / {Math.round((1 - trainRatio) * 100)}%</span>
            </div>
            <input
              id="split-ratio-range"
              type="range"
              min="0.5"
              max="0.9"
              step="0.05"
              value={trainRatio}
              onChange={(e) => setTrainRatio(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/15 rounded-lg cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[9px] text-white/40 font-mono">
              <span>50% Train (Balanced)</span>
              <span>90% Train</span>
            </div>
          </div>

          {/* Random Seed Shuffler */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/95">Order Shuffling Seed</span>
              <button
                id="btn-trigger-shuffle"
                onClick={triggerShuffle}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-[10px] font-mono transition-colors active:scale-95"
                title="Generate fresh random selection order"
              >
                <RefreshCw className="w-3 h-3 text-cyan-300 animate-spin-slow" />
                <span>Re-Shuffle</span>
              </button>
            </div>
            
            <input
              id="shuffle-seed-input"
              type="number"
              value={shuffleSeed}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setShuffleSeed(val);
              }}
              className="w-full text-xs p-2 rounded-lg border border-white/15 bg-white/5 text-white font-mono outline-none focus:border-cyan-400/50"
              placeholder="E.g. 42"
            />
            
            <p className="text-[10px] text-white/60 leading-normal">
              Iris rows are grouped by class in the database. Shuffling removes order bias before splitting, preventing the model from learning a skewed sequence. (Slide 10 target).
            </p>
          </div>

          {/* Dataset balance feedback */}
          <div className="mt-auto bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
            <span className="text-[9px] uppercase font-bold tracking-wider text-white/45 font-mono block">
              Species Dispersion Balance
            </span>
            <div className="space-y-1.5 text-[10px]">
              {/* Setosa Ratio */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white/70 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span> Setosa
                </span>
                <span className="font-mono text-white/50">
                  Train: <span className="font-bold text-cyan-300">{trainSpeciesCounts.Setosa}</span> | Test:{' '}
                  <span className="font-bold text-cyan-300">{testSpeciesCounts.Setosa}</span>
                </span>
              </div>
              {/* Versicolor Ratio */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white/70 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_6px_#a855f7]"></span> Versicolor
                </span>
                <span className="font-mono text-white/50">
                  Train: <span className="font-bold text-cyan-300">{trainSpeciesCounts.Versicolor}</span> | Test:{' '}
                  <span className="font-bold text-cyan-300">{testSpeciesCounts.Versicolor}</span>
                </span>
              </div>
              {/* Virginica Ratio */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white/70 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-450 shadow-[0_0_6px_#f43f5e]"></span> Virginica
                </span>
                <span className="font-mono text-white/50">
                  Train: <span className="font-bold text-cyan-300">{trainSpeciesCounts.Virginica}</span> | Test:{' '}
                  <span className="font-bold text-cyan-300">{testSpeciesCounts.Virginica}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Matrix of shuffled blocks (Col 8) */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 p-5">
          <div className="flex items-center justify-between text-xs text-white/40 font-mono mb-2 pb-2 border-b border-white/10">
            <span>Visual Shuffling Map</span>
            <span>Seed: {shuffleSeed}</span>
          </div>

          {/* Grid Layout Representing block splits */}
          <div className="grid grid-cols-10 gap-1 gap-y-1.5 my-auto max-h-[220px] overflow-y-auto p-1">
            {shuffledData.map((sample, idx) => {
              const originClass = sample.species;
              const belongsToTrain = idx < trainCount;
              
              return (
                <div
                  key={sample.id}
                  className={`relative p-1 rounded text-center font-mono text-[8.5px] font-bold text-white transition-all duration-300 ${belongsToTrain ? colors[originClass] : 'bg-white/5 border border-white/5 text-white/30 opacity-40'}`}
                  title={`ID #${sample.id} - Iris ${sample.species}`}
                >
                  {sample.id}
                  {/* Subtle lock representing locked validating state */}
                  {!belongsToTrain && (
                    <span className="absolute -top-1 -right-1 bg-white/20 backdrop-blur-md rounded-full p-[2px] text-[6px] border border-white/10 shadow-md">
                      🔒
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Visual Brackets Legend representing the Split */}
          <div className="flex items-stretch justify-between gap-3 mt-4 pt-3 border-t border-white/10 text-xs text-white/80">
            <div className="flex-1 bg-white/5 p-3 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] font-bold font-mono text-cyan-300 uppercase tracking-wide block mb-1">
                🔬 Training Set
              </span>
              <div className="font-semibold text-lg text-white">{trainCount} Samples</div>
              <span className="text-[10px] text-white/40">Memorizes feature mappings</span>
            </div>
            
            <div className="flex-1 bg-white/5 p-3 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] font-bold font-mono text-indigo-300 uppercase tracking-wide block mb-1">
                🔒 Testing Set
              </span>
              <div className="font-semibold text-lg text-white">{testCount} Samples</div>
              <span className="text-[10px] text-white/40">Validates model precision</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
