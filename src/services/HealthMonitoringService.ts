import { HealthData, HealthStatus } from './HealthAnalysisService';
import { securityService } from './SecurityService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  createAlert(arg0: { id: string; message: string; status: HealthStatus; timestamp: Date; metrics: { [x: string]: { value: number; status: HealthStatus; }; }; }) {
    throw new Error('Method not implemented.');
  }
  private monitoringConfig: HealthMonitoringConfig;
  private healthHistory: {
    data: HealthData;
    timestamp: Date;
    status: HealthStatus;
  }[] = [];
  private alerts: HealthAlert[] = [];
  private userId: string | null = null;

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
   * Set the user ID for the current session
   */
  public setUserId(userId: string): void {
    this.userId = userId;
    // Reload data for the specific user
    this.loadFromStorage();
  }

  /**
   * Clear user data when logging out
   */
  public clearUserData(): void {
    this.userId = null;
    this.healthHistory = [];
    this.alerts = [];
  }

  /**
   * Save current health data to the history
   */
  public saveHealthData(data: HealthData, status: HealthStatus): void {
    // Verify user is authenticated before saving health data
    if (!this.userId || !securityService.isAuthenticated()) {
      securityService.logSecurityEvent('Unauthorized health data save attempt', 'warning');
      throw new Error('Authentication required to save health data');
    }

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
    // Verify user is authenticated before retrieving health data
    if (!this.userId || !securityService.isAuthenticated()) {
      securityService.logSecurityEvent('Unauthorized health history access attempt', 'warning');
      return []; // Return empty array instead of throwing error for better UX
    }

    return [...this.healthHistory];
  }

  /**
   * Get all alerts
   */
  public getAlerts(): HealthAlert[] {
    // Verify user is authenticated before retrieving alerts
    if (!this.userId || !securityService.isAuthenticated()) {
      securityService.logSecurityEvent('Unauthorized alerts access attempt', 'warning');
      return []; // Return empty array instead of throwing error for better UX
    }

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
   * Save current state to persistent storage
   */
  private async saveToStorage(): Promise<void> {
    if (!this.userId) {
      return;
    }

    try {
      // Encrypt sensitive health data before storage
      const storageKey = `health_monitoring_data_${this.userId}`;
      const dataToSave = {
        config: this.monitoringConfig,
        history: this.healthHistory,
        alerts: this.alerts,
      };

      // Stringify and encrypt using the security service
      const jsonData = JSON.stringify(dataToSave);
      const encryptedData = securityService.encryptHealthData({
        type: 'storage',
        data: jsonData
      } as unknown as HealthData); 

      await AsyncStorage.setItem(storageKey, encryptedData);
    } catch (error) {
      console.error('Error saving health monitoring data:', error);
    }
  }

  /**
   * Load saved state from persistent storage
   */
  private async loadFromStorage(): Promise<void> {
    if (!this.userId) {
      return;
    }

    try {
      const storageKey = `health_monitoring_data_${this.userId}`;
      const savedData = await AsyncStorage.getItem(storageKey);

      if (savedData) {
        try {
          // Decrypt the data using the security service
          const decryptedData = securityService.decryptHealthData(savedData);
          const parsedData = JSON.parse((decryptedData as unknown as {data: string}).data);

          // Restore saved state
          if (parsedData.config) {
            this.monitoringConfig = parsedData.config;
          }

          if (parsedData.history) {
            // Convert ISO date strings back to Date objects
            this.healthHistory = parsedData.history.map((item: any) => ({
              ...item,
              timestamp: new Date(item.timestamp)
            }));
          }

          if (parsedData.alerts) {
            // Convert ISO date strings back to Date objects
            this.alerts = parsedData.alerts.map((alert: any) => ({
              ...alert,
              timestamp: new Date(alert.timestamp)
            }));
          }
        } catch (decryptError) {
          console.error('Error decrypting health data:', decryptError);
          securityService.logSecurityEvent('Data decryption error', 'critical', {
            error: String(decryptError)
          });
        }
      }
    } catch (error) {
      console.error('Error loading health monitoring data:', error);
    }
  }
}

// Export a singleton instance of the health monitoring service
export const healthMonitoringService = new HealthMonitoringService();