import { getSales, getProducts, getSaleDetails } from '../database/database';

/**
 * Analytics Service
 * Provides comprehensive analytics and insights for business operations
 */

// Get sales analytics for a date range
export const getSalesAnalytics = async (startDate = null, endDate = null) => {
  try {
    const sales = await getSales(startDate, endDate);
    
    if (sales.length === 0) {
      return {
        totalSales: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        salesByDate: {},
        revenueByDate: {}
      };
    }

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const averageOrderValue = totalRevenue / sales.length;

    // Group by date
    const salesByDate = {};
    const revenueByDate = {};

    sales.forEach(sale => {
      const date = sale.date;
      salesByDate[date] = (salesByDate[date] || 0) + 1;
      revenueByDate[date] = (revenueByDate[date] || 0) + sale.total;
    });

    return {
      totalSales: sales.length,
      totalRevenue,
      averageOrderValue,
      salesByDate,
      revenueByDate
    };
  } catch (error) {
    console.error('Error getting sales analytics:', error);
    throw error;
  }
};

// Get top selling products
export const getTopProducts = async (limit = 10, startDate = null, endDate = null) => {
  try {
    const sales = await getSales(startDate, endDate);
    const products = await getProducts();
    
    // Get all sale details
    const productSales = {};
    
    for (const sale of sales) {
      const saleDetails = await getSaleDetails(sale.id);
      if (saleDetails && saleDetails.items) {
        saleDetails.items.forEach(item => {
          if (!productSales[item.product_id]) {
            productSales[item.product_id] = {
              productId: item.product_id,
              name: item.name,
              category: item.category,
              type: item.type,
              quantitySold: 0,
              revenue: 0,
              salesCount: 0
            };
          }
          productSales[item.product_id].quantitySold += item.quantity;
          productSales[item.product_id].revenue += item.price * item.quantity;
          productSales[item.product_id].salesCount += 1;
        });
      }
    }

    // Convert to array and sort by quantity sold
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, limit);

    return topProducts;
  } catch (error) {
    console.error('Error getting top products:', error);
    throw error;
  }
};

// Get product category analytics
export const getCategoryAnalytics = async (startDate = null, endDate = null) => {
  try {
    const sales = await getSales(startDate, endDate);
    const categoryData = {};

    for (const sale of sales) {
      const saleDetails = await getSaleDetails(sale.id);
      if (saleDetails && saleDetails.items) {
        saleDetails.items.forEach(item => {
          if (!categoryData[item.category]) {
            categoryData[item.category] = {
              category: item.category,
              quantitySold: 0,
              revenue: 0,
              salesCount: 0
            };
          }
          categoryData[item.category].quantitySold += item.quantity;
          categoryData[item.category].revenue += item.price * item.quantity;
          categoryData[item.category].salesCount += 1;
        });
      }
    }

    return Object.values(categoryData).sort((a, b) => b.revenue - a.revenue);
  } catch (error) {
    console.error('Error getting category analytics:', error);
    throw error;
  }
};

// Get strain type analytics
export const getStrainTypeAnalytics = async (startDate = null, endDate = null) => {
  try {
    const sales = await getSales(startDate, endDate);
    const typeData = {};

    for (const sale of sales) {
      const saleDetails = await getSaleDetails(sale.id);
      if (saleDetails && saleDetails.items) {
        saleDetails.items.forEach(item => {
          if (!typeData[item.type]) {
            typeData[item.type] = {
              type: item.type,
              quantitySold: 0,
              revenue: 0,
              salesCount: 0
            };
          }
          typeData[item.type].quantitySold += item.quantity;
          typeData[item.type].revenue += item.price * item.quantity;
          typeData[item.type].salesCount += 1;
        });
      }
    }

    return Object.values(typeData).sort((a, b) => b.revenue - a.revenue);
  } catch (error) {
    console.error('Error getting strain type analytics:', error);
    throw error;
  }
};

// Get inventory analytics
export const getInventoryAnalytics = async () => {
  try {
    const products = await getProducts();

    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const totalValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
    const lowStockProducts = products.filter(p => p.stock < 10);
    const outOfStockProducts = products.filter(p => p.stock === 0);

    // Group by category
    const byCategory = {};
    products.forEach(product => {
      if (!byCategory[product.category]) {
        byCategory[product.category] = {
          category: product.category,
          count: 0,
          totalStock: 0,
          totalValue: 0
        };
      }
      byCategory[product.category].count += 1;
      byCategory[product.category].totalStock += product.stock;
      byCategory[product.category].totalValue += product.stock * product.price;
    });

    return {
      totalProducts,
      totalStock,
      totalValue,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      lowStockProducts,
      outOfStockProducts,
      byCategory: Object.values(byCategory)
    };
  } catch (error) {
    console.error('Error getting inventory analytics:', error);
    throw error;
  }
};

// Get comprehensive dashboard analytics
export const getDashboardAnalytics = async (period = 'today') => {
  try {
    const today = new Date();
    let startDate = null;
    let endDate = null;

    // Calculate date range based on period
    switch (period) {
      case 'today':
        startDate = today.toISOString().split('T')[0];
        endDate = startDate;
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'year':
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        startDate = yearAgo.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      default:
        startDate = null;
        endDate = null;
    }

    // Get all analytics
    const [
      salesAnalytics,
      topProducts,
      categoryAnalytics,
      strainTypeAnalytics,
      inventoryAnalytics
    ] = await Promise.all([
      getSalesAnalytics(startDate, endDate),
      getTopProducts(10, startDate, endDate),
      getCategoryAnalytics(startDate, endDate),
      getStrainTypeAnalytics(startDate, endDate),
      getInventoryAnalytics()
    ]);

    return {
      period,
      startDate,
      endDate,
      sales: salesAnalytics,
      topProducts,
      categories: categoryAnalytics,
      strainTypes: strainTypeAnalytics,
      inventory: inventoryAnalytics,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting dashboard analytics:', error);
    throw error;
  }
};

// Export analytics data as JSON
export const exportAnalyticsData = async (period = 'all') => {
  try {
    const analytics = await getDashboardAnalytics(period);
    return JSON.stringify(analytics, null, 2);
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    throw error;
  }
};

// Get sales trends (for charts)
export const getSalesTrends = async (days = 30) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sales = await getSales(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    // Create array of dates
    const trends = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySales = sales.filter(s => s.date === dateStr);
      const revenue = daySales.reduce((sum, s) => sum + s.total, 0);
      
      trends.push({
        date: dateStr,
        sales: daySales.length,
        revenue
      });
    }

    return trends;
  } catch (error) {
    console.error('Error getting sales trends:', error);
    throw error;
  }
};

export default {
  getSalesAnalytics,
  getTopProducts,
  getCategoryAnalytics,
  getStrainTypeAnalytics,
  getInventoryAnalytics,
  getDashboardAnalytics,
  exportAnalyticsData,
  getSalesTrends
};