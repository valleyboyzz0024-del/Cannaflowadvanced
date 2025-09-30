import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert
} from 'react-native';
import {
  Surface,
  Title,
  Card,
  Text,
  Button,
  FAB,
  Chip,
  DataTable
} from 'react-native-paper';
import { theme } from '../theme/theme';
import { useBusinessType } from '../context/BusinessTypeContext';

const { width } = Dimensions.get('window');

const GrowDashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    activePlants: 0,
    readyForHarvest: 0,
    totalBatches: 0,
    complianceStatus: 'Good'
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // TODO: Load actual grow data from database
    // For now, using mock data
    setStats({
      activePlants: 150,
      readyForHarvest: 25,
      totalBatches: 8,
      complianceStatus: 'Good'
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <Surface style={styles.header}>
          <Title style={styles.headerTitle}>Grow Operations Dashboard</Title>
          <Text style={styles.headerSubtitle}>Licensed Producer View</Text>
        </Surface>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statLabel}>Active Plants</Text>
              <Title style={styles.statValue}>{stats.activePlants}</Title>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statLabel}>Ready to Harvest</Text>
              <Title style={[styles.statValue, styles.successText]}>
                {stats.readyForHarvest}
              </Title>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statLabel}>Total Batches</Text>
              <Title style={styles.statValue}>{stats.totalBatches}</Title>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statLabel}>Compliance</Text>
              <Chip
                mode="flat"
                style={styles.complianceChip}
                textStyle={styles.complianceText}
              >
                {stats.complianceStatus}
              </Chip>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <Card style={styles.actionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Quick Actions</Title>
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                icon="sprout"
                onPress={() => Alert.alert('Coming Soon', 'Plant tracking feature')}
                style={styles.actionButton}
              >
                Add Plants
              </Button>
              <Button
                mode="contained"
                icon="scissors-cutting"
                onPress={() => Alert.alert('Coming Soon', 'Harvest management feature')}
                style={styles.actionButton}
              >
                Record Harvest
              </Button>
              <Button
                mode="contained"
                icon="package-variant"
                onPress={() => Alert.alert('Coming Soon', 'Batch tracking feature')}
                style={styles.actionButton}
              >
                New Batch
              </Button>
              <Button
                mode="contained"
                icon="clipboard-check"
                onPress={() => navigation.navigate('Compliance')}
                style={styles.actionButton}
              >
                Compliance
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Activity */}
        <Card style={styles.activityCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Recent Activity</Title>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Activity</DataTable.Title>
                <DataTable.Title>Date</DataTable.Title>
                <DataTable.Title>Status</DataTable.Title>
              </DataTable.Header>

              <DataTable.Row>
                <DataTable.Cell>Batch #007 Started</DataTable.Cell>
                <DataTable.Cell>Today</DataTable.Cell>
                <DataTable.Cell>
                  <Chip mode="flat" textStyle={styles.activeChip}>Active</Chip>
                </DataTable.Cell>
              </DataTable.Row>

              <DataTable.Row>
                <DataTable.Cell>Harvest Completed</DataTable.Cell>
                <DataTable.Cell>Yesterday</DataTable.Cell>
                <DataTable.Cell>
                  <Chip mode="flat" textStyle={styles.completeChip}>Complete</Chip>
                </DataTable.Cell>
              </DataTable.Row>

              <DataTable.Row>
                <DataTable.Cell>Compliance Check</DataTable.Cell>
                <DataTable.Cell>2 days ago</DataTable.Cell>
                <DataTable.Cell>
                  <Chip mode="flat" textStyle={styles.passedChip}>Passed</Chip>
                </DataTable.Cell>
              </DataTable.Row>
            </DataTable>
          </Card.Content>
        </Card>

        {/* Grow Rooms Status */}
        <Card style={styles.roomsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Grow Rooms</Title>
            <View style={styles.roomsList}>
              {['Veg Room 1', 'Veg Room 2', 'Flower Room 1', 'Flower Room 2'].map((room, index) => (
                <Card key={index} style={styles.roomCard}>
                  <Card.Content>
                    <Text style={styles.roomName}>{room}</Text>
                    <Text style={styles.roomStatus}>
                      {index < 2 ? '45 plants' : '60 plants'}
                    </Text>
                    <Text style={styles.roomTemp}>
                      Temp: {22 + index}°C | Humidity: {55 + index * 2}%
                    </Text>
                  </Card.Content>
                </Card>
              ))}
            </View>
          </Card.Content>
        </Card>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        label="New Entry"
        onPress={() => Alert.alert('Coming Soon', 'Quick entry feature')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: theme.colors.primary,
    elevation: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    width: (width - 40) / 2,
    margin: 5,
    backgroundColor: theme.colors.surface,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  successText: {
    color: '#4CAF50',
  },
  complianceChip: {
    backgroundColor: '#4CAF50',
    marginTop: 5,
  },
  complianceText: {
    color: '#fff',
  },
  actionCard: {
    margin: 15,
    backgroundColor: theme.colors.surface,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 15,
    color: theme.colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 60) / 2,
    marginBottom: 10,
  },
  activityCard: {
    margin: 15,
    backgroundColor: theme.colors.surface,
  },
  activeChip: {
    color: '#2196F3',
  },
  completeChip: {
    color: '#4CAF50',
  },
  passedChip: {
    color: '#4CAF50',
  },
  roomsCard: {
    margin: 15,
    backgroundColor: theme.colors.surface,
  },
  roomsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  roomCard: {
    width: (width - 50) / 2,
    marginBottom: 10,
    backgroundColor: theme.colors.background,
  },
  roomName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  roomStatus: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 5,
  },
  roomTemp: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  bottomPadding: {
    height: 80,
  },
});

export default GrowDashboardScreen;