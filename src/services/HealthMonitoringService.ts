import { HealthData, HealthStatus } from './HealthAnalysisService';

export type MonitoringSchedule = 'hourly' | 'daily' | 'weekly' | 'monthly';

export type HealthMonitoringConfig = {
  isActive: boolean;
  schedule: MonitoringSchedule;
  alertThreshold: HealthStatus; // The minimum status level that will trigger an alert
  metrics: {
    heartRate: boolean;
    bloodPressure: boolean;
    temperature: boolean;
    oxygenLevel: boolean;
    weight: boolean;
  };
};

export type HealthAlert = {
  id: string;
  timestamp: Date;
  status: HealthStatus;
  message: string;
  metrics: {
    [key: string]: {
      value: number;
      status: HealthStatus;
    };
  };
  seen: boolean;
};

class HealthMonitoringService {
  private monitoringConfig: HealthMonitoringConfig;
  private healthHistory: {
    data: HealthData;
    timestamp: Date;
    status: HealthStatus;
  }[] = [];
  private alerts: HealthAlert[] = [];

  constructor() {
    // Default configuration
    this.monitoringConfig = {
      isActive: true,
      schedule: 'daily',
      alertThreshold: 'warning',
      metrics: {
        heartRate: true,
        bloodPressure: true,
        temperature: true,
        oxygenLevel: true,
        weight: false,
      },
    };

    // Load any saved configuration and history from storage
    this.loadFromStorage();
  }

  /**
   * Save current health data to the history
   */
  public saveHealthData(data: HealthData, status: HealthStatus): void {
    this.healthHistory.push({
      data,
      timestamp: new Date(),
      status,
    });

    // Save to persistent storage
    this.saveToStorage();

    // Check if we need to create an alert
    this.checkForAlerts(data, status);
  }

  /**
   * Get health data history
   */
  public getHealthHistory(): {
    data: HealthData;
    timestamp: Date;
    status: HealthStatus;
  }[] {
    return [...this.healthHistory];
  }

  /**
   * Get all alerts
   */
  public getAlerts(): HealthAlert[] {
    return [...this.alerts];
  }

  /**
   * Get unread alerts count
   */
  public getUnreadAlertsCount(): number {
    return this.alerts.filter(alert => !alert.seen).length;
  }

  /**
   * Mark an alert as seen
   */
  public markAlertAsSeen(alertId: string): void {
    const alertIndex = this.alerts.findIndex(alert => alert.id === alertId);
    if (alertIndex !== -1) {
      this.alerts[alertIndex].seen = true;
      this.saveToStorage();
    }
  }

  /**
   * Mark all alerts as seen
   */
  public markAllAlertsAsSeen(): void {
    this.alerts.forEach(alert => {
      alert.seen = true;
    });
    this.saveToStorage();
  }

  /**
   * Update monitoring configuration
   */
  public updateMonitoringConfig(config: Partial<HealthMonitoringConfig>): void {
    this.monitoringConfig = {
      ...this.monitoringConfig,
      ...config,
    };
    this.saveToStorage();
  }

  /**
   * Get current monitoring configuration
   */
  public getMonitoringConfig(): HealthMonitoringConfig {
    return { ...this.monitoringConfig };
  }

  /**
   * Check health data against thresholds and create alerts if needed
   */
  private checkForAlerts(data: HealthData, status: HealthStatus): void {
    // Only create alerts if monitoring is active
    if (!this.monitoringConfig.isActive) {
      return;
    }

    // Check if the status meets or exceeds our threshold for alerts
    const statusSeverity = {
      normal: 0,
      warning: 1,
      critical: 2,
    };

    if (statusSeverity[status] >= statusSeverity[this.monitoringConfig.alertThreshold]) {
      // Create a new alert
      const alertMessage = this.generateAlertMessage(status, data);
      
      const metrics: { [key: string]: { value: number, status: HealthStatus } } = {};
      
      // Only include metrics that are enabled for monitoring
      if (this.monitoringConfig.metrics.heartRate) {
        const metricStatus = this.getMetricStatus(data.heartRate, 60, 100);
        metrics.heartRate = { value: data.heartRate, status: metricStatus };
      }
      
      if (this.monitoringConfig.metrics.bloodPressure) {
        const systolicStatus = this.getMetricStatus(data.bloodPressureSystolic, 90, 120);
        const diastolicStatus = this.getMetricStatus(data.bloodPressureDiastolic, 60, 80);
        
        // Use the more severe status
        const combinedStatus = 
          statusSeverity[systolicStatus] > statusSeverity[diastolicStatus] 
            ? systolicStatus 
            : diastolicStatus;
            
        metrics.bloodPressureSystolic = { value: data.bloodPressureSystolic, status: systolicStatus };
        metrics.bloodPressureDiastolic = { value: data.bloodPressureDiastolic, status: diastolicStatus };
      }
      
      if (this.monitoringConfig.metrics.temperature) {
        const metricStatus = this.getMetricStatus(data.temperature, 36.1, 37.2);
        metrics.temperature = { value: data.temperature, status: metricStatus };
      }
      
      if (this.monitoringConfig.metrics.oxygenLevel) {
        const metricStatus = this.getMetricStatus(data.oxygenLevel, 95, 100);
        metrics.oxygenLevel = { value: data.oxygenLevel, status: metricStatus };
      }
      
      const newAlert: HealthAlert = {
        id: Date.now().toString(),
        timestamp: new Date(),
        status,
        message: alertMessage,
        metrics,
        seen: false,
      };
      
      this.alerts.push(newAlert);
      this.saveToStorage();
    }
  }

  /**
   * Generate an alert message based on health status
   */
  private generateAlertMessage(status: HealthStatus, data: HealthData): string {
    switch (status) {
      case 'critical':
        return 'URGENT: Your health metrics have reached critical levels. Please consult a healthcare provider immediately.';
      case 'warning':
        return 'ATTENTION: Some of your health metrics need attention. Consider consulting a healthcare provider.';
      default:
        return 'Your health metrics are within normal ranges, but close monitoring is recommended.';
    }
  }

  /**
   * Get the status of a specific metric value
   */
  private getMetricStatus(value: number, min: number, max: number): HealthStatus {
    if (value < min || value > max) {
      // Determine severity of deviation
      const minDev = Math.abs(value - min) / min;
      const maxDev = Math.abs(value - max) / max;
      const deviation = Math.max(minDev, maxDev);
      
      if (deviation > 0.15) {
        return 'critical';
      } else {
        return 'warning';
      }
    }
    return 'normal';
  }

  /**
   * Save data to persistent storage
   */
  private saveToStorage(): void {
    try {
      // In a real app, you would use AsyncStorage or another storage solution
      // AsyncStorage.setItem('healthMonitoring', JSON.stringify({
      //   config: this.monitoringConfig,
      //   history: this.healthHistory,
      //   alerts: this.alerts,
      // }));
      
      // For now, just log that we're saving
      console.log('Saving health monitoring data to storage');
    } catch (error) {
      console.error('Error saving health monitoring data:', error);
    }
  }

  /**
   * Load data from persistent storage
   */
  private loadFromStorage(): void {
    try {
      // In a real app, you would use AsyncStorage or another storage solution
      // const savedData = AsyncStorage.getItem('healthMonitoring');
      // if (savedData) {
      //   const parsed = JSON.parse(savedData);
      //   this.monitoringConfig = parsed.config;
      //   this.healthHistory = parsed.history;
      //   this.alerts = parsed.alerts;
      // }
      
      // For now, just log that we're loading
      console.log('Loading health monitoring data from storage');
    } catch (error) {
      console.error('Error loading health monitoring data:', error);
    }
  }
}

// Export a singleton instance
export const healthMonitoringService = new HealthMonitoringService(); 