import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IRIS_DATASET } from './data/iris';
import { seededShuffle, fitScaler } from './utils/mathHelpers';
import DatasetExplorer from './components/DatasetExplorer';
import TrainTestSplitter from './components/TrainTestSplitter';
import KNNEngine from './components/KNNEngine';
import ElbowCurveTuner from './components/ElbowCurveTuner';
import Diagnostics from './components/Diagnostics';
import PredictorSandbox from './components/PredictorSandbox';
import { 
  Sparkles, 
  HelpCircle, 
  ChevronRight, 
  Layers, 
  Shuffle, 
  TrendingDown, 
  BarChart3, 
  Sliders, 
  Cpu, 
  BookOpen, 
  RefreshCw,
  Scale
} from 'lucide-react';

export default function App() {
  // Global Pipeline State
  const [useScaling, setUseScaling] = useState<boolean>(true);
  const [trainRatio, setTrainRatio] = useState<number>(0.8);
  const [shuffleSeed, setShuffleSeed] = useState<number>(42);
  const [k, setK] = useState<number>(5);
  
  // Custom tracking tab representing progress in slide 7 Framework
  const [activeTab, setActiveTab] = useState<'step1' | 'step2' | 'step3' | 'step4' | 'step5'>('step1');

  // Trigger shuffle based on shuffleSeed
  const shuffledData = useMemo(() => {
    return seededShuffle(IRIS_DATASET, shuffleSeed);
  }, [shuffleSeed]);

  // Derive train-test splits from ratio
  const trainCount = Math.round(shuffledData.length * trainRatio);
  const trainingSet = useMemo(() => shuffledData.slice(0, trainCount), [shuffledData, trainCount]);
  const testingSet = useMemo(() => shuffledData.slice(trainCount), [shuffledData, trainCount]);

  // Shared statistics scaler parameters
  const scalerParams = useMemo(() => {
    return fitScaler(trainingSet);
  }, [trainingSet]);

  const triggerShuffle = () => {
    // Generate a fresh random integer seed [1, 100]
    const nextSeed = Math.floor(Math.random() * 100) + 1;
    setShuffleSeed(nextSeed);
  };

  // Setup visual navigation
  const visualSteps = [
    { id: 'step1', num: '1', title: 'Iris Domain & Scaler', icon: Layers, desc: 'Input' },
    { id: 'step2', num: '2', title: 'Train-Test Split', icon: Shuffle, desc: 'Process' },
    { id: 'step3', num: '3', title: 'KNN Neighborhood', icon: Sliders, desc: 'Process' },
    { id: 'step4', num: '4', title: 'The Elbow Curve', icon: TrendingDown, desc: 'Process' },
    { id: 'step5', num: '5', title: 'Trade-offs & Metrics', icon: BarChart3, desc: 'Output' },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-rose-950 text-white pb-12 font-sans selection:bg-rose-500/30 selection:text-white">
      {/* Top Professional Header Row */}
      <header className="backdrop-blur-xl bg-white/10 border-b border-white/10 sticky top-0 z-40 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Slogan badge */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-cyan-400 to-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/30">
              <Cpu className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-white/15 text-white/90 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono border border-white/10">
                  DecodeLabs
                </span>
                <span className="text-[10px] text-cyan-300 font-bold bg-cyan-500/20 px-1.5 py-0.5 rounded font-mono border border-cyan-500/30">
                  Batch 2026
                </span>
              </div>
              <h1 className="text-base font-bold text-white font-display tracking-tight leading-none mt-1">
                AI Data Classifier <span className="text-white/60 font-normal">| Industrial Training Kit</span>
              </h1>
            </div>
          </div>

          {/* Quick Setup Global Panel */}
          <div className="flex items-center gap-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-1.5 px-3">
            <div className="flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-cyan-300" />
              <span className="text-xs font-semibold text-white/90">Global Scaler Enablement</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                id="global-scaling-toggle"
                type="checkbox"
                checked={useScaling}
                onChange={() => setUseScaling(!useScaling)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-400"></div>
            </label>
            <span className="text-[10px] font-mono text-cyan-300 font-bold w-12 text-center">
              {useScaling ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>

        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
        
        {/* Quick Theory Instruction Card */}
        <div id="theory-summary-card" className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20 shadow-2xl mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <BookOpen className="w-64 h-64 text-white" />
          </div>
          
          <div className="flex items-start gap-3.5 relative z-10">
            <div className="p-2.5 rounded-lg bg-white/10 border border-white/10 text-cyan-300 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold text-cyan-300 tracking-wider">
                Project 2 Milestone Overview
              </span>
              <h2 className="text-lg font-bold font-display tracking-tight leading-snug text-white">
                Data Classification Using Algorithmic Supervised Learning
              </h2>
              <p className="text-xs text-white/70 max-w-4xl leading-relaxed">
                Step into the role of an AI Engineer. Explore feature space anomalies, configure standard scaling thresholds, perform randomized validation splits, and master the proximity-voting dynamics behind the legendary K-Nearest Neighbors Classifier.
              </p>
            </div>
          </div>
        </div>

        {/* 2-Pane Split Grid Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT-HAND COLUMN (lg:col-span-4): The constant interactive test sandbox */}
          <div className="lg:col-span-4 lg:sticky lg:top-[74px] space-y-6">
            <PredictorSandbox 
              trainingSet={trainingSet} 
              k={k} 
              useScaling={useScaling}
              scalerParams={scalerParams}
            />

            {/* Quick documentation checklist card */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-5 space-y-3 shadow-2xl text-xs text-white/70">
              <span className="font-bold text-white block text-sm border-b border-white/15 pb-2">
                🎓 Qualification Roadmap
              </span>
              <ul className="space-y-2">
                <li className="flex gap-2 items-start text-white/80">
                  <span className="w-4 h-4 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 font-mono flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <span className="font-semibold text-white">Input Phase:</span> Standardize ranges with Mean = 0, Variance = 1 to stabilize geometry.
                  </div>
                </li>
                <li className="flex gap-2 items-start text-white/80">
                  <span className="w-4 h-4 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 font-mono flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <span className="font-semibold text-white">Split Validation:</span> Partition 80/20 data to prevent memorization leakage.
                  </div>
                </li>
                <li className="flex gap-2 items-start text-white/80">
                  <span className="w-4 h-4 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 font-mono flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <span className="font-semibold text-white">Neighborhood Vote:</span> Pick optimal $K$ values at the error curve elbow.
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* RIGHT-HAND COLUMN (lg:col-span-8): Progressive Pipeline Multi-tabs */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Step Selection Navigation bar */}
            <nav id="pipeline-nav" className="flex overflow-x-auto gap-2 backdrop-blur-xl bg-white/5 p-2 rounded-xl border border-white/10 shadow-lg scrollbar-thin">
              {visualSteps.map((step) => {
                const Icon = step.icon;
                const isActive = activeTab === step.id;

                return (
                  <button
                    key={step.id}
                    id={`nav-${step.id}`}
                    onClick={() => setActiveTab(step.id)}
                    className={`flex-1 min-w-[130px] flex items-center gap-2.5 p-2 px-3 rounded-lg text-left transition-all relative ${isActive ? 'bg-white/10 border-white/20 text-white shadow-xl' : 'hover:bg-white/5 border border-transparent text-white/60 hover:text-white'}`}
                  >
                    <div className={`p-1.5 rounded-md ${isActive ? 'bg-cyan-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-mono tracking-wider font-bold opacity-60">
                        {step.desc} (Step {step.num})
                      </div>
                      <div className="text-xs font-bold font-display truncate">
                        {step.title}
                      </div>
                    </div>
                    {isActive && (
                      <motion.div 
                      layoutId="active-indicator" 
                      className="absolute bottom-0 left-4 right-4 h-0.5 bg-cyan-400" 
                    />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Inner dynamic content body containing current active Stage */}
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                  className="w-full"
                >
                  {activeTab === 'step1' && (
                    <DatasetExplorer dataset={IRIS_DATASET} />
                  )}

                  {activeTab === 'step2' && (
                    <TrainTestSplitter
                      dataset={IRIS_DATASET}
                      trainRatio={trainRatio}
                      setTrainRatio={setTrainRatio}
                      shuffleSeed={shuffleSeed}
                      setShuffleSeed={setShuffleSeed}
                      shuffledData={shuffledData}
                      triggerShuffle={triggerShuffle}
                    />
                  )}

                  {activeTab === 'step3' && (
                    <KNNEngine
                      trainingSet={trainingSet}
                      k={k}
                      setK={setK}
                      useScaling={useScaling}
                    />
                  )}

                  {activeTab === 'step4' && (
                    <ElbowCurveTuner
                      trainingSet={trainingSet}
                      testingSet={testingSet}
                      k={k}
                      setK={setK}
                      useScaling={useScaling}
                    />
                  )}

                  {activeTab === 'step5' && (
                    <Diagnostics
                      trainingSet={trainingSet}
                      testingSet={testingSet}
                      k={k}
                      useScaling={useScaling}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Step navigation bottom buttons trail */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs">
              <span className="text-white/40 font-mono font-medium">
                Industrial Training Pipeline Framework
              </span>

              <div className="flex gap-2">
                {activeTab !== 'step1' && (
                  <button
                    id="prev-btn"
                    onClick={() => {
                      const idx = visualSteps.findIndex(s => s.id === activeTab);
                      setActiveTab(visualSteps[idx - 1].id);
                    }}
                    className="px-3 py-1.5 border border-white/15 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/15 font-medium active:scale-95 transition-all"
                  >
                    Back
                  </button>
                )}
                {activeTab !== 'step5' && (
                  <button
                    id="next-btn"
                    onClick={() => {
                      const idx = visualSteps.findIndex(s => s.id === activeTab);
                      setActiveTab(visualSteps[idx + 1].id);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg shadow-lg shadow-indigo-500/30 font-bold active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    Next Step <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
