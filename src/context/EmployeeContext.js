import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseAuth } from '../services/firebaseAuth';

const EmployeeContext = createContext();

export const useEmployee = () => {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error('useEmployee must be used within an EmployeeProvider');
  }
  return context;
};

export const EmployeeProvider = ({ children }) => {
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [payrollData, setPayrollData] = useState(null);

  // Employee data structure
  const [employees] = useState([
    {
      id: 'EMP001',
      employeeId: 'EMP001',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah@cannaflow.com',
      pin: '1234',
      role: 'budtender',
      hourlyRate: 18.50,
      department: 'Sales',
      startDate: '2024-01-15',
      status: 'active'
    },
    {
      id: 'EMP002',
      employeeId: 'EMP002', 
      firstName: 'Mike',
      lastName: 'Chen',
      email: 'mike@cannaflow.com',
      pin: '5678',
      role: 'manager',
      hourlyRate: 25.00,
      department: 'Management',
      startDate: '2023-11-01',
      status: 'active'
    },
    {
      id: 'EMP003',
      employeeId: 'EMP003',
      firstName: 'Lisa',
      lastName: 'Rodriguez',
      email: 'lisa@cannaflow.com',
      pin: '9012',
      role: 'security',
      hourlyRate: 20.00,
      department: 'Security',
      startDate: '2024-03-01',
      status: 'active'
    }
  ]);

  useEffect(() => {
    loadEmployeeData();
  }, []);

  const loadEmployeeData = async () => {
    try {
      const savedEmployee = await AsyncStorage.getItem('@current_employee');
      const savedTimeEntries = await AsyncStorage.getItem('@time_entries');
      const savedIsClockedIn = await AsyncStorage.getItem('@is_clocked_in');
      const savedCurrentShift = await AsyncStorage.getItem('@current_shift');

      if (savedEmployee) setCurrentEmployee(JSON.parse(savedEmployee));
      if (savedTimeEntries) setTimeEntries(JSON.parse(savedTimeEntries));
      if (savedIsClockedIn) setIsClockedIn(JSON.parse(savedIsClockedIn));
      if (savedCurrentShift) setCurrentShift(JSON.parse(savedCurrentShift));
    } catch (error) {
      console.error('Error loading employee data:', error);
    }
  };

  const authenticateEmployee = async (employeeId, pin) => {
    const employee = employees.find(emp => emp.employeeId === employeeId && emp.pin === pin);
    
    if (employee) {
      setCurrentEmployee(employee);
      await AsyncStorage.setItem('@current_employee', JSON.stringify(employee));
      
      // Log the login activity
      await firebaseAuth.logActivity('EMPLOYEE_LOGIN', {
        employeeId: employee.employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        role: employee.role
      });
      
      return { success: true, employee };
    } else {
      return { success: false, message: 'Invalid employee ID or PIN' };
    }
  };

  const clockIn = async () => {
    if (!currentEmployee) {
      return { success: false, message: 'No employee logged in' };
    }

    if (isClockedIn) {
      return { success: false, message: 'Already clocked in' };
    }

    const now = new Date();
    const newShift = {
      id: `SHIFT_${Date.now()}`,
      employeeId: currentEmployee.employeeId,
      clockInTime: now.toISOString(),
      clockOutTime: null,
      totalHours: 0,
      breakDuration: 0,
      status: 'active'
    };

    setCurrentShift(newShift);
    setIsClockedIn(true);
    
    await AsyncStorage.setItem('@current_shift', JSON.stringify(newShift));
    await AsyncStorage.setItem('@is_clocked_in', 'true');

    // Log clock-in activity
    await firebaseAuth.logActivity('CLOCK_IN', {
      employeeId: currentEmployee.employeeId,
      shiftId: newShift.id,
      timestamp: now.toISOString()
    });

    return { success: true, shift: newShift };
  };

  const clockOut = async () => {
    if (!currentEmployee || !isClockedIn || !currentShift) {
      return { success: false, message: 'Not clocked in' };
    }

    const now = new Date();
    const clockOutTime = now;
    const clockInTime = new Date(currentShift.clockInTime);
    const totalHours = (clockOutTime - clockInTime) / (1000 * 60 * 60); // Convert to hours

    const updatedShift = {
      ...currentShift,
      clockOutTime: clockOutTime.toISOString(),
      totalHours: totalHours,
      status: 'completed'
    };

    // Add to time entries
    const newTimeEntries = [...timeEntries, updatedShift];
    setTimeEntries(newTimeEntries);
    setCurrentShift(null);
    setIsClockedIn(false);

    await AsyncStorage.setItem('@time_entries', JSON.stringify(newTimeEntries));
    await AsyncStorage.removeItem('@current_shift');
    await AsyncStorage.setItem('@is_clocked_in', 'false');

    // Log clock-out activity
    await firebaseAuth.logActivity('CLOCK_OUT', {
      employeeId: currentEmployee.employeeId,
      shiftId: updatedShift.id,
      totalHours: totalHours,
      timestamp: now.toISOString()
    });

    return { success: true, shift: updatedShift };
  };

  const calculatePayroll = (startDate, endDate) => {
    if (!currentEmployee) return null;

    const filteredEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.clockInTime);
      return entryDate >= startDate && entryDate <= endDate && entry.status === 'completed';
    });

    const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
    const regularHours = Math.min(totalHours, 40);
    const overtimeHours = Math.max(totalHours - 40, 0);
    
    const regularPay = regularHours * currentEmployee.hourlyRate;
    const overtimePay = overtimeHours * currentEmployee.hourlyRate * 1.5;
    const grossPay = regularPay + overtimePay;

    // Calculate deductions (simplified)
    const taxRate = 0.22; // Federal + State estimate
    const otherDeductions = 0.05; // Benefits, etc.
    const totalDeductions = grossPay * (taxRate + otherDeductions);
    const netPay = grossPay - totalDeductions;

    return {
      employeeId: currentEmployee.employeeId,
      employeeName: `${currentEmployee.firstName} ${currentEmployee.lastName}`,
      payPeriod: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      totalHours: totalHours,
      regularHours: regularHours,
      overtimeHours: overtimeHours,
      hourlyRate: currentEmployee.hourlyRate,
      regularPay: regularPay,
      overtimePay: overtimePay,
      grossPay: grossPay,
      deductions: totalDeductions,
      netPay: netPay,
      timeEntries: filteredEntries.length
    };
  };

  const getEmployeePerformance = () => {
    if (!currentEmployee) return null;

    const employeeEntries = timeEntries.filter(entry => entry.employeeId === currentEmployee.employeeId);
    const totalHours = employeeEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
    const totalShifts = employeeEntries.length;
    const averageHoursPerShift = totalShifts > 0 ? totalHours / totalShifts : 0;

    return {
      employeeId: currentEmployee.employeeId,
      totalHours: totalHours,
      totalShifts: totalShifts,
      averageHoursPerShift: averageHoursPerShift,
      currentStatus: isClockedIn ? 'Clocked In' : 'Clocked Out',
      currentShift: currentShift
    };
  };

  const value = {
    employees,
    currentEmployee,
    timeEntries,
    isClockedIn,
    currentShift,
    authenticateEmployee,
    clockIn,
    clockOut,
    calculatePayroll,
    getEmployeePerformance
  };

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
};

export default EmployeeContext;