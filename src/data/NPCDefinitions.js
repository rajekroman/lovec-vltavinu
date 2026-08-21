/**
 * NPC Detailed Character Definitions
 * Complete specifications for all game NPCs based on Claude Design
 */

export const NPC_DEFINITIONS = {
  farmer_vaclav: {
    id: "farmer_vaclav",
    internalName: "Václav",
    displayName: "Václav",
    role: "Farmer",
    location: "Chlum",
    description: "An elderly farmer who tends the fields of Chlum. Cautious about trespassers but willing to share knowledge about the land.",

    // Visual properties (from Claude Design)
    appearance: {
      height: "160px",
      width: "120px",
      skinTone: "#d4a574",
      clothingColor: "#6b7d5a",
      accentColor: "#8b9d6f",
      shadowColor: "#5a6b4a",
      baselineAnchor: 116 // pixels
    },

    // Character personality traits (affect dialogue tone)
    personality: {
      openness: 0.6,
      aggressiveness: 0.2,
      intelligence: 0.7,
      curiosity: 0.4,
      trustworthiness: 0.8
    },

    // Interaction parameters
    interaction: {
      interactionRange: 64,
      maxConversationTurns: 8,
      hasPermission: true,
      permissionKey: "chlum_farmer_permission",
      canGrantPermission: true
    },

    // Animation preferences
    animationSpeed: 1.0,
    defaultIdleAnimation: "idle",
    idleBlinkInterval: 3000,
    gestureFrequency: 0.3,

    // Dialogue emotional state progression
    emotionalStates: {
      neutral: {
        animation: "idle",
        bodyLanguage: "relaxed",
        armPosition: "down"
      },
      greeting: {
        animation: "talk",
        bodyLanguage: "friendly",
        armPosition: "open"
      },
      concerned: {
        animation: "react_concern",
        bodyLanguage: "tense",
        armPosition: "crossed"
      },
      welcoming: {
        animation: "react_welcome",
        bodyLanguage: "open",
        armPosition: "wide"
      },
      pointing: {
        animation: "action_point",
        bodyLanguage: "directive",
        armPosition: "extended_right"
      }
    },

    // Voice/dialogue tone (for text-to-speech if implemented)
    voice: {
      pitch: 0.9,
      speed: 0.85,
      warmth: 0.7,
      authorityLevel: 0.6
    },

    // Reaction triggers and patterns
    reactions: {
      playerApproach: { animation: "idle", delay: 200 },
      playerGreeting: { animation: "talk", delay: 300 },
      playerAsksPermission: { animation: "react_welcome", delay: 500 },
      playerViolatespermission: { animation: "react_concern", delay: 300 }
    },

    // Lore/background
    background: {
      birthYear: 1958,
      age: 66,
      occupation: "Farmer",
      yearsInLocation: 42,
      familyMembers: ["Anna (wife)", "Tomáš (son)"],
      skills: ["Land management", "Weather prediction", "Equipment repair"],
      secrets: ["Knows location of old moldavite cache", "Concerned about land being sold"]
    },

    // Relationship with player
    initialReputation: 0,
    reputationThresholds: {
      hostile: -100,
      wary: -50,
      neutral: 0,
      friendly: 50,
      trusted: 100
    }
  },

  forester_jan: {
    id: "forester_jan",
    internalName: "Jan",
    displayName: "Jan",
    role: "Forester",
    location: "Nesměň",
    description: "A stern forester responsible for forest maintenance. Watchful and protective of the woods, but fair in his dealings.",

    appearance: {
      height: "160px",
      width: "120px",
      skinTone: "#d4a574",
      clothingColor: "#4a5a3a",
      accentColor: "#8b9d6f",
      shadowColor: "#2d3a1a",
      baselineAnchor: 116
    },

    personality: {
      openness: 0.5,
      aggressiveness: 0.6,
      intelligence: 0.75,
      curiosity: 0.3,
      trustworthiness: 0.7
    },

    interaction: {
      interactionRange: 64,
      maxConversationTurns: 6,
      hasPermission: true,
      permissionKey: "nesmen_forester_permission",
      canGrantPermission: true,
      requiresCleanup: true // Must restore dug areas
    },

    animationSpeed: 1.1,
    defaultIdleAnimation: "idle",
    idleBlinkInterval: 2500,
    gestureFrequency: 0.4,

    emotionalStates: {
      neutral: {
        animation: "idle",
        bodyLanguage: "alert",
        armPosition: "ready"
      },
      serious: {
        animation: "react_alert",
        bodyLanguage: "stern",
        armPosition: "down"
      },
      relaxed: {
        animation: "idle",
        bodyLanguage: "calm",
        armPosition: "casual"
      },
      warning: {
        animation: "react_warning",
        bodyLanguage: "threatening",
        armPosition: "extended"
      },
      beckoning: {
        animation: "action_beckon",
        bodyLanguage: "inviting",
        armPosition: "curved"
      }
    },

    voice: {
      pitch: 0.75,
      speed: 0.8,
      warmth: 0.4,
      authorityLevel: 0.85
    },

    reactions: {
      playerApproach: { animation: "alert", delay: 200 },
      playerGreeting: { animation: "talk", delay: 400 },
      playerViolatesPermission: { animation: "warning", delay: 300 },
      playerHelpsCleanup: { animation: "welcoming", delay: 500 }
    },

    background: {
      birthYear: 1972,
      age: 52,
      occupation: "Forest Ranger",
      yearsInLocation: 28,
      familyMembers: ["Petra (wife)", "Lukáš (daughter)"],
      skills: ["Forest management", "Animal tracking", "Survival skills"],
      secrets: ["Knows about illegal logging", "Protective of specific forest areas"]
    },

    initialReputation: 25,
    reputationThresholds: {
      hostile: -100,
      wary: -30,
      neutral: 0,
      friendly: 40,
      trusted: 80
    }
  },

  expert_eva: {
    id: "expert_eva",
    internalName: "Eva",
    displayName: "Eva",
    role: "Geological Expert",
    location: "Besednice & Slavia",
    description: "A knowledgeable geological expert who studies the region's mineral deposits. Curious, analytical, and eager to help researchers.",

    appearance: {
      height: "160px",
      width: "120px",
      skinTone: "#d4a574",
      clothingColor: "#7a8a6a",
      accentColor: "#8b9d6f",
      shadowColor: "#5a6b4a",
      baselineAnchor: 116,
      distinguishingFeature: "Glasses/spectacles"
    },

    personality: {
      openness: 0.9,
      aggressiveness: 0.1,
      intelligence: 0.95,
      curiosity: 0.95,
      trustworthiness: 0.85
    },

    interaction: {
      interactionRange: 80,
      maxConversationTurns: 12,
      hasPermission: true,
      permissionKey: "besednice_expert_permission",
      canGrantPermission: false, // No permission needed, but provides advice
      providesAdvice: true
    },

    animationSpeed: 0.95,
    defaultIdleAnimation: "idle",
    idleBlinkInterval: 3500,
    gestureFrequency: 0.6,

    emotionalStates: {
      neutral: {
        animation: "idle",
        bodyLanguage: "thoughtful",
        armPosition: "down"
      },
      explaining: {
        animation: "talk",
        bodyLanguage: "engaged",
        armPosition: "gesturing"
      },
      curious: {
        animation: "react_curious",
        bodyLanguage: "interested",
        armPosition: "pointing"
      },
      pondering: {
        animation: "react_pondering",
        bodyLanguage: "analytical",
        armPosition: "thinking"
      },
      affirming: {
        animation: "react_welcome",
        bodyLanguage: "supportive",
        armPosition: "open"
      },
      skeptical: {
        animation: "idle",
        bodyLanguage: "doubtful",
        armPosition: "crossed"
      }
    },

    voice: {
      pitch: 1.1,
      speed: 0.9,
      warmth: 0.8,
      authorityLevel: 0.9
    },

    reactions: {
      playerApproach: { animation: "curious", delay: 300 },
      playerAsksAboutFindings: { animation: "explaining", delay: 400 },
      playerAsksForAdvice: { animation: "talk", delay: 200 },
      playerShares: { animation: "affirming", delay: 300 }
    },

    background: {
      birthYear: 1985,
      age: 41,
      occupation: "Geologist/Researcher",
      yearsInLocation: 8,
      familyMembers: ["David (husband)", "Sophie (son)"],
      skills: ["Geology", "Mineral identification", "Sample analysis", "Documentation"],
      secrets: ["Publishing research on local minerals", "Protecting rare geological sites"]
    },

    initialReputation: 40,
    reputationThresholds: {
      hostile: -80,
      wary: 0,
      neutral: 20,
      friendly: 60,
      trusted: 100
    }
  },

  rival_karel: {
    id: "rival_karel",
    internalName: "Karel",
    displayName: "Karel",
    role: "Rival Digger",
    location: "Besednice",
    description: "A competitive rival digger who searches for the same treasures. Aggressive and territorial, but not entirely malicious.",

    appearance: {
      height: "160px",
      width: "120px",
      skinTone: "#d4a574",
      clothingColor: "#3d4a2b",
      accentColor: "#8b9d6f",
      shadowColor: "#2d3a1a",
      baselineAnchor: 116,
      distinguishingFeature: "Scarred face, muscular build"
    },

    personality: {
      openness: 0.3,
      aggressiveness: 0.9,
      intelligence: 0.6,
      curiosity: 0.4,
      trustworthiness: 0.2
    },

    interaction: {
      interactionRange: 48,
      maxConversationTurns: 3,
      hasPermission: false,
      conflictType: "rivalry",
      canInitiateCombat: true,
      threatLevel: "high"
    },

    animationSpeed: 1.2,
    defaultIdleAnimation: "idle",
    idleBlinkInterval: 2000,
    gestureFrequency: 0.7,

    emotionalStates: {
      neutral: {
        animation: "idle",
        bodyLanguage: "confrontational",
        armPosition: "ready"
      },
      aggressive: {
        animation: "react_aggressive",
        bodyLanguage: "threatening",
        armPosition: "tensed"
      },
      smug: {
        animation: "idle",
        bodyLanguage: "arrogant",
        armPosition: "confident"
      },
      warning: {
        animation: "react_warning",
        bodyLanguage: "aggressive",
        armPosition: "blocking"
      },
      backing_away: {
        animation: "action_back_away",
        bodyLanguage: "tactical",
        armPosition: "defensive"
      }
    },

    voice: {
      pitch: 0.65,
      speed: 1.0,
      warmth: 0.1,
      authorityLevel: 0.5
    },

    reactions: {
      playerApproach: { animation: "aggressive", delay: 100 },
      playerInsult: { animation: "threatening", delay: 200 },
      playerBacksOff: { animation: "smug", delay: 300 },
      playerBeatHim: { animation: "backing_away", delay: 400 }
    },

    background: {
      birthYear: 1988,
      age: 38,
      occupation: "Independent Digger",
      yearsInLocation: 6,
      familyMembers: ["Unknown"],
      skills: ["Digging", "Combat", "Intimidation"],
      secrets: ["Criminal record", "Desperate for money", "Looking for specific artifact"]
    },

    initialReputation: -50,
    reputationThresholds: {
      hostile: -60,
      wary: -20,
      neutral: 30,
      friendly: 80,
      trusted: 120
    }
  },

  thief_franta: {
    id: "thief_franta",
    internalName: "František",
    displayName: "František",
    role: "Guide/Antiquarian",
    location: "Slavia",
    description: "A mysterious figure with knowledge of historical locations and artifacts. Operates in shadowy ways but has valuable connections.",

    appearance: {
      height: "160px",
      width: "120px",
      skinTone: "#d4a574",
      clothingColor: "#3d4a2b",
      accentColor: "#8b9d6f",
      shadowColor: "#2d3a1a",
      baselineAnchor: 116,
      distinguishingFeature: "Long coat, mysterious demeanor"
    },

    personality: {
      openness: 0.4,
      aggressiveness: 0.4,
      intelligence: 0.85,
      curiosity: 0.7,
      trustworthiness: 0.35
    },

    interaction: {
      interactionRange: 64,
      maxConversationTurns: 8,
      hasPermission: false,
      dealType: "alliance",
      canTrade: true,
      requiresVerification: true
    },

    animationSpeed: 1.0,
    defaultIdleAnimation: "idle",
    idleBlinkInterval: 3000,
    gestureFrequency: 0.5,

    emotionalStates: {
      neutral: {
        animation: "idle",
        bodyLanguage: "mysterious",
        armPosition: "casual"
      },
      mysterious: {
        animation: "react_mysterious",
        bodyLanguage: "enigmatic",
        armPosition: "hidden"
      },
      scheming: {
        animation: "idle",
        bodyLanguage: "calculating",
        armPosition: "thinking"
      },
      friendly: {
        animation: "react_friendly",
        bodyLanguage: "welcoming",
        armPosition: "open"
      },
      warning: {
        animation: "react_warning",
        bodyLanguage: "serious",
        armPosition: "firm"
      }
    },

    voice: {
      pitch: 0.8,
      speed: 0.85,
      warmth: 0.3,
      authorityLevel: 0.7
    },

    reactions: {
      playerApproach: { animation: "mysterious", delay: 200 },
      playerAsksAboutDoc: { animation: "scheming", delay: 300 },
      playerBuysInfo: { animation: "friendly", delay: 400 },
      playerBetray: { animation: "warning", delay: 200 }
    },

    background: {
      birthYear: 1970,
      age: 56,
      occupation: "Antiquarian/Information Broker",
      yearsInLocation: 15,
      familyMembers: ["Unknown contacts"],
      skills: ["Antiquities", "Information gathering", "Negotiation", "Stealth"],
      secrets: ["Former archaeologist", "Hiding from authorities", "Knows artifact locations"]
    },

    initialReputation: 0,
    reputationThresholds: {
      hostile: -100,
      wary: -50,
      neutral: 0,
      friendly: 70,
      trusted: 110
    }
  }
};

/**
 * Get NPC definition by ID or role/location
 * @param {string} query - NPC ID, role, or location
 * @returns {object|null} NPC definition or null
 */
export function getNPCDefinition(query) {
  const lowercase = query.toLowerCase();

  // Direct ID match
  if (NPC_DEFINITIONS[query]) {
    return NPC_DEFINITIONS[query];
  }

  // Search by ID (case-insensitive)
  for (const [key, npc] of Object.entries(NPC_DEFINITIONS)) {
    if (key === lowercase) return npc;
  }

  // Search by name or role
  for (const npc of Object.values(NPC_DEFINITIONS)) {
    if (
      npc.internalName.toLowerCase() === lowercase ||
      npc.displayName.toLowerCase() === lowercase ||
      npc.role.toLowerCase() === lowercase
    ) {
      return npc;
    }
  }

  return null;
}

/**
 * Get all NPCs by location
 * @param {string} location - Location name
 * @returns {object[]} Array of NPCs at location
 */
export function getNPCsByLocation(location) {
  return Object.values(NPC_DEFINITIONS).filter(
    npc => npc.location.toLowerCase() === location.toLowerCase()
  );
}
