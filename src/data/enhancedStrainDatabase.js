// Enhanced Strain Database with Genetics, Effects, and Medical Information
// Comprehensive cannabis strain information for AI recommendations

export const STRAIN_EFFECTS = {
  // Mental Effects
  EUPHORIC: 'Euphoric',
  RELAXED: 'Relaxed', 
  HAPPY: 'Happy',
  UPLIFTED: 'Uplifted',
  CREATIVE: 'Creative',
  FOCUSED: 'Focused',
  ENERGETIC: 'Energetic',
  SLEEPY: 'Sleepy',
  HUNGRY: 'Hungry',
  TALKATIVE: 'Talkative',
  GIGGLY: 'Giggly',
  
  // Physical Effects
  BODY_HIGH: 'Body High',
  HEAD_HIGH: 'Head High',
  TINGLY: 'Tingly',
  NUMB: 'Numb',
  WARM: 'Warm',
  COOL: 'Cool',
  
  // Medical Effects
  PAIN_RELIEF: 'Pain Relief',
  STRESS_RELIEF: 'Stress Relief',
  ANXIETY_RELIEF: 'Anxiety Relief',
  DEPRESSION_RELIEF: 'Depression Relief',
  INSOMNIA_RELIEF: 'Insomnia Relief',
  NAUSEA_RELIEF: 'Nausea Relief',
  APPETITE_STIMULATION: 'Appetite Stimulation',
  MUSCLE_RELAXATION: 'Muscle Relaxation',
  ANTI_INFLAMMATORY: 'Anti-inflammatory'
};

export const STRAIN_GENETICS = {
  // Parent Strains
  BLUEBERRY: { name: 'Blueberry', type: 'INDICA', origin: 'Dutch Passion' },
  HAZE: { name: 'Haze', type: 'SATIVA', origin: 'California' },
  OG_KUSH: { name: 'OG Kush', type: 'HYBRID', origin: 'Florida' },
  CHEMDAWG: { name: 'Chemdawg', type: 'HYBRID', origin: 'Colorado' },
  GSC: { name: 'Girl Scout Cookies', type: 'HYBRID', origin: 'California' },
  DURBAN_POISON: { name: 'Durban Poison', type: 'SATIVA', origin: 'South Africa' },
  GRANDDADDY_PURPLE: { name: 'Granddaddy Purple', type: 'INDICA', origin: 'California' },
  WHITE_WIDOW: { name: 'White Widow', type: 'HYBRID', origin: 'Netherlands' }
};

// Enhanced strain database with detailed information
export const enhancedStrainDatabase = [
  {
    name: 'Blue Dream',
    type: 'HYBRID',
    thcRange: '17-24%',
    cbdRange: '0.1-0.2%',
    genetics: {
      parents: [STRAIN_GENETICS.BLUEBERRY, STRAIN_GENETICS.HAZE],
      lineage: 'Blueberry × Haze',
      breeder: 'Unknown',
      origin: 'California'
    },
    effects: {
      primary: [STRAIN_EFFECTS.EUPHORIC, STRAIN_EFFECTS.RELAXED, STRAIN_EFFECTS.CREATIVE],
      secondary: [STRAIN_EFFECTS.HAPPY, STRAIN_EFFECTS.UPLIFTED],
      onset: 'Fast (5-15 minutes)',
      duration: '2-3 hours',
      intensity: 'Moderate to Strong'
    },
    medical: {
      conditions: ['Stress', 'Depression', 'Chronic Pain', 'Fatigue', 'Headaches'],
      symptoms: ['Anxiety', 'Lack of Appetite', 'Muscle Tension', 'Insomnia'],
      recommendedTime: 'Daytime use',
      bestFor: 'Functional relaxation, creative work, social activities'
    },
    characteristics: {
      aroma: 'Sweet berry, earthy, vanilla',
      flavor: 'Blueberry, sweet, herbal',
      appearance: 'Dense buds, blue and purple hues, orange hairs',
      growing: 'Moderate difficulty, 9-10 weeks flowering',
      yield: 'High (500-600g/m²)'
    },
    userReviews: {
      averageRating: 4.6,
      totalReviews: 2847,
      commonComments: ['Perfect for daytime use', 'Great for creativity', 'Helps with stress'],
      mostHelpful: 'Perfect balance of relaxation and energy. Great for getting work done while staying calm.'
    },
    similarStrains: ['Blueberry', 'Haze', 'Green Crack', 'Jack Herer'],
    availability: 'Widely available in dispensaries',
    priceRange: '$10-15 per gram'
  },
  
  {
    name: 'OG Kush',
    type: 'HYBRID',
    thcRange: '19-26%',
    cbdRange: '0.1-0.3%',
    genetics: {
      parents: [STRAIN_GENETICS.CHEMDAWG, STRAIN_GENETICS.HINDU_KUSH],
      lineage: 'Chemdawg × Hindu Kush',
      breeder: 'Unknown',
      origin: 'Florida'
    },
    effects: {
      primary: [STRAIN_EFFECTS.RELAXED, STRAIN_EFFECTS.EUPHORIC, STRAIN_EFFECTS.HAPPY],
      secondary: [STRAIN_EFFECTS.HUNGRY, STRAIN_EFFECTS.SLEEPY],
      onset: 'Moderate (10-20 minutes)',
      duration: '2-4 hours',
      intensity: 'Strong'
    },
    medical: {
      conditions: ['Chronic Pain', 'Insomnia', 'Stress', 'Anxiety', 'Depression'],
      symptoms: ['Physical Pain', 'Sleep Issues', 'Tension', 'Lack of Appetite'],
      recommendedTime: 'Evening use',
      bestFor: 'Pain relief, sleep aid, stress relief, appetite stimulation'
    },
    characteristics: {
      aroma: 'Earthy, pine, fuel, skunky',
      flavor: 'Earthy, pine, woody, citrus',
      appearance: 'Dense buds, green with orange hairs, crystal-covered',
      growing: 'Difficult, 8-9 weeks flowering',
      yield: 'Medium (400-500g/m²)'
    },
    userReviews: {
      averageRating: 4.4,
      totalReviews: 3562,
      commonComments: ['Great for pain', 'Helps me sleep', 'Classic strain'],
      mostHelpful: 'The ultimate stress reliever. Perfect for unwinding after a long day.'
    },
    similarStrains: ['Bubba Kush', 'Headband', 'SFV OG', 'Tahoe OG'],
    availability: 'Very widely available',
    priceRange: '$12-18 per gram'
  },
  
  {
    name: 'Granddaddy Purple',
    type: 'INDICA',
    thcRange: '17-23%',
    cbdRange: '0.1-0.5%',
    genetics: {
      parents: [STRAIN_GENETICS.GRANDDADDY_PURPLE, STRAIN_GENETICS.PURPLE_URKLE],
      lineage: 'Purple Urkle × Big Bud',
      breeder: 'Ken Estes',
      origin: 'California'
    },
    effects: {
      primary: [STRAIN_EFFECTS.RELAXED, STRAIN_EFFECTs.SLEEPY, STRAIN_EFFECTS.EUPHORIC],
      secondary: [STRAIN_EFFECTS.HUNGRY, STRAIN_EFFECTS.NUMB],
      onset: 'Fast (5-15 minutes)',
      duration: '2-4 hours',
      intensity: 'Strong'
    },
    medical: {
      conditions: ['Insomnia', 'Chronic Pain', 'Muscle Spasms', 'Stress', 'Anxiety'],
      symptoms: ['Physical Pain', 'Sleep Issues', 'Muscle Tension', 'Appetite Loss'],
      recommendedTime: 'Evening/Night use',
      bestFor: 'Severe pain, insomnia, muscle relaxation, appetite stimulation'
    },
    characteristics: {
      aroma: 'Grape, berry, sweet, earthy',
      flavor: 'Grape, berry, sweet, floral',
      appearance: 'Dense purple buds, orange hairs, crystal-coated',
      growing: 'Easy to moderate, 8-10 weeks flowering',
      yield: 'High (600-700g/m²)'
    },
    userReviews: {
      averageRating: 4.5,
      totalReviews: 2891,
      commonComments: ['Perfect for sleep', 'Great pain relief', 'Beautiful purple color'],
      mostHelpful: 'The go-to strain for insomnia. Knocks me out every time.'
    },
    similarStrains: ['Purple Urkle', 'Grape Ape', 'Purple Kush', 'Blackberry Kush'],
    availability: 'Widely available',
    priceRange: '$10-16 per gram'
  }
];

// AI-powered strain recommendation system
export const getStrainRecommendation = (preferences) => {
  const {
    desiredEffects = [],
    medicalConditions = [],
    timeOfDay = 'anytime',
    experienceLevel = 'intermediate',
    thcPreference = 'moderate',
    flavorPreference = 'any'
  } = preferences;

  let recommendations = [];

  // Filter by desired effects
  if (desiredEffects.length > 0) {
    recommendations = enhancedStrainDatabase.filter(strain => {
      return desiredEffects.some(effect => 
        strain.effects.primary.includes(effect) || 
        strain.effects.secondary.includes(effect)
      );
    });
  }

  // Filter by medical conditions
  if (medicalConditions.length > 0) {
    recommendations = recommendations.filter(strain => {
      return medicalConditions.some(condition => 
        strain.medical.conditions.includes(condition) ||
        strain.medical.symptoms.includes(condition)
      );
    });
  }

  // Filter by time of day
  if (timeOfDay !== 'anytime') {
    recommendations = recommendations.filter(strain => {
      if (timeOfDay === 'morning' || timeOfDay === 'daytime') {
        return strain.type === 'SATIVA' || strain.type === 'HYBRID';
      } else if (timeOfDay === 'evening' || timeOfDay === 'night') {
        return strain.type === 'INDICA' || strain.type === 'HYBRID';
      }
      return true;
    });
  }

  // Filter by experience level
  if (experienceLevel === 'beginner') {
    recommendations = recommendations.filter(strain => 
      parseFloat(strain.thcRange.split('-')[1]) <= 20
    );
  } else if (experienceLevel === 'advanced') {
    recommendations = recommendations.filter(strain => 
      parseFloat(strain.thcRange.split('-')[0]) >= 20
    );
  }

  // Sort by user ratings
  recommendations.sort((a, b) => b.userReviews.averageRating - a.userReviews.averageRating);

  return recommendations.slice(0, 5); // Return top 5 recommendations
};

// Get detailed strain information for AI responses
export const getDetailedStrainInfo = (strainName) => {
  const strain = enhancedStrainDatabase.find(s => 
    s.name.toLowerCase() === strainName.toLowerCase()
  );
  
  if (!strain) return null;

  return {
    basicInfo: {
      name: strain.name,
      type: strain.type,
      thcRange: strain.thcRange,
      cbdRange: strain.cbdRange
    },
    genetics: strain.genetics,
    effects: strain.effects,
    medical: strain.medical,
    characteristics: strain.characteristics,
    userReviews: strain.userReviews,
    similarStrains: strain.similarStrains,
    availability: strain.availability,
    priceRange: strain.priceRange
  };
};

// Get strains for specific medical conditions
export const getMedicalStrains = (condition) => {
  const conditionMap = {
    'pain': ['Chronic Pain', 'Physical Pain', 'Muscle Tension'],
    'anxiety': ['Anxiety', 'Stress'],
    'depression': ['Depression', 'Stress'],
    'insomnia': ['Insomnia', 'Sleep Issues'],
    'nausea': ['Nausea', 'Appetite Loss'],
    'inflammation': ['Inflammation']
  };

  const relatedConditions = conditionMap[condition.toLowerCase()] || [condition];
  
  return enhancedStrainDatabase.filter(strain => {
    return relatedConditions.some(cond => 
      strain.medical.conditions.includes(cond) ||
      strain.medical.symptoms.includes(cond)
    );
  });
};

// Get strains by effect type
export const getStrainsByEffect = (effect) => {
  return enhancedStrainDatabase.filter(strain => {
    return strain.effects.primary.includes(effect) || 
           strain.effects.secondary.includes(effect);
  });
};

// Get beginner-friendly strains
export const getBeginnerStrains = () => {
  return enhancedStrainDatabase.filter(strain => {
    const maxThc = parseFloat(strain.thcRange.split('-')[1]);
    return maxThc <= 18 && strain.userReviews.averageRating >= 4.0;
  });
};

// Real-time AI strain consultation
export const getStrainConsultation = (query) => {
  const normalizedQuery = query.toLowerCase();
  
  // Medical condition queries
  if (normalizedQuery.includes('pain') || normalizedQuery.includes('hurt')) {
    return getMedicalStrains('pain');
  }
  
  if (normalizedQuery.includes('anxiety') || normalizedQuery.includes('stress')) {
    return getMedicalStrains('anxiety');
  }
  
  if (normalizedQuery.includes('sleep') || normalizedQuery.includes('insomnia')) {
    return getMedicalStrains('insomnia');
  }
  
  // Effect-based queries
  if (normalizedQuery.includes('creative') || normalizedQuery.includes('focus')) {
    return getStrainsByEffect(STRAIN_EFFECTS.CREATIVE);
  }
  
  if (normalizedQuery.includes('relax') || normalizedQuery.includes('calm')) {
    return getStrainsByEffect(STRAIN_EFFECTS.RELAXED);
  }
  
  if (normalizedQuery.includes('energy') || normalizedQuery.includes('uplift')) {
    return getStrainsByEffect(STRAIN_EFFECTS.ENERGETIC);
  }
  
  // Beginner queries
  if (normalizedQuery.includes('beginner') || normalizedQuery.includes('new')) {
    return getBeginnerStrains();
  }
  
  // Specific strain queries
  const specificStrain = enhancedStrainDatabase.find(s => 
    normalizedQuery.includes(s.name.toLowerCase())
  );
  
  if (specificStrain) {
    return [getDetailedStrainInfo(specificStrain.name)];
  }
  
  // Default recommendation for general queries
  return enhancedStrainDatabase.slice(0, 5);
};

export default {
  STRAIN_EFFECTS,
  STRAIN_GENETICS,
  enhancedStrainDatabase,
  getStrainRecommendation,
  getDetailedStrainInfo,
  getMedicalStrains,
  getStrainsByEffect,
  getBeginnerStrains,
  getStrainConsultation
};