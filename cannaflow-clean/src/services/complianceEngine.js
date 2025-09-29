import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Print from 'expo-print';
import * as XLSX from 'xlsx';

// Storage keys
const COMPLIANCE_LOGS_KEY = '@cannabis_pos_compliance_logs';
const COMPLIANCE_SETTINGS_KEY = '@cannabis_pos_compliance_settings';

// Log types
export const LOG_TYPES = {
  SALE: 'sale',
  INVENTORY: 'inventory',
  CASH_FLOAT: 'cash_float',
  DAILY_SUMMARY: 'daily_summary',
  AUDIT: 'audit',
  EMPLOYEE: 'employee',
  WASTE: 'waste',
  DELIVERY: 'delivery',
  RECALL: 'recall'
};

// Canadian provinces and territories
export const PROVINCES = {
  BC: 'British Columbia',
  ON: 'Ontario',
  AB: 'Alberta',
  QC: 'Quebec',
  MB: 'Manitoba',
  SK: 'Saskatchewan',
  NS: 'Nova Scotia',
  NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador',
  PE: 'Prince Edward Island',
  YT: 'Yukon',
  NT: 'Northwest Territories',
  NU: 'Nunavut'
};

// Export formats
export const EXPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  XML: 'xml',
  PDF: 'pdf',
  EXCEL: 'excel',
  HTML: 'html'
};

// Default compliance settings
const DEFAULT_SETTINGS = {
  province: 'BC',
  businessName: 'CannaFlow Dispensary',
  licenseNumber: 'SAMPLE-LICENSE-123',
  location: '123 Main Street, Vancouver, BC',
  retentionPeriod: 7, // years - updated to 7 years for 2025 regulations
  autoExport: false,
  exportFormat: EXPORT_FORMATS.CSV,
  exportSchedule: 'weekly',
  notifyDays: 7, // days before compliance deadlines
  enableAuditTrail: true,
  trackEmployeeActivity: true,
  trackWasteManagement: true,
  trackDeliveries: false,
  enableRecallManagement: true
};

// 2025 Provincial Regulatory Requirements
const PROVINCIAL_REQUIREMENTS_2025 = {
  BC: {
    salesReportingFrequency: 'monthly',
    inventoryReportingFrequency: 'monthly',
    salesTaxRate: 0.12, // 12% PST + GST
    purchaseLimits: {
      dried: 30, // grams
      oil: 2100, // milligrams of THC
      seeds: 30, // seeds
      plants: 4 // plants
    },
    requiredFields: [
      'customerAge',
      'productSKU',
      'productCategory',
      'quantity',
      'price',
      'taxAmount',
      'paymentMethod',
      'employeeID',
      'timestamp'
    ],
    retentionPeriod: 7, // years
    wasteReporting: true,
    deliveryAllowed: true,
    thcLimits: {
      edibles: 10, // mg per package
      extracts: 1000 // mg per package
    }
  },
  ON: {
    salesReportingFrequency: 'weekly',
    inventoryReportingFrequency: 'weekly',
    salesTaxRate: 0.13, // 13% HST
    purchaseLimits: {
      dried: 30, // grams
      oil: 2100, // milligrams of THC
      seeds: 30, // seeds
      plants: 4 // plants
    },
    requiredFields: [
      'customerAge',
      'productSKU',
      'productCategory',
      'quantity',
      'price',
      'taxAmount',
      'paymentMethod',
      'employeeID',
      'timestamp',
      'storeID'
    ],
    retentionPeriod: 7, // years
    wasteReporting: true,
    deliveryAllowed: true,
    thcLimits: {
      edibles: 10, // mg per package
      extracts: 1000 // mg per package
    }
  },
  AB: {
    salesReportingFrequency: 'monthly',
    inventoryReportingFrequency: 'monthly',
    salesTaxRate: 0.05, // 5% GST
    purchaseLimits: {
      dried: 30, // grams
      oil: 2100, // milligrams of THC
      seeds: 30, // seeds
      plants: 4 // plants
    },
    requiredFields: [
      'customerAge',
      'productSKU',
      'productCategory',
      'quantity',
      'price',
      'taxAmount',
      'paymentMethod',
      'employeeID',
      'timestamp'
    ],
    retentionPeriod: 7, // years
    wasteReporting: true,
    deliveryAllowed: false,
    thcLimits: {
      edibles: 10, // mg per package
      extracts: 1000 // mg per package
    }
  },
  QC: {
    salesReportingFrequency: 'daily',
    inventoryReportingFrequency: 'weekly',
    salesTaxRate: 0.14975, // 9.975% QST + 5% GST
    purchaseLimits: {
      dried: 30, // grams
      oil: 2100, // milligrams of THC
      seeds: 30, // seeds
      plants: 0 // plants - not allowed in QC
    },
    requiredFields: [
      'customerAge',
      'productSKU',
      'productCategory',
      'quantity',
      'price',
      'taxAmount',
      'paymentMethod',
      'employeeID',
      'timestamp',
      'customerPostalCode'
    ],
    retentionPeriod: 7, // years
    wasteReporting: true,
    deliveryAllowed: true,
    thcLimits: {
      edibles: 10, // mg per package
      extracts: 1000 // mg per package
    }
  },
  // Add other provinces with their specific 2025 requirements
  MB: {
    salesReportingFrequency: 'monthly',
    inventoryReportingFrequency: 'monthly',
    salesTaxRate: 0.12, // 7% PST + 5% GST
    purchaseLimits: {
      dried: 30,
      oil: 2100,
      seeds: 30,
      plants: 4
    },
    requiredFields: [
      'customerAge',
      'productSKU',
      'productCategory',
      'quantity',
      'price',
      'taxAmount',
      'paymentMethod',
      'employeeID',
      'timestamp'
    ],
    retentionPeriod: 7,
    wasteReporting: true,
    deliveryAllowed: true,
    thcLimits: {
      edibles: 10,
      extracts: 1000
    }
  },
  SK: {
    salesReportingFrequency: 'monthly',
    inventoryReportingFrequency: 'monthly',
    salesTaxRate: 0.11, // 6% PST + 5% GST
    purchaseLimits: {
      dried: 30,
      oil: 2100,
      seeds: 30,
      plants: 4
    },
    requiredFields: [
      'customerAge',
      'productSKU',
      'productCategory',
      'quantity',
      'price',
      'taxAmount',
      'paymentMethod',
      'employeeID',
      'timestamp'
    ],
    retentionPeriod: 7,
    wasteReporting: true,
    deliveryAllowed: true,
    thcLimits: {
      edibles: 10,
      extracts: 1000
    }
  },
  NS: {
    salesReportingFrequency: 'weekly',
    inventoryReportingFrequency: 'weekly',
    salesTaxRate: 0.15, // 15% HST
    purchaseLimits: {
      dried: 30,
      oil: 2100,
      seeds: 30,
      plants: 4
    },
    requiredFields: [
      'customerAge',
      'productSKU',
      'productCategory',
      'quantity',
      'price',
      'taxAmount',
      'paymentMethod',
      'employeeID',
      'timestamp'
    ],
    retentionPeriod: 7,
    wasteReporting: true,
    deliveryAllowed: true,
    thcLimits: {
      edibles: 10,
      extracts: 1000
    }
  },
  NB: {
    salesReportingFrequency: 'weekly',
    inventoryReportingFrequency: 'weekly',
    salesTaxRate: 0.15, // 15% HST
    purchaseLimits: {
      dried: 30,
      oil: 2100,
      seeds: 30,
      plants: 4
    },
    requiredFields: [
      'customerAge',
      'productSKU',
      'productCategory',
      'quantity',
      'price',
      'taxAmount',
      'paymentMethod',
      'employeeID',
      'timestamp'
    ],
    retentionPeriod: 7,
    wasteReporting: true,
    deliveryAllowed: true,
    thcLimits: {
      edibles: 10,
      extracts: 1000
    }
  },
  NL: {
    salesReportingFrequency: 'monthly',
    inventoryReportingFrequency: 'monthly',
    salesTaxRate: 0.15, // 15% HST
    purchaseLimits: {
      dried: 30,
      oil: 2100,
      seeds: 30,
      plants: 4
    },
    requiredFields: [
      'customerAge',
      'productSKU',
      'productCategory',
      'quantity',
      'price',
      'taxAmount',
      'paymentMethod',
      'employeeID',
      'timestamp'
    ],
    retentionPeriod: 7,
    wasteReporting: true,
    deliveryAllowed: true,
    thcLimits: {
      edibles: 10,
      extracts: 1000
    }
  },
  PE: {
    salesReportingFrequency: 'monthly',
    inventoryReportingFrequency: 'monthly',
    salesTaxRate: 0.15, // 15% HST
    purchaseLimits: {
      dried: 30,
      oil: 2100,
      seeds: 30,
      plants: 4
    },
    requiredFields: [
      'customerAge',
      'productSKU',
      'productCategory',
      'quantity',
      'price',
      'taxAmount',
      'paymentMethod',
      'employeeID',
      'timestamp'
    ],
    retentionPeriod: 7,
    wasteReporting: true,
    deliveryAllowed: true,
    thcLimits: {
      edibles: 10,
      extracts: 1000
    }
  },
  YT: {
    salesReportingFrequency: 'monthly',
    inventoryReportingFrequency: 'monthly',
    salesTaxRate: 0.05, // 5% GST
    purchaseLimits: {
      dried: 30,
      oil: 2100,
      seeds: 30,
      plants: 4
    },
    requiredFields: [
      'customerAge',
      'productSKU',
      'productCategory',
      'quantity',
      'price',
      'taxAmount',
      'paymentMethod',
      'employeeID',
      'timestamp'
    ],
    retentionPeriod: 7,
    wasteReporting: true,
    deliveryAllowed: true,
    thcLimits: {
      edibles: 10,
      extracts: 1000
    }
  },
  NT: {
    salesReportingFrequency: 'monthly',
    inventoryReportingFrequency: 'monthly',
    salesTaxRate: 0.05, // 5% GST
    purchaseLimits: {
      dried: 30,
      oil: 2100,
      seeds: 30,
      plants: 4
    },
    requiredFields: [
      'customerAge',
      'productSKU',
      'productCategory',
      'quantity',
      'price',
      'taxAmount',
      'paymentMethod',
      'employeeID',
      'timestamp'
    ],
    retentionPeriod: 7,
    wasteReporting: true,
    deliveryAllowed: true,
    thcLimits: {
      edibles: 10,
      extracts: 1000
    }
  },
  NU: {
    salesReportingFrequency: 'monthly',
    inventoryReportingFrequency: 'monthly',
    salesTaxRate: 0.05, // 5% GST
    purchaseLimits: {
      dried: 30,
      oil: 2100,
      seeds: 30,
      plants: 4
    },
    requiredFields: [
      'customerAge',
      'productSKU',
      'productCategory',
      'quantity',
      'price',
      'taxAmount',
      'paymentMethod',
      'employeeID',
      'timestamp'
    ],
    retentionPeriod: 7,
    wasteReporting: true,
    deliveryAllowed: true,
    thcLimits: {
      edibles: 10,
      extracts: 1000
    }
  }
};

// Important compliance dates for 2025
const COMPLIANCE_DATES_2025 = {
  BC: [
    { date: '2025-01-31', description: 'Monthly sales report due' },
    { date: '2025-02-28', description: 'Monthly sales report due' },
    { date: '2025-03-31', description: 'Monthly sales report due' },
    { date: '2025-04-30', description: 'Monthly sales report due' },
    { date: '2025-05-31', description: 'Monthly sales report due' },
    { date: '2025-06-30', description: 'Monthly sales report due' },
    { date: '2025-07-31', description: 'Monthly sales report due' },
    { date: '2025-08-31', description: 'Monthly sales report due' },
    { date: '2025-09-30', description: 'Monthly sales report due' },
    { date: '2025-10-31', description: 'Monthly sales report due' },
    { date: '2025-11-30', description: 'Monthly sales report due' },
    { date: '2025-12-31', description: 'Monthly sales report due' },
    { date: '2025-04-30', description: 'Annual license renewal due' }
  ],
  ON: [
    { date: '2025-01-07', description: 'Weekly sales report due' },
    // Add more weekly dates for Ontario
    { date: '2025-03-31', description: 'Quarterly inventory audit due' },
    { date: '2025-06-30', description: 'Quarterly inventory audit due' },
    { date: '2025-09-30', description: 'Quarterly inventory audit due' },
    { date: '2025-12-31', description: 'Quarterly inventory audit due' },
    { date: '2025-05-15', description: 'Annual license renewal due' }
  ],
  // Add dates for other provinces
};

/**
 * Initialize the compliance engine
 * @returns {Promise<Object>} The compliance settings
 */
export const initComplianceEngine = async () => {
  try {
    // Get stored settings or use defaults
    const storedSettings = await AsyncStorage.getItem(COMPLIANCE_SETTINGS_KEY);
    const settings = storedSettings ? JSON.parse(storedSettings) : DEFAULT_SETTINGS;
    
    // Ensure logs storage exists
    const storedLogs = await AsyncStorage.getItem(COMPLIANCE_LOGS_KEY);
    if (!storedLogs) {
      await AsyncStorage.setItem(COMPLIANCE_LOGS_KEY, JSON.stringify([]));
    }
    
    return settings;
  } catch (error) {
    console.error('Error initializing compliance engine:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Get the current compliance settings
 * @returns {Promise<Object>} The compliance settings
 */
export const getComplianceSettings = async () => {
  try {
    const storedSettings = await AsyncStorage.getItem(COMPLIANCE_SETTINGS_KEY);
    return storedSettings ? JSON.parse(storedSettings) : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error getting compliance settings:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Update compliance settings
 * @param {Object} newSettings - The new settings to apply
 * @returns {Promise<Object>} The updated settings
 */
export const updateComplianceSettings = async (newSettings) => {
  try {
    const currentSettings = await getComplianceSettings();
    const updatedSettings = { ...currentSettings, ...newSettings };
    
    await AsyncStorage.setItem(COMPLIANCE_SETTINGS_KEY, JSON.stringify(updatedSettings));
    
    return updatedSettings;
  } catch (error) {
    console.error('Error updating compliance settings:', error);
    throw error;
  }
};

/**
 * Get provincial requirements for the current province
 * @param {string} provinceCode - The province code (e.g., 'BC', 'ON')
 * @returns {Object} The provincial requirements
 */
export const getProvincialRequirements = (provinceCode) => {
  return PROVINCIAL_REQUIREMENTS_2025[provinceCode] || PROVINCIAL_REQUIREMENTS_2025.BC;
};

/**
 * Get compliance dates for the current province
 * @param {string} provinceCode - The province code (e.g., 'BC', 'ON')
 * @returns {Array} The compliance dates
 */
export const getComplianceDates = (provinceCode) => {
  return COMPLIANCE_DATES_2025[provinceCode] || COMPLIANCE_DATES_2025.BC;
};

/**
 * Get upcoming compliance deadlines
 * @param {number} daysAhead - Number of days to look ahead
 * @returns {Promise<Array>} Upcoming deadlines
 */
export const getUpcomingDeadlines = async (daysAhead = 30) => {
  try {
    const settings = await getComplianceSettings();
    const provinceDates = getComplianceDates(settings.province);
    
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);
    
    return provinceDates.filter(item => {
      const deadlineDate = new Date(item.date);
      return deadlineDate >= today && deadlineDate <= futureDate;
    });
  } catch (error) {
    console.error('Error getting upcoming deadlines:', error);
    return [];
  }
};

/**
 * Add a compliance log entry
 * @param {string} type - The log type (from LOG_TYPES)
 * @param {Object} data - The log data
 * @returns {Promise<Object>} The created log entry
 */
export const addComplianceLog = async (type, data) => {
  try {
    if (!Object.values(LOG_TYPES).includes(type)) {
      throw new Error(`Invalid log type: ${type}`);
    }
    
    const settings = await getComplianceSettings();
    const provincialRequirements = getProvincialRequirements(settings.province);
    
    // Validate required fields for sales logs
    if (type === LOG_TYPES.SALE && provincialRequirements.requiredFields) {
      const missingFields = provincialRequirements.requiredFields.filter(field => !data[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields for ${settings.province}: ${missingFields.join(', ')}`);
      }
    }
    
    // Create log entry
    const logEntry = {
      id: generateLogId(),
      type,
      timestamp: new Date().toISOString(),
      province: settings.province,
      businessName: settings.businessName,
      licenseNumber: settings.licenseNumber,
      location: settings.location,
      data
    };
    
    // Get existing logs
    const storedLogs = await AsyncStorage.getItem(COMPLIANCE_LOGS_KEY);
    const logs = storedLogs ? JSON.parse(storedLogs) : [];
    
    // Add new log
    logs.push(logEntry);
    
    // Save updated logs
    await AsyncStorage.setItem(COMPLIANCE_LOGS_KEY, JSON.stringify(logs));
    
    // Auto-export if enabled
    if (settings.autoExport) {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
      
      if (
        (settings.exportSchedule === 'daily') ||
        (settings.exportSchedule === 'weekly' && dayOfWeek === 0) ||
        (settings.exportSchedule === 'monthly' && today.getDate() === 1)
      ) {
        await exportLogs(settings.exportFormat);
      }
    }
    
    return logEntry;
  } catch (error) {
    console.error('Error adding compliance log:', error);
    throw error;
  }
};

/**
 * Get compliance logs
 * @param {Object} options - Filter options
 * @param {string} options.type - Filter by log type
 * @param {string} options.startDate - Filter by start date (ISO string)
 * @param {string} options.endDate - Filter by end date (ISO string)
 * @returns {Promise<Array>} Filtered logs
 */
export const getComplianceLogs = async (options = {}) => {
  try {
    const storedLogs = await AsyncStorage.getItem(COMPLIANCE_LOGS_KEY);
    let logs = storedLogs ? JSON.parse(storedLogs) : [];
    
    // Apply filters
    if (options.type) {
      logs = logs.filter(log => log.type === options.type);
    }
    
    if (options.startDate) {
      const startDate = new Date(options.startDate);
      logs = logs.filter(log => new Date(log.timestamp) >= startDate);
    }
    
    if (options.endDate) {
      const endDate = new Date(options.endDate);
      logs = logs.filter(log => new Date(log.timestamp) <= endDate);
    }
    
    return logs;
  } catch (error) {
    console.error('Error getting compliance logs:', error);
    return [];
  }
};

/**
 * Generate a daily summary log
 * @param {string} date - The date to summarize (ISO string)
 * @returns {Promise<Object>} The summary log
 */
export const generateDailySummary = async (date = new Date().toISOString()) => {
  try {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Get logs for the day
    const logs = await getComplianceLogs({
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString()
    });
    
    // Filter by type
    const salesLogs = logs.filter(log => log.type === LOG_TYPES.SALE);
    const inventoryLogs = logs.filter(log => log.type === LOG_TYPES.INVENTORY);
    const cashFloatLogs = logs.filter(log => log.type === LOG_TYPES.CASH_FLOAT);
    const wasteLogs = logs.filter(log => log.type === LOG_TYPES.WASTE);
    const employeeLogs = logs.filter(log => log.type === LOG_TYPES.EMPLOYEE);
    
    // Calculate totals
    const totalSales = salesLogs.reduce((sum, log) => sum + (log.data.total || 0), 0);
    const totalTax = salesLogs.reduce((sum, log) => sum + (log.data.taxAmount || 0), 0);
    const totalItems = salesLogs.reduce((sum, log) => sum + (log.data.quantity || 0), 0);
    
    // Group sales by category
    const salesByCategory = {};
    salesLogs.forEach(log => {
      const category = log.data.productCategory || 'unknown';
      if (!salesByCategory[category]) {
        salesByCategory[category] = {
          count: 0,
          total: 0
        };
      }
      salesByCategory[category].count += log.data.quantity || 0;
      salesByCategory[category].total += log.data.total || 0;
    });
    
    // Create summary
    const summary = {
      date: targetDate.toISOString(),
      salesCount: salesLogs.length,
      totalSales,
      totalTax,
      totalItems,
      salesByCategory,
      inventoryCount: inventoryLogs.length,
      cashFloatEvents: cashFloatLogs.length,
      wasteEvents: wasteLogs.length,
      employeeEvents: employeeLogs.length
    };
    
    // Add summary to logs
    await addComplianceLog(LOG_TYPES.DAILY_SUMMARY, summary);
    
    return summary;
  } catch (error) {
    console.error('Error generating daily summary:', error);
    throw error;
  }
};

/**
 * Export logs to a file
 * @param {string} format - The export format (from EXPORT_FORMATS)
 * @param {Object} options - Export options
 * @param {string} options.type - Filter by log type
 * @param {string} options.startDate - Filter by start date (ISO string)
 * @param {string} options.endDate - Filter by end date (ISO string)
 * @returns {Promise<string>} The exported file URI
 */
export const exportLogs = async (format = EXPORT_FORMATS.CSV, options = {}) => {
  try {
    // Get logs
    const logs = await getComplianceLogs(options);
    
    if (logs.length === 0) {
      throw new Error('No logs to export');
    }
    
    // Get settings
    const settings = await getComplianceSettings();
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const typeStr = options.type ? `-${options.type}` : '';
    const filename = `${settings.businessName.replace(/\s+/g, '-')}-logs${typeStr}-${timestamp}`;
    
    let fileUri;
    let mimeType;
    
    // Export based on format
    switch (format) {
      case EXPORT_FORMATS.CSV:
        fileUri = await exportToCSV(logs, filename);
        mimeType = 'text/csv';
        break;
      case EXPORT_FORMATS.JSON:
        fileUri = await exportToJSON(logs, filename);
        mimeType = 'application/json';
        break;
      case EXPORT_FORMATS.XML:
        fileUri = await exportToXML(logs, filename);
        mimeType = 'application/xml';
        break;
      case EXPORT_FORMATS.PDF:
        fileUri = await exportToPDF(logs, filename, settings);
        mimeType = 'application/pdf';
        break;
      case EXPORT_FORMATS.EXCEL:
        fileUri = await exportToExcel(logs, filename);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case EXPORT_FORMATS.HTML:
        fileUri = await exportToHTML(logs, filename, settings);
        mimeType = 'text/html';
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
    
    // Share the file
    if (Platform.OS !== 'web') {
      const canShare = await Sharing.isAvailableAsync();
      
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: `CannaFlow Compliance Logs (${format.toUpperCase()})`
        });
      }
    }
    
    return fileUri;
  } catch (error) {
    console.error(`Error exporting logs to ${format}:`, error);
    throw error;
  }
};

/**
 * Export logs to CSV format
 * @param {Array} logs - The logs to export
 * @param {string} filename - The filename
 * @returns {Promise<string>} The exported file URI
 */
const exportToCSV = async (logs, filename) => {
  // Get all possible headers from logs
  const headers = new Set(['id', 'type', 'timestamp', 'province', 'businessName', 'licenseNumber', 'location']);
  
  // Add data fields to headers
  logs.forEach(log => {
    if (log.data) {
      Object.keys(log.data).forEach(key => headers.add(`data.${key}`));
    }
  });
  
  const headerRow = Array.from(headers).join(',');
  
  // Create rows
  const rows = logs.map(log => {
    return Array.from(headers).map(header => {
      if (header.startsWith('data.')) {
        const dataKey = header.substring(5);
        const value = log.data && log.data[dataKey];
        return formatCSVValue(value);
      } else {
        return formatCSVValue(log[header]);
      }
    }).join(',');
  });
  
  // Combine header and rows
  const csvContent = [headerRow, ...rows].join('\n');
  
  // Save to file
  const fileUri = `${FileSystem.documentDirectory}${filename}.csv`;
  await FileSystem.writeAsStringAsync(fileUri, csvContent);
  
  return fileUri;
};

/**
 * Format a value for CSV
 * @param {any} value - The value to format
 * @returns {string} The formatted value
 */
const formatCSVValue = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object') {
    value = JSON.stringify(value);
  }
  
  value = String(value);
  
  // Escape quotes and wrap in quotes if needed
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    value = value.replace(/"/g, '""');
    value = `"${value}"`;
  }
  
  return value;
};

/**
 * Export logs to JSON format
 * @param {Array} logs - The logs to export
 * @param {string} filename - The filename
 * @returns {Promise<string>} The exported file URI
 */
const exportToJSON = async (logs, filename) => {
  const jsonContent = JSON.stringify(logs, null, 2);
  
  // Save to file
  const fileUri = `${FileSystem.documentDirectory}${filename}.json`;
  await FileSystem.writeAsStringAsync(fileUri, jsonContent);
  
  return fileUri;
};

/**
 * Export logs to XML format
 * @param {Array} logs - The logs to export
 * @param {string} filename - The filename
 * @returns {Promise<string>} The exported file URI
 */
const exportToXML = async (logs, filename) => {
  // Create XML header
  let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<complianceLogs>\n';
  
  // Add each log as an XML element
  logs.forEach(log => {
    xmlContent += '  <log>\n';
    xmlContent += `    <id>${escapeXML(log.id)}</id>\n`;
    xmlContent += `    <type>${escapeXML(log.type)}</type>\n`;
    xmlContent += `    <timestamp>${escapeXML(log.timestamp)}</timestamp>\n`;
    xmlContent += `    <province>${escapeXML(log.province)}</province>\n`;
    xmlContent += `    <businessName>${escapeXML(log.businessName)}</businessName>\n`;
    xmlContent += `    <licenseNumber>${escapeXML(log.licenseNumber)}</licenseNumber>\n`;
    xmlContent += `    <location>${escapeXML(log.location)}</location>\n`;
    
    // Add data fields
    if (log.data) {
      xmlContent += '    <data>\n';
      
      Object.entries(log.data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (typeof value === 'object') {
            xmlContent += `      <${key}>${escapeXML(JSON.stringify(value))}</${key}>\n`;
          } else {
            xmlContent += `      <${key}>${escapeXML(String(value))}</${key}>\n`;
          }
        }
      });
      
      xmlContent += '    </data>\n';
    }
    
    xmlContent += '  </log>\n';
  });
  
  // Close root element
  xmlContent += '</complianceLogs>';
  
  // Save to file
  const fileUri = `${FileSystem.documentDirectory}${filename}.xml`;
  await FileSystem.writeAsStringAsync(fileUri, xmlContent);
  
  return fileUri;
};

/**
 * Escape special characters for XML
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
const escapeXML = (str) => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Export logs to PDF format
 * @param {Array} logs - The logs to export
 * @param {string} filename - The filename
 * @param {Object} settings - Compliance settings
 * @returns {Promise<string>} The exported file URI
 */
const exportToPDF = async (logs, filename, settings) => {
  // Group logs by type
  const logsByType = {};
  
  logs.forEach(log => {
    if (!logsByType[log.type]) {
      logsByType[log.type] = [];
    }
    logsByType[log.type].push(log);
  });
  
  // Create HTML content for PDF
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>CannaFlow Compliance Logs</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        h1 {
          color: #2E7D32;
          border-bottom: 2px solid #2E7D32;
          padding-bottom: 10px;
        }
        h2 {
          color: #2E7D32;
          margin-top: 30px;
        }
        .header-info {
          margin-bottom: 30px;
        }
        .header-info p {
          margin: 5px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .footer {
          margin-top: 50px;
          border-top: 1px solid #ddd;
          padding-top: 10px;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <h1>CannaFlow Compliance Logs</h1>
      
      <div class="header-info">
        <p><strong>Business:</strong> ${settings.businessName}</p>
        <p><strong>License Number:</strong> ${settings.licenseNumber}</p>
        <p><strong>Location:</strong> ${settings.location}</p>
        <p><strong>Province:</strong> ${PROVINCES[settings.province]}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      </div>
  `;
  
  // Add tables for each log type
  Object.entries(logsByType).forEach(([type, typeLogs]) => {
    const readableType = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    
    htmlContent += `
      <h2>${readableType} Logs (${typeLogs.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Date/Time</th>
    `;
    
    // Determine columns based on log type
    const columns = getColumnsForLogType(type);
    
    // Add column headers
    columns.forEach(column => {
      htmlContent += `<th>${column.label}</th>`;
    });
    
    htmlContent += `
          </tr>
        </thead>
        <tbody>
    `;
    
    // Add rows for each log
    typeLogs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleString();
      
      htmlContent += `
        <tr>
          <td>${date}</td>
      `;
      
      // Add column values
      columns.forEach(column => {
        let value = '';
        
        if (column.path.includes('.')) {
          const [parent, child] = column.path.split('.');
          value = log[parent] && log[parent][child] !== undefined ? log[parent][child] : '';
        } else {
          value = log[column.path] !== undefined ? log[column.path] : '';
        }
        
        if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        
        htmlContent += `<td>${value}</td>`;
      });
      
      htmlContent += `
        </tr>
      `;
    });
    
    htmlContent += `
        </tbody>
      </table>
    `;
  });
  
  // Add footer
  htmlContent += `
      <div class="footer">
        <p>This is an official compliance report generated by CannaFlow POS. This document contains sensitive information and should be handled according to your province's cannabis regulations.</p>
        <p>Retention period: ${settings.retentionPeriod} years</p>
      </div>
    </body>
    </html>
  `;
  
  // Generate PDF
  const { uri } = await Print.printToFileAsync({
    html: htmlContent,
    base64: false
  });
  
  // Copy to a more accessible location with proper filename
  const fileUri = `${FileSystem.documentDirectory}${filename}.pdf`;
  await FileSystem.copyAsync({
    from: uri,
    to: fileUri
  });
  
  return fileUri;
};

/**
 * Get columns for a specific log type
 * @param {string} type - The log type
 * @returns {Array} The columns
 */
const getColumnsForLogType = (type) => {
  switch (type) {
    case LOG_TYPES.SALE:
      return [
        { path: 'id', label: 'ID' },
        { path: 'data.customerAge', label: 'Customer Age' },
        { path: 'data.productSKU', label: 'Product SKU' },
        { path: 'data.productCategory', label: 'Category' },
        { path: 'data.quantity', label: 'Quantity' },
        { path: 'data.price', label: 'Price' },
        { path: 'data.taxAmount', label: 'Tax' },
        { path: 'data.total', label: 'Total' },
        { path: 'data.paymentMethod', label: 'Payment Method' },
        { path: 'data.employeeID', label: 'Employee ID' }
      ];
    case LOG_TYPES.INVENTORY:
      return [
        { path: 'id', label: 'ID' },
        { path: 'data.action', label: 'Action' },
        { path: 'data.productSKU', label: 'Product SKU' },
        { path: 'data.productName', label: 'Product Name' },
        { path: 'data.quantity', label: 'Quantity' },
        { path: 'data.reason', label: 'Reason' },
        { path: 'data.employeeID', label: 'Employee ID' }
      ];
    case LOG_TYPES.CASH_FLOAT:
      return [
        { path: 'id', label: 'ID' },
        { path: 'data.action', label: 'Action' },
        { path: 'data.amount', label: 'Amount' },
        { path: 'data.reason', label: 'Reason' },
        { path: 'data.employeeID', label: 'Employee ID' }
      ];
    case LOG_TYPES.DAILY_SUMMARY:
      return [
        { path: 'id', label: 'ID' },
        { path: 'data.date', label: 'Date' },
        { path: 'data.salesCount', label: 'Sales Count' },
        { path: 'data.totalSales', label: 'Total Sales' },
        { path: 'data.totalTax', label: 'Total Tax' },
        { path: 'data.totalItems', label: 'Total Items' },
        { path: 'data.inventoryCount', label: 'Inventory Events' },
        { path: 'data.cashFloatEvents', label: 'Cash Float Events' }
      ];
    case LOG_TYPES.WASTE:
      return [
        { path: 'id', label: 'ID' },
        { path: 'data.productSKU', label: 'Product SKU' },
        { path: 'data.productName', label: 'Product Name' },
        { path: 'data.quantity', label: 'Quantity' },
        { path: 'data.reason', label: 'Reason' },
        { path: 'data.disposalMethod', label: 'Disposal Method' },
        { path: 'data.employeeID', label: 'Employee ID' }
      ];
    case LOG_TYPES.EMPLOYEE:
      return [
        { path: 'id', label: 'ID' },
        { path: 'data.employeeID', label: 'Employee ID' },
        { path: 'data.action', label: 'Action' },
        { path: 'data.details', label: 'Details' }
      ];
    default:
      return [
        { path: 'id', label: 'ID' },
        { path: 'type', label: 'Type' }
      ];
  }
};

/**
 * Export logs to Excel format
 * @param {Array} logs - The logs to export
 * @param {string} filename - The filename
 * @returns {Promise<string>} The exported file URI
 */
const exportToExcel = async (logs, filename) => {
  // Group logs by type
  const logsByType = {};
  
  logs.forEach(log => {
    if (!logsByType[log.type]) {
      logsByType[log.type] = [];
    }
    logsByType[log.type].push(log);
  });
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Add sheets for each log type
  Object.entries(logsByType).forEach(([type, typeLogs]) => {
    const readableType = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    
    // Determine columns based on log type
    const columns = getColumnsForLogType(type);
    
    // Prepare data for sheet
    const sheetData = typeLogs.map(log => {
      const row = {};
      
      // Add timestamp
      row['Date/Time'] = new Date(log.timestamp).toLocaleString();
      
      // Add column values
      columns.forEach(column => {
        let value = '';
        
        if (column.path.includes('.')) {
          const [parent, child] = column.path.split('.');
          value = log[parent] && log[parent][child] !== undefined ? log[parent][child] : '';
        } else {
          value = log[column.path] !== undefined ? log[column.path] : '';
        }
        
        if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        
        row[column.label] = value;
      });
      
      return row;
    });
    
    // Create sheet
    const ws = XLSX.utils.json_to_sheet(sheetData);
    
    // Add sheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, readableType);
  });
  
  // Write to file
  const excelBuffer = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const fileUri = `${FileSystem.documentDirectory}${filename}.xlsx`;
  await FileSystem.writeAsStringAsync(fileUri, excelBuffer, { encoding: FileSystem.EncodingType.Base64 });
  
  return fileUri;
};

/**
 * Export logs to HTML format
 * @param {Array} logs - The logs to export
 * @param {string} filename - The filename
 * @param {Object} settings - Compliance settings
 * @returns {Promise<string>} The exported file URI
 */
const exportToHTML = async (logs, filename, settings) => {
  // Group logs by type
  const logsByType = {};
  
  logs.forEach(log => {
    if (!logsByType[log.type]) {
      logsByType[log.type] = [];
    }
    logsByType[log.type].push(log);
  });
  
  // Create HTML content
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>CannaFlow Compliance Logs</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
          line-height: 1.6;
        }
        h1 {
          color: #2E7D32;
          border-bottom: 2px solid #2E7D32;
          padding-bottom: 10px;
        }
        h2 {
          color: #2E7D32;
          margin-top: 30px;
        }
        .header-info {
          margin-bottom: 30px;
        }
        .header-info p {
          margin: 5px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .footer {
          margin-top: 50px;
          border-top: 1px solid #ddd;
          padding-top: 10px;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <h1>CannaFlow Compliance Logs</h1>
      
      <div class="header-info">
        <p><strong>Business:</strong> ${settings.businessName}</p>
        <p><strong>License Number:</strong> ${settings.licenseNumber}</p>
        <p><strong>Location:</strong> ${settings.location}</p>
        <p><strong>Province:</strong> ${PROVINCES[settings.province]}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      </div>
  `;
  
  // Add tables for each log type
  Object.entries(logsByType).forEach(([type, typeLogs]) => {
    const readableType = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    
    htmlContent += `
      <h2>${readableType} Logs (${typeLogs.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Date/Time</th>
    `;
    
    // Determine columns based on log type
    const columns = getColumnsForLogType(type);
    
    // Add column headers
    columns.forEach(column => {
      htmlContent += `<th>${column.label}</th>`;
    });
    
    htmlContent += `
          </tr>
        </thead>
        <tbody>
    `;
    
    // Add rows for each log
    typeLogs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleString();
      
      htmlContent += `
        <tr>
          <td>${date}</td>
      `;
      
      // Add column values
      columns.forEach(column => {
        let value = '';
        
        if (column.path.includes('.')) {
          const [parent, child] = column.path.split('.');
          value = log[parent] && log[parent][child] !== undefined ? log[parent][child] : '';
        } else {
          value = log[column.path] !== undefined ? log[column.path] : '';
        }
        
        if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        
        htmlContent += `<td>${value}</td>`;
      });
      
      htmlContent += `
        </tr>
      `;
    });
    
    htmlContent += `
        </tbody>
      </table>
    `;
  });
  
  // Add footer
  htmlContent += `
      <div class="footer">
        <p>This is an official compliance report generated by CannaFlow POS. This document contains sensitive information and should be handled according to your province's cannabis regulations.</p>
        <p>Retention period: ${settings.retentionPeriod} years</p>
      </div>
    </body>
    </html>
  `;
  
  // Save to file
  const fileUri = `${FileSystem.documentDirectory}${filename}.html`;
  await FileSystem.writeAsStringAsync(fileUri, htmlContent);
  
  return fileUri;
};

/**
 * Import logs from a file
 * @returns {Promise<Array>} The imported logs
 */
export const importLogs = async () => {
  try {
    // Pick a document
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/csv', 'application/xml']
    });
    
    if (result.type === 'cancel') {
      throw new Error('Import cancelled');
    }
    
    // Read file content
    const content = await FileSystem.readAsStringAsync(result.uri);
    
    let logs = [];
    
    // Parse based on file type
    if (result.name.endsWith('.json')) {
      logs = JSON.parse(content);
    } else if (result.name.endsWith('.csv')) {
      logs = parseCSV(content);
    } else if (result.name.endsWith('.xml')) {
      logs = parseXML(content);
    } else {
      throw new Error('Unsupported file format');
    }
    
    // Validate logs
    if (!Array.isArray(logs)) {
      throw new Error('Invalid log format');
    }
    
    // Merge with existing logs
    const storedLogs = await AsyncStorage.getItem(COMPLIANCE_LOGS_KEY);
    const existingLogs = storedLogs ? JSON.parse(storedLogs) : [];
    
    // Use a Set to track existing IDs
    const existingIds = new Set(existingLogs.map(log => log.id));
    
    // Add only new logs
    const newLogs = logs.filter(log => !existingIds.has(log.id));
    
    // Save merged logs
    const mergedLogs = [...existingLogs, ...newLogs];
    await AsyncStorage.setItem(COMPLIANCE_LOGS_KEY, JSON.stringify(mergedLogs));
    
    return newLogs;
  } catch (error) {
    console.error('Error importing logs:', error);
    throw error;
  }
};

/**
 * Parse CSV content to logs
 * @param {string} content - The CSV content
 * @returns {Array} The parsed logs
 */
const parseCSV = (content) => {
  // Split into lines
  const lines = content.split('\n');
  
  // Get headers
  const headers = lines[0].split(',');
  
  // Parse rows
  const logs = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) continue;
    
    const values = parseCSVLine(line);
    
    if (values.length !== headers.length) {
      console.warn(`Skipping line ${i + 1}: column count mismatch`);
      continue;
    }
    
    const log = {};
    
    // Map values to headers
    headers.forEach((header, index) => {
      if (header.startsWith('data.')) {
        const dataKey = header.substring(5);
        
        if (!log.data) {
          log.data = {};
        }
        
        log.data[dataKey] = parseValue(values[index]);
      } else {
        log[header] = parseValue(values[index]);
      }
    });
    
    logs.push(log);
  }
  
  return logs;
};

/**
 * Parse a CSV line, handling quoted values
 * @param {string} line - The CSV line
 * @returns {Array} The parsed values
 */
const parseCSVLine = (line) => {
  const values = [];
  let inQuotes = false;
  let currentValue = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote
        currentValue += '"';
        i++;
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of value
      values.push(currentValue);
      currentValue = '';
    } else {
      // Add to current value
      currentValue += char;
    }
  }
  
  // Add the last value
  values.push(currentValue);
  
  return values;
};

/**
 * Parse a value to the appropriate type
 * @param {string} value - The value to parse
 * @returns {any} The parsed value
 */
const parseValue = (value) => {
  if (value === '') {
    return null;
  }
  
  // Try to parse as JSON
  if (value.startsWith('{') || value.startsWith('[')) {
    try {
      return JSON.parse(value);
    } catch (e) {
      // Not valid JSON
    }
  }
  
  // Try to parse as number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return parseFloat(value);
  }
  
  // Try to parse as boolean
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  // Return as string
  return value;
};

/**
 * Parse XML content to logs
 * @param {string} content - The XML content
 * @returns {Array} The parsed logs
 */
const parseXML = (content) => {
  // Simple XML parser (for production use, consider a proper XML parser library)
  const logs = [];
  
  // Extract log elements
  const logMatches = content.match(/<log>[\s\S]*?<\/log>/g);
  
  if (!logMatches) {
    return logs;
  }
  
  logMatches.forEach(logXml => {
    const log = {};
    
    // Extract basic fields
    const idMatch = logXml.match(/<id>(.*?)<\/id>/);
    const typeMatch = logXml.match(/<type>(.*?)<\/type>/);
    const timestampMatch = logXml.match(/<timestamp>(.*?)<\/timestamp>/);
    const provinceMatch = logXml.match(/<province>(.*?)<\/province>/);
    const businessNameMatch = logXml.match(/<businessName>(.*?)<\/businessName>/);
    const licenseNumberMatch = logXml.match(/<licenseNumber>(.*?)<\/licenseNumber>/);
    const locationMatch = logXml.match(/<location>(.*?)<\/location>/);
    
    if (idMatch) log.id = idMatch[1];
    if (typeMatch) log.type = typeMatch[1];
    if (timestampMatch) log.timestamp = timestampMatch[1];
    if (provinceMatch) log.province = provinceMatch[1];
    if (businessNameMatch) log.businessName = businessNameMatch[1];
    if (licenseNumberMatch) log.licenseNumber = licenseNumberMatch[1];
    if (locationMatch) log.location = locationMatch[1];
    
    // Extract data fields
    const dataMatch = logXml.match(/<data>([\s\S]*?)<\/data>/);
    
    if (dataMatch) {
      log.data = {};
      
      const dataContent = dataMatch[1];
      const dataFieldMatches = dataContent.match(/<([^>]+)>([\s\S]*?)<\/\1>/g);
      
      if (dataFieldMatches) {
        dataFieldMatches.forEach(fieldXml => {
          const fieldMatch = fieldXml.match(/<([^>]+)>([\s\S]*?)<\/\1>/);
          
          if (fieldMatch) {
            const key = fieldMatch[1];
            let value = fieldMatch[2];
            
            // Try to parse as JSON
            try {
              value = JSON.parse(value);
            } catch (e) {
              // Not valid JSON, keep as string
            }
            
            log.data[key] = value;
          }
        });
      }
    }
    
    logs.push(log);
  });
  
  return logs;
};

/**
 * Generate a unique log ID
 * @returns {string} The generated ID
 */
const generateLogId = () => {
  return 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
};

/**
 * Clear all compliance logs
 * @returns {Promise<void>}
 */
export const clearComplianceLogs = async () => {
  try {
    await AsyncStorage.setItem(COMPLIANCE_LOGS_KEY, JSON.stringify([]));
  } catch (error) {
    console.error('Error clearing compliance logs:', error);
    throw error;
  }
};

/**
 * Get compliance statistics
 * @param {string} startDate - Start date (ISO string)
 * @param {string} endDate - End date (ISO string)
 * @returns {Promise<Object>} The statistics
 */
export const getComplianceStats = async (startDate, endDate) => {
  try {
    const logs = await getComplianceLogs({
      startDate,
      endDate
    });
    
    // Count logs by type
    const logCounts = {};
    Object.values(LOG_TYPES).forEach(type => {
      logCounts[type] = logs.filter(log => log.type === type).length;
    });
    
    // Calculate sales statistics
    const salesLogs = logs.filter(log => log.type === LOG_TYPES.SALE);
    const totalSales = salesLogs.reduce((sum, log) => sum + (log.data.total || 0), 0);
    const totalTax = salesLogs.reduce((sum, log) => sum + (log.data.taxAmount || 0), 0);
    const totalItems = salesLogs.reduce((sum, log) => sum + (log.data.quantity || 0), 0);
    
    // Group sales by category
    const salesByCategory = {};
    salesLogs.forEach(log => {
      const category = log.data.productCategory || 'unknown';
      if (!salesByCategory[category]) {
        salesByCategory[category] = {
          count: 0,
          total: 0
        };
      }
      salesByCategory[category].count += log.data.quantity || 0;
      salesByCategory[category].total += log.data.total || 0;
    });
    
    // Group sales by payment method
    const salesByPaymentMethod = {};
    salesLogs.forEach(log => {
      const method = log.data.paymentMethod || 'unknown';
      if (!salesByPaymentMethod[method]) {
        salesByPaymentMethod[method] = {
          count: 0,
          total: 0
        };
      }
      salesByPaymentMethod[method].count++;
      salesByPaymentMethod[method].total += log.data.total || 0;
    });
    
    return {
      logCounts,
      totalSales,
      totalTax,
      totalItems,
      salesByCategory,
      salesByPaymentMethod,
      totalLogs: logs.length
    };
  } catch (error) {
    console.error('Error getting compliance statistics:', error);
    throw error;
  }
};

/**
 * Check compliance status
 * @returns {Promise<Object>} The compliance status
 */
export const checkComplianceStatus = async () => {
  try {
    const settings = await getComplianceSettings();
    const provincialRequirements = getProvincialRequirements(settings.province);
    const upcomingDeadlines = await getUpcomingDeadlines(settings.notifyDays);
    
    // Get logs for the current reporting period
    const today = new Date();
    let startDate;
    
    switch (provincialRequirements.salesReportingFrequency) {
      case 'daily':
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1); // Start of month
        break;
      default:
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
    }
    
    const logs = await getComplianceLogs({
      startDate: startDate.toISOString()
    });
    
    // Check for missing required fields in sales logs
    const salesLogs = logs.filter(log => log.type === LOG_TYPES.SALE);
    const missingFields = [];
    
    salesLogs.forEach(log => {
      provincialRequirements.requiredFields.forEach(field => {
        if (!log.data[field]) {
          missingFields.push({
            logId: log.id,
            field
          });
        }
      });
    });
    
    return {
      province: settings.province,
      provinceName: PROVINCES[settings.province],
      reportingFrequency: provincialRequirements.salesReportingFrequency,
      upcomingDeadlines,
      currentPeriodLogs: logs.length,
      salesLogs: salesLogs.length,
      missingFields,
      compliant: missingFields.length === 0,
      nextReportingDate: getNextReportingDate(settings.province, provincialRequirements.salesReportingFrequency)
    };
  } catch (error) {
    console.error('Error checking compliance status:', error);
    throw error;
  }
};

/**
 * Get the next reporting date
 * @param {string} province - The province code
 * @param {string} frequency - The reporting frequency
 * @returns {string} The next reporting date (ISO string)
 */
const getNextReportingDate = (province, frequency) => {
  const today = new Date();
  let nextDate;
  
  switch (frequency) {
    case 'daily':
      nextDate = new Date(today);
      nextDate.setDate(today.getDate() + 1);
      break;
    case 'weekly':
      nextDate = new Date(today);
      nextDate.setDate(today.getDate() + (7 - today.getDay())); // Next Sunday
      break;
    case 'monthly':
      nextDate = new Date(today.getFullYear(), today.getMonth() + 1, 1); // First day of next month
      break;
    default:
      nextDate = new Date(today);
      nextDate.setDate(today.getDate() + 1);
  }
  
  return nextDate.toISOString();
};