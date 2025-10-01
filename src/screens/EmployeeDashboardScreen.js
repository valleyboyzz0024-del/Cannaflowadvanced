import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Dimensions } from 'react-native';
import { Surface, Title, Text, Button, Card, Chip, DataTable, Divider, ProgressBar } from 'react-native-paper';
import { theme } from '../theme/theme';
import { useEmployee } from '../context/EmployeeContext';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

const EmployeeDashboardScreen = ({ navigation }) => {
  const { 
    currentEmployee, 
    isClockedIn, 
    currentShift, 
    clockIn, 
    clockOut, 
    calculatePayroll,
    getEmployeePerformance 
  } = useEmployee();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [shiftDuration, setShiftDuration] = useState(0);
  const [payrollData, setPayrollData] = useState(null);
  const [performance, setPerformance] = useState(null);

  useEffect(() => {
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isClockedIn && currentShift) {
      const clockInTime = new Date(currentShift.clockInTime);
      const duration = (currentTime - clockInTime) / (1000 * 60 * 60); // Hours
      setShiftDuration(duration);
    } else {
      setShiftDuration(0);
    }
  }, [currentTime, isClockedIn, currentShift]);

  useEffect(() => {
    // Calculate current pay period payroll
    if (currentEmployee) {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const payroll = calculatePayroll(startOfWeek, endOfWeek);
      setPayrollData(payroll);

      const perf = getEmployeePerformance();
      setPerformance(perf);
    }
  }, [currentEmployee, calculatePayroll, getEmployeePerformance]);

  const handleClockAction = async () => {
    if (isClockedIn) {
      const result = await clockOut();
      if (result.success) {
        // Update payroll after clocking out
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const updatedPayroll = calculatePayroll(startOfWeek, endOfWeek);
        setPayrollData(updatedPayroll);
      }
    } else {
      const result = await clockIn();
      if (result.success) {
        // Refresh performance metrics
        const updatedPerf = getEmployeePerformance();
        setPerformance(updatedPerf);
      }
    }
  };

  const formatDuration = (hours) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.floor((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (!currentEmployee) {
    return (
      <View style={styles.container}>
        <Surface style={styles.header}>
          <Title style={styles.title}>Employee Dashboard</Title>
          <Text style={styles.subtitle}>Please log in to access employee features</Text>
        </Surface>
        <View style={styles.centerContent}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('EmployeeLogin')}
            style={styles.loginButton}
            icon="login"
          >
            Employee Login
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Surface style={styles.header}>
        <Title style={styles.title}>Employee Dashboard</Title>
        <Text style={styles.subtitle}>
          Welcome, {currentEmployee.firstName} {currentEmployee.lastName}
        </Text>
        <Chip style={styles.roleChip}>
          {currentEmployee.role}
        </Chip>
      </Surface>

      {/* Clock In/Out Section */}
      <Card style={styles.clockCard}>
        <Card.Title 
          title={isClockedIn ? "Current Shift" : "Ready to Work"} 
          left={(props) => <Text {...props}>{isClockedIn ? "🕐" : "✅"}</Text>} 
        />
        <Card.Content>
          {isClockedIn && currentShift ? (
            <View style={styles.shiftInfo}>
              <View style={styles.shiftRow}>
                <Text style={styles.shiftLabel}>Clocked In:</Text>
                <Text style={styles.shiftValue}>
                  {format(new Date(currentShift.clockInTime), 'h:mm a')}
                </Text>
              </View>
              <View style={styles.shiftRow}>
                <Text style={styles.shiftLabel}>Current Duration:</Text>
                <Text style={styles.shiftValue}>{formatDuration(shiftDuration)}</Text>
              </View>
              <ProgressBar 
                progress={Math.min(shiftDuration / 8, 1)} 
                style={styles.progressBar}
                color={theme.colors.primary}
              />
              <Text style={styles.progressText}>
                {formatDuration(shiftDuration)} / 8 hours
              </Text>
            </View>
          ) : (
            <View style={styles.readyContent}>
              <Text style={styles.readyText}>You're ready to start your shift!</Text>
              <Text style={styles.currentTime}>
                Current Time: {format(currentTime, 'h:mm a')}
              </Text>
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleClockAction}
            style={styles.clockButton}
            icon={isClockedIn ? "clock-out" : "clock-in"}
          >
            {isClockedIn ? "Clock Out" : "Clock In"}
          </Button>
        </Card.Content>
      </Card>

      {/* Payroll Summary */}
      {payrollData && (
        <Card style={styles.payrollCard}>
          <Card.Title title="This Week's Payroll" left={(props) => <Text {...props}>💰</Text>} />
          <Card.Content>
            <View style={styles.payrollGrid}>
              <View style={styles.payrollItem}>
                <Text style={styles.payrollLabel}>Total Hours</Text>
                <Text style={styles.payrollValue}>{payrollData.totalHours.toFixed(1)}</Text>
              </View>
              <View style={styles.payrollItem}>
                <Text style={styles.payrollLabel}>Regular Hours</Text>
                <Text style={styles.payrollValue}>{payrollData.regularHours}</Text>
              </View>
              <View style={styles.payrollItem}>
                <Text style={styles.payrollLabel}>Overtime Hours</Text>
                <Text style={styles.payrollValue}>{payrollData.overtimeHours}</Text>
              </View>
              <View style={styles.payrollItem}>
                <Text style={styles.payrollLabel}>Gross Pay</Text>
                <Text style={styles.payrollValue}>{formatCurrency(payrollData.grossPay)}</Text>
              </View>
              <View style={styles.payrollItem}>
                <Text style={styles.payrollLabel}>Net Pay</Text>
                <Text style={styles.payrollValue}>{formatCurrency(payrollData.netPay)}</Text>
              </View>
              <View style={styles.payrollItem}>
                <Text style={styles.payrollLabel}>Hourly Rate</Text>
                <Text style={styles.payrollValue}>{formatCurrency(currentEmployee.hourlyRate)}/hr</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Performance Metrics */}
      {performance && (
        <Card style={styles.performanceCard}>
          <Card.Title title="Performance Metrics" left={(props) => <Text {...props}>📊</Text>} />
          <Card.Content>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Metric</DataTable.Title>
                <DataTable.Title numeric>Value</DataTable.Title>
              </DataTable.Header>

              <DataTable.Row>
                <DataTable.Cell>Total Hours Worked</DataTable.Cell>
                <DataTable.Cell numeric>{performance.totalHours.toFixed(1)}</DataTable.Cell>
              </DataTable.Row>

              <DataTable.Row>
                <DataTable.Cell>Total Shifts</DataTable.Cell>
                <DataTable.Cell numeric>{performance.totalShifts}</DataTable.Cell>
              </DataTable.Row>

              <DataTable.Row>
                <DataTable.Cell>Avg Hours per Shift</DataTable.Cell>
                <DataTable.Cell numeric>{performance.averageHoursPerShift.toFixed(1)}</DataTable.Cell>
              </DataTable.Row>

              <DataTable.Row>
                <DataTable.Cell>Current Status</DataTable.Cell>
                <DataTable.Cell numeric>
                  <Chip mode="flat" style={styles.statusChip}>
                    {performance.currentStatus}
                  </Chip>
                </DataTable.Cell>
              </DataTable.Row>
            </DataTable>
          </Card.Content>
        </Card>
      )}

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Card.Title title="Quick Actions" left={(props) => <Text {...props}>⚡</Text>} />
        <Card.Content>
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('EmployeeTimeHistory')}
              style={styles.actionButton}
              icon="history"
            >
              Time History
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('EmployeePayrollDetails')}
              style={styles.actionButton}
              icon="file-document"
            >
              Payroll Details
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('EmployeePerformance')}
              style={styles.actionButton}
              icon="chart-line"
            >
              Performance
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Current Time Display */}
      <Card style={styles.timeCard}>
        <Card.Content style={styles.timeContent}>
          <Text style={styles.timeLabel}>Current Time</Text>
          <Text style={styles.timeValue}>{format(currentTime, 'h:mm:ss a')}</Text>
          <Text style={styles.dateValue}>{format(currentTime, 'EEEE, MMMM d, yyyy')}</Text>
        </Card.Content>
      </Card>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    padding: 24,
    backgroundColor: theme.colors.primary,
    elevation: 4,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
    marginTop: 4,
  },
  roleChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loginButton: {
    marginTop: 16,
  },
  clockCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  shiftInfo: {
    marginBottom: 16,
  },
  shiftRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  shiftLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  shiftValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  progressBar: {
    marginVertical: 8,
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  readyContent: {
    alignItems: 'center',
    padding: 16,
  },
  readyText: {
    fontSize: 18,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  currentTime: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  clockButton: {
    marginTop: 16,
  },
  payrollCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  payrollGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  payrollItem: {
    width: '48%',
    padding: 12,
    marginBottom: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
  },
  payrollLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  payrollValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  performanceCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  statusChip: {
    backgroundColor: theme.colors.primary,
  },
  actionsCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    marginBottom: 8,
  },
  timeCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  timeContent: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  dateValue: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  bottomPadding: {
    height: 32,
  },
});

export default EmployeeDashboardScreen;