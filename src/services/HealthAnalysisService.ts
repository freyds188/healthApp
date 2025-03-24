import SVM from 'ml-svm';

export type HealthData = {
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  oxygenLevel: number;
  temperature: number;
};

export type HealthStatus = 'normal' | 'warning' | 'critical';

// Normal ranges for health metrics - Updated with more precise clinical thresholds
const NORMAL_RANGES = {
  heartRate: { min: 60, max: 100 },
  // Updated blood pressure categories based on medical guidelines
  bloodPressureSystolic: { min: 90, max: 129 }, // Normal to elevated
  bloodPressureDiastolic: { min: 60, max: 84 }, // Normal to elevated
  oxygenLevel: { min: 95, max: 100 },
  temperature: { min: 36.1, max: 37.2 },
};

// Critical thresholds for immediate medical attention
const CRITICAL_THRESHOLDS = {
  bloodPressureSystolic: { min: 70, max: 180 }, // Hypotension or hypertensive crisis
  bloodPressureDiastolic: { min: 40, max: 120 }, // Hypotension or hypertensive crisis
  heartRate: { min: 40, max: 140 }, // Bradycardia or tachycardia
  oxygenLevel: { min: 90, max: 100 }, // Below 90 is concerning
  temperature: { min: 35, max: 38.5 }, // Hypothermia or significant fever
};

// Enhanced sample training data with more varied cases
const TRAINING_DATA = [
  // Normal data points [HR, BPS, BPD, O2, Temp]
  [70, 110, 70, 98, 36.6],
  [75, 115, 75, 99, 36.8],
  [65, 105, 65, 97, 36.5],
  [80, 118, 76, 98, 36.9],
  [90, 125, 82, 96, 37.1],
  
  // Warning data points
  [105, 135, 85, 94, 37.5],
  [55, 85, 55, 94, 35.9],
  [95, 142, 88, 93, 37.6],
  [110, 145, 92, 94, 37.8],
  [85, 150, 95, 95, 37.7],
  
  // Critical data points
  [120, 160, 100, 91, 38.2],
  [45, 80, 50, 89, 35.5],
  [130, 170, 105, 88, 38.5],
  [50, 75, 45, 87, 35.0],
  [115, 180, 110, 86, 38.8],
  [80, 190, 100, 90, 38.0]
];

// Labels for training data: 0 = normal, 1 = warning, 2 = critical
const TRAINING_LABELS = [
  0, 0, 0, 0, 0,  // Normal
  1, 1, 1, 1, 1,  // Warning
  2, 2, 2, 2, 2, 2  // Critical
];

class HealthAnalysisService {
  private svm: any;
  private trained: boolean = false;

  constructor() {
    this.initializeModel();
  }

  private initializeModel(): void {
    const options = {
      kernel: 'rbf' as 'rbf',
      gamma: 0.5,
      C: 1,
      quiet: true
    };
    
    this.svm = new SVM(options);
    this.trainModel();
  }

  private trainModel(): void {
    try {
      this.svm.train(TRAINING_DATA, TRAINING_LABELS);
      this.trained = true;
      console.log('SVM model trained successfully');
    } catch (error) {
      console.error('Error training SVM model:', error);
    }
  }

  /**
   * Analyze health data using the SVM model
   * @param data Health data to analyze
   * @returns Status classification and detailed analysis
   */
  public analyzeHealthData(data: HealthData): { 
    status: HealthStatus, 
    analysis: string,
    metrics: {[key: string]: {value: number, status: HealthStatus}} 
  } {
    // Validate the model is trained
    if (!this.trained) {
      this.trainModel();
    }

    // Convert health data to feature array
    const features = [
      data.heartRate,
      data.bloodPressureSystolic,
      data.bloodPressureDiastolic,
      data.oxygenLevel,
      data.temperature
    ];

    // Analyze individual metrics first (this is separate from SVM prediction)
    const metricAnalysis = this.analyzeIndividualMetrics(data);
    
    // Check for any critical metrics before doing SVM prediction
    const hasCriticalMetrics = Object.values(metricAnalysis).some(metric => metric.status === 'critical');
    
    // Get SVM prediction (as a backup)
    let prediction: number = 0;
    try {
      prediction = this.svm.predict([features])[0];
    } catch (error) {
      console.error('Error predicting with SVM:', error);
    }

    // Determine final status - give priority to individual critical metrics
    let status: HealthStatus;
    if (hasCriticalMetrics) {
      status = 'critical';
    } else {
      // Use SVM prediction as a guide
      status = this.mapPredictionToStatus(prediction);
      
      // Override with the most severe individual metric if it's worse than SVM prediction
      const worstIndividualStatus = this.getWorstMetricStatus(metricAnalysis);
      if (this.isMorSevere(worstIndividualStatus, status)) {
        status = worstIndividualStatus;
      }
    }
    
    // Generate detailed analysis message
    const analysis = this.generateAnalysisMessage(status, metricAnalysis, data);

    return {
      status,
      analysis,
      metrics: metricAnalysis
    };
  }

  private isMorSevere(status1: HealthStatus, status2: HealthStatus): boolean {
    const severity = {
      'normal': 0,
      'warning': 1,
      'critical': 2
    };
    return severity[status1] > severity[status2];
  }

  private getWorstMetricStatus(metrics: {[key: string]: {value: number, status: HealthStatus}}): HealthStatus {
    let worstStatus: HealthStatus = 'normal';
    
    for (const metric of Object.values(metrics)) {
      if (metric.status === 'critical') return 'critical';
      if (metric.status === 'warning') worstStatus = 'warning';
    }
    
    return worstStatus;
  }

  private mapPredictionToStatus(prediction: number): HealthStatus {
    switch (prediction) {
      case 0: return 'normal';
      case 1: return 'warning';
      case 2: return 'critical';
      default: return 'normal';
    }
  }

  private analyzeIndividualMetrics(data: HealthData): {[key: string]: {value: number, status: HealthStatus}} {
    const result: {[key: string]: {value: number, status: HealthStatus}} = {};
    
    // Analyze heart rate
    result.heartRate = {
      value: data.heartRate,
      status: this.getMetricStatus(data.heartRate, NORMAL_RANGES.heartRate, CRITICAL_THRESHOLDS.heartRate)
    };
    
    // Analyze blood pressure systolic
    result.bloodPressureSystolic = {
      value: data.bloodPressureSystolic,
      status: this.getMetricStatus(data.bloodPressureSystolic, NORMAL_RANGES.bloodPressureSystolic, CRITICAL_THRESHOLDS.bloodPressureSystolic)
    };
    
    // Analyze blood pressure diastolic
    result.bloodPressureDiastolic = {
      value: data.bloodPressureDiastolic,
      status: this.getMetricStatus(data.bloodPressureDiastolic, NORMAL_RANGES.bloodPressureDiastolic, CRITICAL_THRESHOLDS.bloodPressureDiastolic)
    };
    
    // Analyze oxygen level
    result.oxygenLevel = {
      value: data.oxygenLevel,
      status: this.getMetricStatus(data.oxygenLevel, NORMAL_RANGES.oxygenLevel, CRITICAL_THRESHOLDS.oxygenLevel)
    };
    
    // Analyze temperature
    result.temperature = {
      value: data.temperature,
      status: this.getMetricStatus(data.temperature, NORMAL_RANGES.temperature, CRITICAL_THRESHOLDS.temperature)
    };
    
    return result;
  }

  private getMetricStatus(
    value: number, 
    normalRange: {min: number, max: number},
    criticalRange: {min: number, max: number}
  ): HealthStatus {
    // Check if it's in normal range
    if (value >= normalRange.min && value <= normalRange.max) {
      return 'normal';
    }
    
    // Check if it's outside critical range
    if (value < criticalRange.min || value > criticalRange.max) {
      return 'critical';
    }
    
    // If it's between normal and critical, it's a warning
    return 'warning';
  }

  private generateAnalysisMessage(
    overallStatus: HealthStatus, 
    metrics: {[key: string]: {value: number, status: HealthStatus}},
    data: HealthData
  ): string {
    let message = '';
    
    // Blood pressure analysis
    const bpSystolic = data.bloodPressureSystolic;
    const bpDiastolic = data.bloodPressureDiastolic;
    let bpMessage = '';
    
    if (bpSystolic >= 180 || bpDiastolic >= 120) {
      bpMessage = `Your blood pressure (BP) of ${bpSystolic}/${bpDiastolic} mmHg is very high and falls under hypertensive crisis. This requires immediate medical attention.`;
    } else if (bpSystolic >= 160 || bpDiastolic >= 100) {
      bpMessage = `Your blood pressure (BP) of ${bpSystolic}/${bpDiastolic} mmHg is high (stage 2 hypertension) and requires prompt medical evaluation.`;
    } else if (bpSystolic >= 140 || bpDiastolic >= 90) {
      bpMessage = `Your blood pressure (BP) of ${bpSystolic}/${bpDiastolic} mmHg is high (stage 1 hypertension). Consider consulting with a healthcare provider.`;
    } else if (bpSystolic >= 130 || bpDiastolic >= 85) {
      bpMessage = `Your blood pressure (BP) of ${bpSystolic}/${bpDiastolic} mmHg is elevated. Lifestyle modifications may be recommended.`;
    } else if (bpSystolic < 90 || bpDiastolic < 60) {
      bpMessage = `Your blood pressure (BP) of ${bpSystolic}/${bpDiastolic} mmHg is lower than normal. This could indicate hypotension.`;
    } else {
      bpMessage = `Your blood pressure (BP) of ${bpSystolic}/${bpDiastolic} mmHg is within normal range.`;
    }
    
    // Heart rate analysis
    let hrMessage = '';
    const hr = data.heartRate;
    
    if (hr > 100) {
      hrMessage = `Your heart rate of ${hr} bpm is elevated (tachycardia).`;
    } else if (hr < 60) {
      hrMessage = `Your heart rate of ${hr} bpm is lower than normal (bradycardia).`;
    } else {
      hrMessage = `Your heart rate of ${hr} bpm is within the normal range (60-100 bpm).`;
    }
    
    // Temperature analysis
    let tempMessage = '';
    const temp = data.temperature;
    
    if (temp >= 38.3) {
      tempMessage = `Your temperature of ${temp}°C indicates a significant fever. This could be due to infection or other conditions requiring medical attention.`;
    } else if (temp >= 37.3) {
      tempMessage = `Your temperature of ${temp}°C is slightly elevated, suggesting a mild fever. This could be due to an infection, stress, or another underlying condition.`;
    } else if (temp <= 35.5) {
      tempMessage = `Your temperature of ${temp}°C is below normal, which could indicate hypothermia or other health issues.`;
    } else {
      tempMessage = `Your temperature of ${temp}°C is within normal range.`;
    }
    
    // Oxygen level analysis
    let o2Message = '';
    const o2 = data.oxygenLevel;
    
    if (o2 < 90) {
      o2Message = `Your oxygen level of ${o2}% is critically low (hypoxemia) and requires immediate medical attention.`;
    } else if (o2 < 95) {
      o2Message = `Your oxygen level of ${o2}% is lower than optimal. This may require medical evaluation.`;
    } else {
      o2Message = `Your oxygen level of ${o2}% is within normal range.`;
    }
    
    // Compile the full message based on overall status
    if (overallStatus === 'critical') {
      message = `URGENT HEALTH ALERT:\n\n${bpMessage}\n\n${hrMessage}\n\n${tempMessage}\n\n${o2Message}\n\nPlease seek immediate medical attention as one or more of your vital signs indicates a potentially serious condition.`;
    } else if (overallStatus === 'warning') {
      message = `HEALTH WARNING:\n\n${bpMessage}\n\n${hrMessage}\n\n${tempMessage}\n\n${o2Message}\n\nSome of your vital signs are outside normal ranges. Consider consulting a healthcare provider for evaluation.`;
    } else {
      message = `HEALTH STATUS:\n\n${bpMessage}\n\n${hrMessage}\n\n${tempMessage}\n\n${o2Message}\n\nYour vital signs are generally within acceptable ranges. Continue monitoring regularly.`;
    }
    
    return message;
  }
}

// Export singleton instance
export const healthAnalysisService = new HealthAnalysisService(); 