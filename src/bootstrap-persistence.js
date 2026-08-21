// Bootstrap persistence layer initialization
// Wires up storage adapters to game systems

import { StorageAdapter } from './adapters/StorageAdapter.js';
import { LevelProgression } from './gameplay/LevelProgression.js';
import { SettingsPanel, DEFAULT_SETTINGS } from './ui/SettingsPanel.js';
import { TutorialSystem } from './ui/TutorialSystem.js';

// Initialize storage adapters for each game system
const levelProgressAdapter = new StorageAdapter(
  'moldavite-level-progress',
  {
    currentLevel: "chlum",
    completedLevels: [],
    highestUnlockedLevel: "chlum",
    levelStats: {},
    totalScore: 0,
    totalFindings: 0,
    createdAt: Date.now()
  }
);

const settingsAdapter = new StorageAdapter(
  'moldavite-settings',
  DEFAULT_SETTINGS
);

const tutorialAdapter = new StorageAdapter(
  'moldavite-tutorial-progress',
  []
);

// Re-export initialized game systems with injected adapters
export const levelProgression = new LevelProgression({ storageAdapter: levelProgressAdapter });
export const settingsPanel = new SettingsPanel({ storageAdapter: settingsAdapter });
export const tutorialSystem = new TutorialSystem({ storageAdapter: tutorialAdapter });
