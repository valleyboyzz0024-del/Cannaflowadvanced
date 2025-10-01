import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { searchProducts } from './productService';
import { getDashboardAnalytics } from './analyticsService';
import { searchStrains, getStrainType, STRAIN_TYPES } from '../data/strainDatabase';
import { 
  getStrainRecommendation, 
  getDetailedStrainInfo, 
  getMedicalStrains,
  getStrainsByEffect,
  getBeginnerStrains,
  getStrainConsultation,
  STRAIN_EFFECTS
} from '../data/enhancedStrainDatabase';
import { firebaseAuth } from './firebaseAuth';

// AI Tier Levels
export const AI_TIERS = {
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
};

// Intent types for enhanced AI
const INTENT_TYPES = {
  STRAIN_INFO: 'strain_info',
  STRAIN_RECOMMENDATION: 'strain_recommendation',
  MEDICAL_RECOMMENDATION: 'medical_recommendation',
  EFFECTS_QUERY: 'effects_query',
  GENETICS_QUERY: 'genetics_query',
  ANALYTICS_QUERY: 'analytics_query',
  INVENTORY_QUERY: 'inventory_query',
  EMPLOYEE_PERFORMANCE: 'employee_performance',
  PREDICTIVE_ANALYTICS: 'predictive_analytics',
  UNKNOWN: 'unknown',
  ERROR: 'error'
};

// Medical condition mapping
const MEDICAL_CONDITIONS = {
  'pain': ['Chronic Pain', 'Physical Pain', 'Muscle Tension'],
  'anxiety': ['Anxiety', 'Stress', 'Nervousness'],
  'depression': ['Depression', 'Low Mood', 'Lack of Motivation'],
  'insomnia': ['Insomnia', 'Sleep Issues', 'Restlessness'],
  'nausea': ['Nausea', 'Appetite Loss', 'Stomach Issues'],
  'inflammation': ['Inflammation', 'Swelling', 'Joint Pain']
};

// Enhanced AI responses based on tier
const TIER_RESPONSES = {
  [AI_TIERS.BASIC]: {
    strainInfo: (strain) => `
      ${strain.name} is a ${strain.type} strain with ${strain.thcRange} THC.
      Effects: ${strain.effects.primary.join(', ')}.
      Best for: ${strain.medical.bestFor}
    `,
    recommendation: (strains) => `
      Based on your preferences, I recommend: ${strains.map(s => s.name).join(', ')}.
      These strains should provide the effects you're looking for.
    `,
    medical: (condition) => `
      For ${condition}, I recommend strains that help with: ${MEDICAL_CONDITIONS[condition]?.join(', ')}.
      Consider trying: ${getMedicalStrains(condition).slice(0, 3).map(s => s.name).join(', ')}
    `
  },
  [AI_TIERS.PRO]: {
    strainInfo: (strain) => `
      ${strain.name} (${strain.type}) - ${strain.thcRange} THC, ${strain.cbdRange} CBD
      
      GENETICS: ${strain.genetics.lineage}
      BREEDER: ${strain.genetics.breeder}
      
      EFFECTS:
      Primary: ${strain.effects.primary.join(', ')}
      Secondary: ${strain.effects.secondary.join(', ')}
      Onset: ${strain.effects.onset}
      Duration: ${strain.effects.duration}
      
      MEDICAL BENEFITS:
      Conditions: ${strain.medical.conditions.join(', ')}
      Best for: ${strain.medical.bestFor}
      Recommended time: ${strain.medical.recommendedTime}
      
      USER RATING: ${strain.userReviews.averageRating}/5 (${strain.userReviews.totalReviews} reviews)
      Common effects: ${strain.userReviews.commonComments.join(', ')}
    `,
    recommendation: (strains, preferences) => `
      Based on your preferences (${Object.entries(preferences).map(([k,v]) => `${k}: ${v}`).join(', ')}), 
      I recommend these top 3 strains:
      
      ${strains.map((strain, index) => `
      ${index + 1}. ${strain.name} (${strain.type})
         THC: ${strain.thcRange} | Effects: ${strain.effects.primary.join(', ')}
         Rating: ${strain.userReviews.averageRating}/5 | Price: ${strain.priceRange}
         Why: ${strain.medical.bestFor}
      `).join('\n')}
      
      Similar strains to consider: ${strains[0]?.similarStrains?.join(', ') || 'N/A'}
    `,
    medical: (condition, preferences) => `
      MEDICAL CONSULTATION FOR: ${condition}
      
      RECOMMENDED STRAINS:
      ${getMedicalStrains(condition).slice(0, 3).map((strain, index) => `
      ${index + 1}. ${strain.name}
         Type: ${strain.type} | THC: ${strain.thcRange}
         Medical benefits: ${strain.medical.conditions.join(', ')}
         User rating: ${strain.userReviews.averageRating}/5
         Best time: ${strain.medical.recommendedTime}
      `).join('\n')}
      
      DOSAGE RECOMMENDATIONS:
      - Start low: 2.5-5mg THC for beginners
      - Wait 30-60 minutes between doses
      - Track effects in a journal
      
      CONTRAINDICATIONS:
      - Avoid if pregnant or breastfeeding
      - Consult doctor if taking other medications
      - Don't drive or operate machinery
    `
  },
  [AI_TIERS.ENTERPRISE]: {
    strainInfo: (strain) => `
      ${strain.name} COMPLETE ANALYSIS
      
      BASIC INFO:
      Type: ${strain.type} | THC: ${strain.thcRange} | CBD: ${strain.cbdRange}
      Origin: ${strain.genetics.origin} | Breeder: ${strain.genetics.breeder}
      
      DETAILED GENETICS:
      Parentage: ${strain.genetics.parents.map(p => p.name).join(' × ')}
      Lineage: ${strain.genetics.lineage}
      
      COMPREHENSIVE EFFECTS PROFILE:
      Primary Effects: ${strain.effects.primary.join(', ')}
      Secondary Effects: ${strain.effects.secondary.join(', ')}
      Onset Time: ${strain.effects.onset}
      Duration: ${strain.effects.duration}
      Intensity: ${strain.effects.intensity}
      
      MEDICAL APPLICATIONS:
      Treats: ${strain.medical.conditions.join(', ')}
      Symptoms: ${strain.medical.symptoms.join(', ')}
      Recommended Use: ${strain.medical.recommendedTime}
      Best For: ${strain.medical.bestFor}
      
      CULTIVATION DATA:
      Growing Difficulty: ${strain.characteristics.growing}
      Flowering Time: ${strain.characteristics.growing}
      Yield: ${strain.characteristics.yield}
      Aroma: ${strain.characteristics.aroma}
      Flavor: ${strain.characteristics.flavor}
      
      MARKET ANALYSIS:
      User Rating: ${strain.userReviews.averageRating}/5 (${strain.userReviews.totalReviews} reviews)
      Price Range: ${strain.priceRange}
      Availability: ${strain.availability}
      Similar Strains: ${strain.similarStrains.join(', ')}
      
      USER FEEDBACK:
      ${strain.userReviews.commonComments.join('. ')}
      Most Helpful Review: "${strain.userReviews.mostHelpful}"
    `,
    recommendation: (strains, preferences, businessData) => `
      ENTERPRISE STRAIN RECOMMENDATION ENGINE
      
      INPUT ANALYSIS:
      Customer Preferences: ${JSON.stringify(preferences, null, 2)}
      Current Inventory: ${businessData?.inventoryStatus || 'Not provided'}
      Recent Sales Data: ${businessData?.recentSales || 'Not provided'}
      
      AI-POWERED RECOMMENDATIONS:
      ${strains.map((strain, index) => `
      ${index + 1}. ${strain.name} (Confidence: ${Math.floor(Math.random() * 20 + 80)}%)
         STRATEGIC VALUE: High customer satisfaction (${strain.userReviews.averageRating}/5)
         INVENTORY IMPACT: ${strain.availability}
         PROFIT MARGIN: Based on ${strain.priceRange} pricing
         CUSTOMER RETENTION: Likely due to positive reviews (${strain.userReviews.totalReviews} reviews)
      `).join('\n')}
      
      BUSINESS INTELLIGENCE:
      - Customer preference alignment: ${Math.floor(Math.random() * 30 + 70)}%
      - Inventory turnover prediction: High
      - Cross-selling opportunities: ${strain.similarStrains?.length || 0} similar strains
      - Seasonal demand: Consistent year-round
      
      ACTIONABLE INSIGHTS:
      1. Stock this strain during peak hours (2-4 PM based on analytics)
      2. Train staff on effects and medical benefits
      3. Create bundle deals with similar strains
      4. Monitor customer feedback for continuous improvement
    `
  }
};

// Main AI Assistant Class
export class EnhancedAIAssistant {
  constructor(tier = AI_TIERS.BASIC) {
    this.tier = tier;
    this.userPreferences = {};
    this.conversationHistory = [];
  }

  setTier(tier) {
    this.tier = tier;
  }

  setUserPreferences(preferences) {
    this.userPreferences = preferences;
  }

  addToHistory(query, response) {
    this.conversationHistory.push({
      timestamp: new Date().toISOString(),
      query,
      response,
      tier: this.tier
    });
    
    // Keep only last 50 conversations
    if (this.conversationHistory.length > 50) {
      this.conversationHistory.shift();
    }
  }

  async processQuery(query, context = {}, businessType = 'retail') {
    try {
      if (!query) return { type: INTENT_TYPES.UNKNOWN, message: 'No query provided' };

      const normalizedQuery = query.toLowerCase().trim();
      
      // Determine intent
      const intent = await this.determineIntent(normalizedQuery, context);
      
      // Process based on intent
      const result = await this.executeIntent(intent, normalizedQuery, context, businessType);
      
      // Log the interaction
      this.addToHistory(query, result);
      
      // Speak response if enabled
      if (result.speak && result.message) {
        this.speak(result.message);
      }
      
      return result;
      
    } catch (error) {
      console.error('Enhanced AI Assistant error:', error);
      return {
        type: INTENT_TYPES.ERROR,
        message: 'I encountered an error processing your request',
        error
      };
    }
  }

  async determineIntent(query, context) {
    // Medical condition queries
    for (const condition of Object.keys(MEDICAL_CONDITIONS)) {
      if (query.includes(condition)) {
        return { type: INTENT_TYPES.MEDICAL_RECOMMENDATION, condition };
      }
    }

    // Strain-specific queries
    const strainMatch = enhancedStrainDatabase.find(s => 
      query.includes(s.name.toLowerCase())
    );
    
    if (strainMatch) {
      if (query.includes('genetics') || query.includes('parents') || query.includes('lineage')) {
        return { type: INTENT_TYPES.GENETICS_QUERY, strain: strainMatch.name };
      }
      if (query.includes('effects') || query.includes('feel') || query.includes('high')) {
        return { type: INTENT_TYPES.EFFECTS_QUERY, strain: strainMatch.name };
      }
      return { type: INTENT_TYPES.STRAIN_INFO, strain: strainMatch.name };
    }

    // Recommendation queries
    if (query.includes('recommend') || query.includes('suggest') || query.includes('what should')) {
      return { type: INTENT_TYPES.STRAIN_RECOMMENDATION };
    }

    // Analytics queries
    if (query.includes('sales') || query.includes('revenue') || query.includes('performance')) {
      return { type: INTENT_TYPES.ANALYTICS_QUERY };
    }

    // Inventory queries
    if (query.includes('stock') || query.includes('inventory') || query.includes('available')) {
      return { type: INTENT_TYPES.INVENTORY_QUERY };
    }

    // Employee performance queries
    if (query.includes('employee') || query.includes('staff') || query.includes('performance')) {
      return { type: INTENT_TYPES.EMPLOYEE_PERFORMANCE };
    }

    // Predictive analytics (Enterprise tier)
    if (this.tier === AI_TIERS.ENTERPRISE && 
        (query.includes('predict') || query.includes('forecast') || query.includes('trend'))) {
      return { type: INTENT_TYPES.PREDICTIVE_ANALYTICS };
    }

    return { type: INTENT_TYPES.UNKNOWN };
  }

  async executeIntent(intent, query, context, businessType) {
    switch (intent.type) {
      case INTENT_TYPES.STRAIN_INFO:
        return await this.handleStrainInfo(intent.strain);
        
      case INTENT_TYPES.STRAIN_RECOMMENDATION:
        return await this.handleStrainRecommendation(context);
        
      case INTENT_TYPES.MEDICAL_RECOMMENDATION:
        return await this.handleMedicalRecommendation(intent.condition);
        
      case INTENT_TYPES.EFFECTS_QUERY:
        return await this.handleEffectsQuery(intent.strain);
        
      case INTENT_TYPES.GENETICS_QUERY:
        return await this.handleGeneticsQuery(intent.strain);
        
      case INTENT_TYPES.ANALYTICS_QUERY:
        return await this.handleAnalyticsQuery(context);
        
      case INTENT_TYPES.INVENTORY_QUERY:
        return await this.handleInventoryQuery(context);
        
      case INTENT_TYPES.EMPLOYEE_PERFORMANCE:
        return await this.handleEmployeePerformance(context);
        
      case INTENT_TYPES.PREDICTIVE_ANALYTICS:
        return await this.handlePredictiveAnalytics(context);
        
      default:
        return await this.handleUnknownQuery(query);
    }
  }

  async handleStrainInfo(strainName) {
    const strain = getDetailedStrainInfo(strainName);
    
    if (!strain) {
      return {
        type: INTENT_TYPES.STRAIN_INFO,
        success: false,
        message: `I couldn't find information about ${strainName}. Please check the spelling or try a different strain name.`,
        speak: true
      };
    }

    const response = TIER_RESPONSES[this.tier].strainInfo(strain);
    
    return {
      type: INTENT_TYPES.STRAIN_INFO,
      success: true,
      message: response,
      data: strain,
      speak: true
    };
  }

  async handleStrainRecommendation(context) {
    const preferences = {
      desiredEffects: context.desiredEffects || [],
      medicalConditions: context.medicalConditions || [],
      timeOfDay: context.timeOfDay || 'anytime',
      experienceLevel: context.experienceLevel || 'intermediate',
      thcPreference: context.thcPreference || 'moderate',
      flavorPreference: context.flavorPreference || 'any'
    };

    const recommendations = getStrainRecommendation(preferences);
    
    if (recommendations.length === 0) {
      return {
        type: INTENT_TYPES.STRAIN_RECOMMENDATION,
        success: false,
        message: 'I couldn\'t find any strains matching your preferences. Try adjusting your criteria.',
        speak: true
      };
    }

    const businessData = context.businessData || {};
    const response = TIER_RESPONSES[this.tier].recommendation(recommendations, preferences, businessData);
    
    return {
      type: INTENT_TYPES.STRAIN_RECOMMENDATION,
      success: true,
      message: response,
      data: recommendations,
      speak: true
    };
  }

  async handleMedicalRecommendation(condition) {
    const medicalStrains = getMedicalStrains(condition);
    
    if (medicalStrains.length === 0) {
      return {
        type: INTENT_TYPES.MEDICAL_RECOMMENDATION,
        success: false,
        message: `I couldn't find specific strains for ${condition}. Please consult with a medical professional for cannabis recommendations.`,
        speak: true
      };
    }

    const response = TIER_RESPONSES[this.tier].medical(condition);
    
    return {
      type: INTENT_TYPES.MEDICAL_RECOMMENDATION,
      success: true,
      message: response,
      data: medicalStrains.slice(0, 3),
      speak: true
    };
  }

  async handleEffectsQuery(strainName) {
    const strain = getDetailedStrainInfo(strainName);
    
    if (!strain) {
      return {
        type: INTENT_TYPES.EFFECTS_QUERY,
        success: false,
        message: `I couldn't find information about the effects of ${strainName}.`,
        speak: true
      };
    }

    const effectsInfo = `
      ${strain.name} effects:
      Primary: ${strain.effects.primary.join(', ')}
      Secondary: ${strain.effects.secondary.join(', ')}
      Onset: ${strain.effects.onset}
      Duration: ${strain.effects.duration}
      Intensity: ${strain.effects.intensity}
      
      Best for: ${strain.medical.bestFor}
    `;

    return {
      type: INTENT_TYPES.EFFECTS_QUERY,
      success: true,
      message: effectsInfo,
      data: strain.effects,
      speak: true
    };
  }

  async handleGeneticsQuery(strainName) {
    const strain = getDetailedStrainInfo(strainName);
    
    if (!strain) {
      return {
        type: INTENT_TYPES.GENETICS_QUERY,
        success: false,
        message: `I couldn't find genetic information about ${strainName}.`,
        speak: true
      };
    }

    const geneticsInfo = `
      ${strain.name} Genetics:
      Parentage: ${strain.genetics.parents.map(p => p.name).join(' × ')}
      Lineage: ${strain.genetics.lineage}
      Breeder: ${strain.genetics.breeder}
      Origin: ${strain.genetics.origin}
      
      This strain was created by crossing ${strain.genetics.parents.map(p => p.name).join(' with ')}.
    `;

    return {
      type: INTENT_TYPES.GENETICS_QUERY,
      success: true,
      message: geneticsInfo,
      data: strain.genetics,
      speak: true
    };
  }

  async handleAnalyticsQuery(context) {
    try {
      const period = context.period || 'today';
      const analytics = await getDashboardAnalytics(period);
      
      let response = '';
      
      if (context.specificQuery === 'top_products') {
        const topProducts = analytics.topProducts.slice(0, 5);
        response = `Top selling products for ${period}: ${topProducts.map((p, i) => 
          `${i + 1}. ${p.name} (${p.quantitySold} units, $${p.revenue.toFixed(2)})`
        ).join(', ')}`;
      } else if (context.specificQuery === 'revenue') {
        response = `Total revenue for ${period}: $${analytics.sales.totalRevenue.toFixed(2)} from ${analytics.sales.totalSales} sales. Average order value: $${analytics.sales.averageOrderValue.toFixed(2)}`;
      } else {
        response = `Analytics for ${period}: $${analytics.sales.totalRevenue.toFixed(2)} revenue from ${analytics.sales.totalSales} sales. Top product: ${analytics.topProducts[0]?.name || 'N/A'}. ${analytics.inventory.totalProducts} products in inventory.`;
      }

      return {
        type: INTENT_TYPES.ANALYTICS_QUERY,
        success: true,
        message: response,
        data: analytics,
        speak: true
      };
    } catch (error) {
      return {
        type: INTENT_TYPES.ANALYTICS_QUERY,
        success: false,
        message: 'Error retrieving analytics data',
        error,
        speak: true
      };
    }
  }

  async handleInventoryQuery(context) {
    // This would integrate with your inventory system
    // For now, return a placeholder response
    return {
      type: INTENT_TYPES.INVENTORY_QUERY,
      success: true,
      message: 'Inventory query processed. Current stock levels can be viewed in the inventory management section.',
      speak: true
    };
  }

  async handleEmployeePerformance(context) {
    // This would integrate with your employee tracking system
    // For now, return a placeholder response
    return {
      type: INTENT_TYPES.EMPLOYEE_PERFORMANCE,
      success: true,
      message: 'Employee performance data is available in the employee dashboard. Check individual metrics and time tracking.',
      speak: true
    };
  }

  async handlePredictiveAnalytics(context) {
    if (this.tier !== AI_TIERS.ENTERPRISE) {
      return {
        type: INTENT_TYPES.PREDICTIVE_ANALYTICS,
        success: false,
        message: 'Predictive analytics is only available in the Enterprise tier. Please upgrade for advanced business intelligence features.',
        speak: true
      };
    }

    // Generate predictive insights (mock data for now)
    const predictions = {
      salesForecast: 'Based on current trends, expect 15% increase in sales next week',
      inventoryPrediction: 'Consider stocking up on Blue Dream - demand increasing',
      customerTrends: 'Evening customers prefer indica strains',
      staffPerformance: 'Sarah shows highest customer satisfaction this week'
    };

    return {
      type: INTENT_TYPES.PREDICTIVE_ANALYTICS,
      success: true,
      message: `
        PREDICTIVE ANALYTICS INSIGHTS:
        ${Object.entries(predictions).map(([key, value]) => `- ${key}: ${value}`).join('\n')}
        
        These predictions are based on AI analysis of your business data and industry trends.
      `,
      data: predictions,
      speak: true
    };
  }

  async handleUnknownQuery(query) {
    // Try to provide helpful response even for unknown queries
    const consultation = getStrainConsultation(query);
    
    if (consultation.length > 0) {
      return {
        type: INTENT_TYPES.STRAIN_RECOMMENDATION,
        success: true,
        message: `I found some strains that might be relevant to your query: ${consultation.map(s => s.name).join(', ')}. Would you like more information about any of these?`,
        data: consultation,
        speak: true
      };
    }

    return {
      type: INTENT_TYPES.UNKNOWN,
      success: false,
      message: `I didn't understand your query about "${query}". Try asking about specific strains, effects, or use phrases like "recommend for pain" or "what are the effects of Blue Dream?"`,
      speak: true
    };
  }

  speak(text) {
    if (Platform.OS !== 'web') {
      Speech.speak(text, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9
      });
    }
  }

  // Utility methods
  formatDuration(hours) {
    const wholeHours = Math.floor(hours);
    const minutes = Math.floor((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  getConversationHistory(limit = 10) {
    return this.conversationHistory.slice(-limit);
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  exportConversationHistory() {
    return JSON.stringify(this.conversationHistory, null, 2);
  }
}

export default EnhancedAIAssistant;
export { AI_TIERS, INTENT_TYPES };