// Export all managers
export * from './DataManager.js';
export * from './PlaybackManager.js';
export * from './TranscriptManager.js';
export * from './AIAnalyzer.js';
export * from './MediaProcessor.js';
export * from './AdvancedFeaturesManager.js';

// Initialize AdvancedFeaturesManager with dependencies after all managers are loaded
import { dataManager } from './DataManager.js';
import { playbackManager } from './PlaybackManager.js';
import { transcriptManager } from './TranscriptManager.js';
import { aiAnalyzer } from './AIAnalyzer.js';
import { AdvancedFeaturesManager, advancedFeaturesManager as afm } from './AdvancedFeaturesManager.js';

// Create singleton with injected dependencies
export const advancedFeaturesManager = new AdvancedFeaturesManager(
  transcriptManager,
  aiAnalyzer,
  dataManager,
  playbackManager
);
