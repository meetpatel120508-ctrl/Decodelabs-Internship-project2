import { IrisSample, ScaledFeature, ConfusionMatrix, ClassMetrics, MetricSummary } from '../types';

// Pseudo-random number generator for reproducible seed-based shuffles
export function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

// Reproducible shuffle
export function seededShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  const rand = mulberry32(seed);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Calculate mean and standard deviation for each feature
export interface ScaleParams {
  sepalLength: { mean: number; std: number };
  sepalWidth: { mean: number; std: number };
  petalLength: { mean: number; std: number };
  petalWidth: { mean: number; std: number };
}

export function fitScaler(trainingData: IrisSample[]): ScaleParams {
  const features: Array<keyof ScaleParams> = ['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'];
  const params: Partial<ScaleParams> = {};

  for (const f of features) {
    const values = trainingData.map(d => d[f]);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    
    // Sample variance (or population version; let's use standard std dev)
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance) || 1; // Safeguard division by zero

    params[f] = { mean, std };
  }

  return params as ScaleParams;
}

export function applyScale(sample: Omit<IrisSample, 'species' | 'id'>, params: ScaleParams): ScaledFeature {
  return {
    sepalLength: (sample.sepalLength - params.sepalLength.mean) / params.sepalLength.std,
    sepalWidth: (sample.sepalWidth - params.sepalWidth.mean) / params.sepalWidth.std,
    petalLength: (sample.petalLength - params.petalLength.mean) / params.petalLength.std,
    petalWidth: (sample.petalWidth - params.petalWidth.mean) / params.petalWidth.std,
  };
}

// Distance computation: raw or standard scaled
export function euclideanDistance(
  a: Omit<IrisSample, 'species' | 'id'>,
  b: Omit<IrisSample, 'species' | 'id'>,
  useScaling: boolean,
  scalerParams?: ScaleParams
): number {
  if (useScaling && scalerParams) {
    const sa = applyScale(a, scalerParams);
    const sb = applyScale(b, scalerParams);
    return Math.sqrt(
      Math.pow(sa.sepalLength - sb.sepalLength, 2) +
      Math.pow(sa.sepalWidth - sb.sepalWidth, 2) +
      Math.pow(sa.petalLength - sb.petalLength, 2) +
      Math.pow(sa.petalWidth - sb.petalWidth, 2)
    );
  } else {
    return Math.sqrt(
      Math.pow(a.sepalLength - b.sepalLength, 2) +
      Math.pow(a.sepalWidth - b.sepalWidth, 2) +
      Math.pow(a.petalLength - b.petalLength, 2) +
      Math.pow(a.petalWidth - b.petalWidth, 2)
    );
  }
}

// KNN Prediction Output format
export interface KNNPrediction {
  predictedClass: 'Setosa' | 'Versicolor' | 'Virginica';
  neighbors: Array<{
    sample: IrisSample;
    distance: number;
    weight: number;
  }>;
  probabilities: {
    Setosa: number;
    Versicolor: number;
    Virginica: number;
  };
}

// Find closest neighbors and predict species
export function predictKNN(
  query: Omit<IrisSample, 'species' | 'id'>,
  trainingSet: IrisSample[],
  k: number,
  useScaling: boolean,
  scalerParams?: ScaleParams
): KNNPrediction {
  // 1. Calculate distances from query to all training records
  const calculated = trainingSet.map(trainRecord => {
    const dist = euclideanDistance(query, trainRecord, useScaling, scalerParams);
    return { sample: trainRecord, distance: dist };
  });

  // 2. Sort by distance ascending
  calculated.sort((a, b) => a.distance - b.distance);

  // 3. Keep first K neighbors
  const topK = calculated.slice(0, Math.max(1, k));

  // 4. Multi-class voting count
  const votes = { Setosa: 0, Versicolor: 0, Virginica: 0 };
  topK.forEach(neighbor => {
    votes[neighbor.sample.species] += 1;
  });

  // Calculate vote percentages / probabilities
  const totalVotes = topK.length;
  const probabilities = {
    Setosa: votes.Setosa / totalVotes,
    Versicolor: votes.Versicolor / totalVotes,
    Virginica: votes.Virginica / totalVotes,
  };

  // Determine predicted class based on maximum votes.
  // In case of a tie, choose the class that has the smaller average distance in topK neighbors.
  let predictedClass: 'Setosa' | 'Versicolor' | 'Virginica' = 'Setosa';
  let maxVotes = -1;

  const speciesList: Array<'Setosa' | 'Versicolor' | 'Virginica'> = ['Setosa', 'Versicolor', 'Virginica'];
  speciesList.forEach(sp => {
    const voteCount = votes[sp];
    if (voteCount > maxVotes) {
      maxVotes = voteCount;
      predictedClass = sp;
    } else if (voteCount === maxVotes && voteCount > 0) {
      // Tie breaker logic: compute average distance for each of the tied classes in the neighbors list
      const avgDistSp = topK.filter(n => n.sample.species === sp).reduce((sum, n) => sum + n.distance, 0) / voteCount;
      const avgDistPred = topK.filter(n => n.sample.species === predictedClass).reduce((sum, n) => sum + n.distance, 0) / maxVotes;
      if (avgDistSp < avgDistPred) {
        predictedClass = sp;
      }
    }
  });

  return {
    predictedClass,
    neighbors: topK.map(n => ({
      sample: n.sample,
      distance: n.distance,
      weight: n.distance === 0 ? 1 : 1 / n.distance
    })),
    probabilities
  };
}

// Compute comprehensive Confusion Matrix and class metrics
export function evaluateModel(
  trainingSet: IrisSample[],
  testingSet: IrisSample[],
  k: number,
  useScaling: boolean
): {
  confusionMatrix: ConfusionMatrix;
  overallMetrics: MetricSummary;
  classMetrics: {
    Setosa: ClassMetrics;
    Versicolor: ClassMetrics;
    Virginica: ClassMetrics;
  };
  predictions: Array<{ sample: IrisSample; predicted: 'Setosa' | 'Versicolor' | 'Virginica' }>;
} {
  const scalerParams = useScaling ? fitScaler(trainingSet) : undefined;

  // Actual - Rows, Columns - Predicted
  const matrix: ConfusionMatrix['matrix'] = {
    Setosa: { Setosa: 0, Versicolor: 0, Virginica: 0 },
    Versicolor: { Setosa: 0, Versicolor: 0, Virginica: 0 },
    Virginica: { Setosa: 0, Versicolor: 0, Virginica: 0 },
  };

  const predictionsList: Array<{ sample: IrisSample; predicted: 'Setosa' | 'Versicolor' | 'Virginica' }> = [];
  let correctCount = 0;

  testingSet.forEach(sample => {
    const query = {
      sepalLength: sample.sepalLength,
      sepalWidth: sample.sepalWidth,
      petalLength: sample.petalLength,
      petalWidth: sample.petalWidth,
    };
    const predResult = predictKNN(query, trainingSet, k, useScaling, scalerParams);
    
    matrix[sample.species][predResult.predictedClass] += 1;
    predictionsList.push({ sample, predicted: predResult.predictedClass });

    if (sample.species === predResult.predictedClass) {
      correctCount++;
    }
  });

  const overallAccuracy = testingSet.length > 0 ? correctCount / testingSet.length : 0;

  // Class metrics: One vs Rest
  const classes: Array<'Setosa' | 'Versicolor' | 'Virginica'> = ['Setosa', 'Versicolor', 'Virginica'];
  const metricsResult: Partial<Record<'Setosa' | 'Versicolor' | 'Virginica', ClassMetrics>> = {};

  classes.forEach(currentClass => {
    // True Positive: Actual is currentClass, Predicted is currentClass
    const tp = matrix[currentClass][currentClass];
    
    // False Positive: Actual is NOT currentClass, Predicted is currentClass
    let fp = 0;
    classes.forEach(actualSp => {
      if (actualSp !== currentClass) {
        fp += matrix[actualSp][currentClass];
      }
    });

    // False Negative: Actual is currentClass, Predicted is NOT currentClass
    let fn = 0;
    classes.forEach(predSp => {
      if (predSp !== currentClass) {
        fn += matrix[currentClass][predSp];
      }
    });

    // True Negative: Actual is NOT currentClass, Predicted is NOT currentClass
    let tn = 0;
    classes.forEach(actualSp => {
      if (actualSp !== currentClass) {
        classes.forEach(predSp => {
          if (predSp !== currentClass) {
            tn += matrix[actualSp][predSp];
          }
        });
      }
    });

    const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
    const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
    const f1Score = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    metricsResult[currentClass] = {
      species: currentClass,
      tp, fp, fn, tn,
      precision, recall, f1Score
    };
  });

  // Balanced overall averages (macro metrics)
  const avgPrecision = (metricsResult.Setosa!.precision + metricsResult.Versicolor!.precision + metricsResult.Virginica!.precision) / 3;
  const avgRecall = (metricsResult.Setosa!.recall + metricsResult.Versicolor!.recall + metricsResult.Virginica!.recall) / 3;
  const avgF1 = (metricsResult.Setosa!.f1Score + metricsResult.Versicolor!.f1Score + metricsResult.Virginica!.f1Score) / 3;

  return {
    confusionMatrix: { matrix },
    overallMetrics: {
      accuracy: overallAccuracy,
      precision: avgPrecision,
      recall: avgRecall,
      f1Score: avgF1,
    },
    classMetrics: metricsResult as { Setosa: ClassMetrics; Versicolor: ClassMetrics; Virginica: ClassMetrics },
    predictions: predictionsList,
  };
}

// Generate the "Elbow Curve" data: Error Rate vs K (from K=1 to K=25)
export interface ElbowPoint {
  k: number;
  errorRate: number;
  accuracy: number;
}

export function computeElbowCurve(
  trainingSet: IrisSample[],
  testingSet: IrisSample[],
  useScaling: boolean
): ElbowPoint[] {
  const maxK = Math.min(25, trainingSet.length);
  const curve: ElbowPoint[] = [];

  for (let k = 1; k <= maxK; k++) {
    const evalData = evaluateModel(trainingSet, testingSet, k, useScaling);
    const errorRate = 1 - evalData.overallMetrics.accuracy;
    curve.push({
      k,
      errorRate,
      accuracy: evalData.overallMetrics.accuracy,
    });
  }

  return curve;
}
