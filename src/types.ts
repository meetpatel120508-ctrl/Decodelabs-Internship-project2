export type FeatureName = 'sepalLength' | 'sepalWidth' | 'petalLength' | 'petalWidth';

export interface IrisSample {
  id: number;
  sepalLength: number;
  sepalWidth: number;
  petalLength: number;
  petalWidth: number;
  species: 'Setosa' | 'Versicolor' | 'Virginica';
}

export type ScaledFeature = {
  sepalLength: number;
  sepalWidth: number;
  petalLength: number;
  petalWidth: number;
};

export interface TrainTestSplit {
  train: IrisSample[];
  test: IrisSample[];
}

export interface MetricSummary {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

export interface ClassMetrics {
  species: 'Setosa' | 'Versicolor' | 'Virginica';
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  precision: number;
  recall: number;
  f1Score: number;
}

export interface ConfusionMatrix {
  // Rows: Actual, Columns: Predicted
  // Setosa, Versicolor, Virginica
  matrix: {
    Setosa: { Setosa: number; Versicolor: number; Virginica: number };
    Versicolor: { Setosa: number; Versicolor: number; Virginica: number };
    Virginica: { Setosa: number; Versicolor: number; Virginica: number };
  };
}
