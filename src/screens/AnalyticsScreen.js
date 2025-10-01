import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Dimensions,
  RefreshControl,
  Alert
} from 'react-native';
import {
  Surface,
  Title,
  Card,
  Text,
  Button,
  Chip,
  DataTable,
  ActivityIndicator,
  Divider
} from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { theme } from '../theme/theme';
import { getDashboardAnalytics, getSalesTrends, exportAnalyticsData } from '../services/analyticsService';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

const AnalyticsScreen = () => {
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsData, trendsData] = await Promise.all([
        getDashboardAnalytics(selectedPeriod),
        getSalesTrends(30)
      ]);
      setAnalytics(analyticsData);
      setTrends(trendsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const handleExport = async () => {
    try {
      const data = await exportAnalyticsData(selectedPeriod);
      const fileName = `analytics_${selectedPeriod}_${Date.now()}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, data);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', 'Analytics data exported successfully');
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
      Alert.alert('Error', 'Failed to export analytics data');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading Analytics...</Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No analytics data available</Text>
      </View>
    );
  }

  // Prepare chart data
  const salesChartData = {
    labels: trends.slice(-7).map(t => new Date(t.date).getDate().toString()),
    datasets: [{
      data: trends.slice(-7).map(t => t.revenue)
    }]
  };

  const categoryChartData = analytics.categories.slice(0, 5).map((cat, index) => ({
    name: cat.category,
    population: cat.revenue,
    color: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'][index],
    legendFontColor: theme.colors.text,
    legendFontSize: 12
  }));

  const strainTypeChartData = {
    labels: analytics.strainTypes.map(st => st.type),
    datasets: [{
      data: analytics.strainTypes.map(st => st.revenue)
    }]
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Period Selection */}
      <View style={styles.periodContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['today', 'week', 'month', 'year', 'all'].map(period => (
            <Chip
              key={period}
              selected={selectedPeriod === period}
              onPress={() => setSelectedPeriod(period)}
              style={styles.periodChip}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.summaryLabel}>Total Sales</Text>
            <Title style={styles.summaryValue}>{analytics.sales.totalSales}</Title>
          </Card.Content>
        </Card>

        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.summaryLabel}>Revenue</Text>
            <Title style={styles.summaryValue}>
              ${analytics.sales.totalRevenue.toFixed(2)}
            </Title>
          </Card.Content>
        </Card>

        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.summaryLabel}>Avg Order</Text>
            <Title style={styles.summaryValue}>
              ${analytics.sales.averageOrderValue.toFixed(2)}
            </Title>
          </Card.Content>
        </Card>

        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.summaryLabel}>Products</Text>
            <Title style={styles.summaryValue}>
              {analytics.inventory.totalProducts}
            </Title>
          </Card.Content>
        </Card>
      </View>

      {/* Sales Trend Chart */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Title style={styles.chartTitle}>Sales Trend (Last 7 Days)</Title>
          <LineChart
            data={salesChartData}
            width={width - 60}
            height={220}
            chartConfig={{
              backgroundColor: theme.colors.surface,
              backgroundGradientFrom: theme.colors.surface,
              backgroundGradientTo: theme.colors.surface,
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
              labelColor: (opacity = 1) => theme.colors.text,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: theme.colors.primary
              }
            }}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Category Distribution */}
      {categoryChartData.length > 0 && (
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title style={styles.chartTitle}>Revenue by Category</Title>
            <PieChart
              data={categoryChartData}
              width={width - 60}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </Card.Content>
        </Card>
      )}

      {/* Strain Type Distribution */}
      {analytics.strainTypes.length > 0 && (
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title style={styles.chartTitle}>Revenue by Strain Type</Title>
            <BarChart
              data={strainTypeChartData}
              width={width - 60}
              height={220}
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                labelColor: (opacity = 1) => theme.colors.text,
              }}
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}

      {/* Top Products Table */}
      <Card style={styles.tableCard}>
        <Card.Content>
          <Title style={styles.tableTitle}>Top Selling Products</Title>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Product</DataTable.Title>
              <DataTable.Title numeric>Qty</DataTable.Title>
              <DataTable.Title numeric>Revenue</DataTable.Title>
            </DataTable.Header>

            {analytics.topProducts.slice(0, 10).map((product, index) => (
              <DataTable.Row key={index}>
                <DataTable.Cell>{product.name}</DataTable.Cell>
                <DataTable.Cell numeric>{product.quantitySold}</DataTable.Cell>
                <DataTable.Cell numeric>
                  ${product.revenue.toFixed(2)}
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>

      {/* Inventory Status */}
      <Card style={styles.tableCard}>
        <Card.Content>
          <Title style={styles.tableTitle}>Inventory Status</Title>
          <View style={styles.inventoryStats}>
            <View style={styles.inventoryStat}>
              <Text style={styles.inventoryLabel}>Total Stock</Text>
              <Text style={styles.inventoryValue}>
                {analytics.inventory.totalStock}
              </Text>
            </View>
            <View style={styles.inventoryStat}>
              <Text style={styles.inventoryLabel}>Total Value</Text>
              <Text style={styles.inventoryValue}>
                ${analytics.inventory.totalValue.toFixed(2)}
              </Text>
            </View>
            <View style={styles.inventoryStat}>
              <Text style={styles.inventoryLabel}>Low Stock</Text>
              <Text style={[styles.inventoryValue, styles.warningText]}>
                {analytics.inventory.lowStockCount}
              </Text>
            </View>
            <View style={styles.inventoryStat}>
              <Text style={styles.inventoryLabel}>Out of Stock</Text>
              <Text style={[styles.inventoryValue, styles.errorText]}>
                {analytics.inventory.outOfStockCount}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Export Button */}
      <Button
        mode="contained"
        onPress={handleExport}
        style={styles.exportButton}
        icon="download"
      >
        Export Analytics Data
      </Button>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  periodContainer: {
    padding: 15,
    backgroundColor: theme.colors.surface,
  },
  periodChip: {
    marginRight: 10,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  summaryCard: {
    width: (width - 40) / 2,
    margin: 5,
    backgroundColor: theme.colors.surface,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  chartCard: {
    margin: 15,
    backgroundColor: theme.colors.surface,
  },
  chartTitle: {
    fontSize: 18,
    marginBottom: 15,
    color: theme.colors.text,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  tableCard: {
    margin: 15,
    backgroundColor: theme.colors.surface,
  },
  tableTitle: {
    fontSize: 18,
    marginBottom: 10,
    color: theme.colors.text,
  },
  inventoryStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  inventoryStat: {
    width: '50%',
    padding: 10,
    alignItems: 'center',
  },
  inventoryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 5,
  },
  inventoryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  warningText: {
    color: '#FF9800',
  },
  errorText: {
    color: '#F44336',
  },
  exportButton: {
    margin: 15,
  },
  bottomPadding: {
    height: 30,
  },
});

export default AnalyticsScreen;