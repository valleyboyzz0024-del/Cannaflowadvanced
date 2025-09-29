import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { AIContext } from '../context/AIContext';
import {
  getComplianceLogs,
  getComplianceStats,
  exportLogs,
  EXPORT_FORMATS,
  LOG_TYPES,
  checkComplianceStatus,
  getUpcomingDeadlines,
  PROVINCES
} from '../services/complianceEngine';

const screenWidth = Dimensions.get('window').width;

const ComplianceDashboard = ({ onClose }) => {
  const theme = useTheme();
  const { complianceSettings } = useContext(AIContext);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [complianceStatus, setComplianceStatus] = useState(null);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
    endDate: new Date()
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('start'); // 'start' or 'end'
  const [exportFormat, setExportFormat] = useState(EXPORT_FORMATS.PDF);
  const [isExporting, setIsExporting] = useState(false);
  
  useEffect(() => {
    loadData();
  }, [dateRange]);
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Get compliance statistics
      const statsData = await getComplianceStats(
        dateRange.startDate.toISOString(),
        dateRange.endDate.toISOString()
      );
      setStats(statsData);
      
      // Check compliance status
      const status = await checkComplianceStatus();
      setComplianceStatus(status);
      
      // Get upcoming deadlines
      const deadlines = await getUpcomingDeadlines(30); // Next 30 days
      setUpcomingDeadlines(deadlines);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading compliance data:', error);
      Alert.alert('Error', 'Failed to load compliance data');
      setIsLoading(false);
    }
  };
  
  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const fileUri = await exportLogs(exportFormat, {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
      });
      
      setIsExporting(false);
      Alert.alert('Success', `Logs exported successfully as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting logs:', error);
      Alert.alert('Error', `Failed to export logs: ${error.message}`);
      setIsExporting(false);
    }
  };
  
  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setDateRange(prev => ({
        ...prev,
        [datePickerMode === 'start' ? 'startDate' : 'endDate']: selectedDate
      }));
    }
  };
  
  const showDatePickerModal = (mode) => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };
  
  const renderOverviewTab = () => {
    if (!stats || !complianceStatus) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading compliance data...</Text>
        </View>
      );
    }
    
    // Prepare chart data
    const salesData = {
      labels: Object.keys(stats.salesByCategory).slice(0, 5), // Top 5 categories
      datasets: [
        {
          data: Object.values(stats.salesByCategory).map(item => item.total).slice(0, 5),
          color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ['Sales by Category']
    };
    
    const logCountData = {
      labels: Object.keys(stats.logCounts).filter(key => stats.logCounts[key] > 0),
      datasets: [
        {
          data: Object.values(stats.logCounts).filter(count => count > 0)
        }
      ]
    };
    
    const paymentMethodData = Object.entries(stats.salesByPaymentMethod).map(([method, data]) => ({
      name: method,
      count: data.count,
      color: getRandomColor(),
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    }));
    
    return (
      <ScrollView style={styles.tabContent}>
        {/* Compliance Status */}
        <View style={[
          styles.statusCard,
          { backgroundColor: complianceStatus.compliant ? '#E8F5E9' : '#FFEBEE' }
        ]}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={complianceStatus.compliant ? 'checkmark-circle' : 'alert-circle'}
              size={24}
              color={complianceStatus.compliant ? '#2E7D32' : '#C62828'}
            />
            <Text style={[
              styles.statusTitle,
              { color: complianceStatus.compliant ? '#2E7D32' : '#C62828' }
            ]}>
              {complianceStatus.compliant ? 'Compliant' : 'Compliance Issues Detected'}
            </Text>
          </View>
          
          <Text style={styles.statusText}>
            Province: {complianceStatus.provinceName}
          </Text>
          <Text style={styles.statusText}>
            Reporting Frequency: {complianceStatus.reportingFrequency.charAt(0).toUpperCase() + complianceStatus.reportingFrequency.slice(1)}
          </Text>
          <Text style={styles.statusText}>
            Next Report Due: {new Date(complianceStatus.nextReportingDate).toLocaleDateString()}
          </Text>
          
          {!complianceStatus.compliant && (
            <View style={styles.issuesContainer}>
              <Text style={styles.issuesTitle}>Issues Found:</Text>
              {complianceStatus.missingFields.slice(0, 3).map((issue, index) => (
                <Text key={index} style={styles.issueText}>
                  • Missing {issue.field} in log {issue.logId.substring(0, 8)}...
                </Text>
              ))}
              {complianceStatus.missingFields.length > 3 && (
                <Text style={styles.issueText}>
                  • And {complianceStatus.missingFields.length - 3} more issues...
                </Text>
              )}
            </View>
          )}
        </View>
        
        {/* Sales Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sales Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${stats.totalSales.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Sales</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${stats.totalTax.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Tax</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalItems}</Text>
              <Text style={styles.statLabel}>Items Sold</Text>
            </View>
          </View>
        </View>
        
        {/* Sales by Category Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sales by Category</Text>
          {Object.keys(stats.salesByCategory).length > 0 ? (
            <BarChart
              data={salesData}
              width={screenWidth - 40}
              height={220}
              yAxisLabel="$"
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16
                }
              }}
              style={styles.chart}
            />
          ) : (
            <Text style={styles.noDataText}>No sales data available</Text>
          )}
        </View>
        
        {/* Log Distribution */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Log Distribution</Text>
          {Object.values(stats.logCounts).some(count => count > 0) ? (
            <PieChart
              data={logCountData.labels.map((label, index) => ({
                name: label.replace(/_/g, ' '),
                count: logCountData.datasets[0].data[index],
                color: getRandomColor(),
                legendFontColor: '#7F7F7F',
                legendFontSize: 12
              }))}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          ) : (
            <Text style={styles.noDataText}>No log data available</Text>
          )}
        </View>
        
        {/* Payment Methods */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Methods</Text>
          {paymentMethodData.length > 0 ? (
            <PieChart
              data={paymentMethodData}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          ) : (
            <Text style={styles.noDataText}>No payment method data available</Text>
          )}
        </View>
        
        {/* Upcoming Deadlines */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Upcoming Deadlines</Text>
          {upcomingDeadlines.length > 0 ? (
            upcomingDeadlines.map((deadline, index) => (
              <View key={index} style={styles.deadlineItem}>
                <View style={styles.deadlineDate}>
                  <Text style={styles.deadlineDay}>
                    {new Date(deadline.date).getDate()}
                  </Text>
                  <Text style={styles.deadlineMonth}>
                    {new Date(deadline.date).toLocaleString('default', { month: 'short' })}
                  </Text>
                </View>
                <View style={styles.deadlineInfo}>
                  <Text style={styles.deadlineTitle}>{deadline.description}</Text>
                  <Text style={styles.deadlineSubtitle}>
                    {Math.ceil((new Date(deadline.date) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No upcoming deadlines</Text>
          )}
        </View>
      </ScrollView>
    );
  };
  
  const renderReportsTab = () => {
    return (
      <ScrollView style={styles.tabContent}>
        {/* Date Range Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Date Range</Text>
          <View style={styles.dateRangeContainer}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => showDatePickerModal('start')}
            >
              <Text style={styles.dateButtonLabel}>Start Date:</Text>
              <Text style={styles.dateButtonValue}>
                {dateRange.startDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => showDatePickerModal('end')}
            >
              <Text style={styles.dateButtonLabel}>End Date:</Text>
              <Text style={styles.dateButtonValue}>
                {dateRange.endDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>
          
          {showDatePicker && (
            <DateTimePicker
              value={datePickerMode === 'start' ? dateRange.startDate : dateRange.endDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>
        
        {/* Export Options */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Export Reports</Text>
          <Text style={styles.exportDescription}>
            Export compliance logs and reports for the selected date range.
          </Text>
          
          <View style={styles.formatSelector}>
            <Text style={styles.formatLabel}>Format:</Text>
            <View style={styles.formatOptions}>
              {Object.values(EXPORT_FORMATS).map((format) => (
                <TouchableOpacity
                  key={format}
                  style={[
                    styles.formatOption,
                    exportFormat === format && styles.formatOptionSelected
                  ]}
                  onPress={() => setExportFormat(format)}
                >
                  <Text
                    style={[
                      styles.formatOptionText,
                      exportFormat === format && styles.formatOptionTextSelected
                    ]}
                  >
                    {format.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.exportButtonText}>
                Export {exportFormat.toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Report Types */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Available Reports</Text>
          
          <TouchableOpacity style={styles.reportItem}>
            <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>Sales Report</Text>
              <Text style={styles.reportDescription}>
                Detailed sales transactions with tax calculations
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.reportItem}>
            <Ionicons name="bar-chart-outline" size={24} color={theme.colors.primary} />
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>Inventory Report</Text>
              <Text style={styles.reportDescription}>
                Inventory changes and adjustments
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.reportItem}>
            <Ionicons name="cash-outline" size={24} color={theme.colors.primary} />
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>Cash Float Report</Text>
              <Text style={styles.reportDescription}>
                Cash drawer activity and reconciliation
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.reportItem}>
            <Ionicons name="people-outline" size={24} color={theme.colors.primary} />
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>Employee Activity</Text>
              <Text style={styles.reportDescription}>
                Staff actions and audit trail
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.reportItem}>
            <Ionicons name="trash-outline" size={24} color={theme.colors.primary} />
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>Waste Management</Text>
              <Text style={styles.reportDescription}>
                Cannabis waste tracking and disposal
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };
  
  const renderSettingsTab = () => {
    return (
      <ScrollView style={styles.tabContent}>
        {/* Province Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Compliance Settings</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Province:</Text>
            <Text style={styles.settingValue}>
              {complianceSettings?.province} - {PROVINCES[complianceSettings?.province]}
            </Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Business Name:</Text>
            <Text style={styles.settingValue}>{complianceSettings?.businessName}</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>License Number:</Text>
            <Text style={styles.settingValue}>{complianceSettings?.licenseNumber}</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Location:</Text>
            <Text style={styles.settingValue}>{complianceSettings?.location}</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Retention Period:</Text>
            <Text style={styles.settingValue}>{complianceSettings?.retentionPeriod} years</Text>
          </View>
          
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Settings</Text>
          </TouchableOpacity>
        </View>
        
        {/* Auto-Export Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Auto-Export Settings</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Auto-Export:</Text>
            <Text style={styles.settingValue}>
              {complianceSettings?.autoExport ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          
          {complianceSettings?.autoExport && (
            <>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Export Format:</Text>
                <Text style={styles.settingValue}>
                  {complianceSettings?.exportFormat?.toUpperCase()}
                </Text>
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Export Schedule:</Text>
                <Text style={styles.settingValue}>
                  {complianceSettings?.exportSchedule?.charAt(0).toUpperCase() + complianceSettings?.exportSchedule?.slice(1)}
                </Text>
              </View>
            </>
          )}
          
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Configure Auto-Export</Text>
          </TouchableOpacity>
        </View>
        
        {/* Advanced Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Advanced Settings</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Notification Days:</Text>
            <Text style={styles.settingValue}>
              {complianceSettings?.notifyDays} days before deadlines
            </Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Audit Trail:</Text>
            <Text style={styles.settingValue}>
              {complianceSettings?.enableAuditTrail ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Employee Tracking:</Text>
            <Text style={styles.settingValue}>
              {complianceSettings?.trackEmployeeActivity ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Waste Management:</Text>
            <Text style={styles.settingValue}>
              {complianceSettings?.trackWasteManagement ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Advanced Configuration</Text>
          </TouchableOpacity>
        </View>
        
        {/* Data Management */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data Management</Text>
          
          <TouchableOpacity style={styles.dangerButton}>
            <Text style={styles.dangerButtonText}>Import Compliance Logs</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.dangerButton, { backgroundColor: '#FFEBEE' }]}>
            <Text style={[styles.dangerButtonText, { color: '#C62828' }]}>Clear All Logs</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };
  
  const getRandomColor = () => {
    const colors = [
      '#4CAF50', '#8BC34A', '#CDDC39', '#2196F3', '#3F51B5',
      '#9C27B0', '#E91E63', '#F44336', '#FF9800', '#FFC107'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Compliance Dashboard</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons
            name="pie-chart"
            size={20}
            color={activeTab === 'overview' ? theme.colors.primary : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'overview' && styles.activeTabText
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
          onPress={() => setActiveTab('reports')}
        >
          <Ionicons
            name="document-text"
            size={20}
            color={activeTab === 'reports' ? theme.colors.primary : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'reports' && styles.activeTabText
            ]}
          >
            Reports
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons
            name="settings"
            size={20}
            color={activeTab === 'settings' ? theme.colors.primary : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'settings' && styles.activeTabText
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'reports' && renderReportsTab()}
      {activeTab === 'settings' && renderSettingsTab()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  closeButton: {
    padding: 4
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2E7D32'
  },
  tabText: {
    marginLeft: 8,
    color: '#666',
    fontWeight: '500'
  },
  activeTabText: {
    color: '#2E7D32',
    fontWeight: 'bold'
  },
  tabContent: {
    flex: 1,
    padding: 16
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 10,
    color: '#666'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333'
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  statItem: {
    alignItems: 'center',
    flex: 1
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32'
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20
  },
  statusCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#2E7D32'
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4
  },
  issuesContainer: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 4,
    padding: 12
  },
  issuesTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#C62828'
  },
  issueText: {
    color: '#333',
    marginBottom: 4
  },
  deadlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    padding: 8
  },
  deadlineDate: {
    width: 50,
    height: 50,
    backgroundColor: '#2E7D32',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  deadlineDay: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18
  },
  deadlineMonth: {
    color: 'white',
    fontSize: 12
  },
  deadlineInfo: {
    flex: 1
  },
  deadlineTitle: {
    fontWeight: 'bold',
    color: '#333'
  },
  deadlineSubtitle: {
    color: '#666',
    fontSize: 12
  },
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 12,
    marginHorizontal: 4
  },
  dateButtonLabel: {
    color: '#666',
    fontSize: 12
  },
  dateButtonValue: {
    color: '#333',
    fontWeight: 'bold',
    marginTop: 4
  },
  exportDescription: {
    color: '#666',
    marginBottom: 16
  },
  formatSelector: {
    marginBottom: 16
  },
  formatLabel: {
    color: '#666',
    marginBottom: 8
  },
  formatOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  formatOption: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4
  },
  formatOptionSelected: {
    backgroundColor: '#2E7D32'
  },
  formatOptionText: {
    color: '#333'
  },
  formatOptionTextSelected: {
    color: 'white',
    fontWeight: 'bold'
  },
  exportButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center'
  },
  exportButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  reportInfo: {
    flex: 1,
    marginLeft: 12
  },
  reportTitle: {
    fontWeight: 'bold',
    color: '#333'
  },
  reportDescription: {
    color: '#666',
    fontSize: 12
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  settingLabel: {
    color: '#666'
  },
  settingValue: {
    color: '#333',
    fontWeight: '500'
  },
  editButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    marginTop: 16
  },
  editButtonText: {
    color: '#2E7D32',
    fontWeight: 'bold'
  },
  dangerButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    marginTop: 8
  },
  dangerButtonText: {
    color: '#333',
    fontWeight: 'bold'
  }
});

export default ComplianceDashboard;