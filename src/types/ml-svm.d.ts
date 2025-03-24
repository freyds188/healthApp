declare module 'ml-svm' {
  interface SVMOptions {
    kernel?: 'linear' | 'polynomial' | 'rbf' | 'sigmoid';
    gamma?: number;
    coef0?: number;
    degree?: number;
    C?: number;
    tolerance?: number;
    maxPasses?: number;
    random?: number;
    quiet?: boolean;
  }

  class SVM {
    constructor(options?: SVMOptions);
    train(features: number[][], labels: number[]): void;
    predict(features: number[][]): number[];
  }

  export default SVM;
} 