/**
 * Core types for the Narrative Analysis Service
 * Supports multi-cultural story structures and trauma-informed analysis
 */

export interface NarrativeAnalysis {
  id: string;
  userId: string;
  projectId: string;
  timestamp: Date;
  storyCoherence: CoherenceScore;
  characterDevelopment: CharacterAnalysis[];
  plotStructure: StructureAnalysis;
  pacing: PacingAnalysis;
  themeIntegration: ThemeAnalysis;
  writingCraft: WritingCraftAnalysis;
  culturalFramework: CulturalFramework;
  suggestions: WritingSuggestion[];
  traumaInformedNotes?: TraumaInformedNote[];
}

export interface CoherenceScore {
  overall: number; // 0-100
  character: number;
  plot: number;
  setting: number;
  voice: number;
  timeline: number;
  inconsistencies: Inconsistency[];
}

export interface CharacterAnalysis {
  id: string;
  name: string;
  role: CharacterRole;
  arc: CharacterArc;
  development: CharacterDevelopment;
  relationships: CharacterRelationship[];
  consistency: number; // 0-100
  screenTime: number; // percentage of story
  emotionalJourney: EmotionalArc;
}

export interface CharacterArc {
  type: CharacterArcType;
  stages: ArcStage[];
  completion: number; // 0-100
  clarity: number; // 0-100
  motivation: string;
  stakes: string;
  obstacles: string[];
}

export interface StructureAnalysis {
  framework: StoryFramework;
  detected: DetectedStructure;
  adherence: number; // 0-100
  pacing: StructurePacing;
  acts: ActAnalysis[];
  plotPoints: PlotPoint[];
  conflicts: ConflictAnalysis[];
}

export interface PacingAnalysis {
  overall: PacingRhythm;
  scenes: ScenePacing[];
  tension: TensionCurve;
  dialogue: DialogueAnalysis;
  action: ActionSequenceAnalysis;
  recommendations: PacingRecommendation[];
}

export interface ThemeAnalysis {
  primaryTheme: string;
  subthemes: string[];
  development: ThemeDevelopment[];
  integration: number; // 0-100
  consistency: number; // 0-100
  symbolism: SymbolismAnalysis[];
  metaphors: MetaphorAnalysis[];
}

export interface WritingCraftAnalysis {
  voice: VoiceAnalysis;
  style: StyleAnalysis;
  prose: ProseQuality;
  dialogue: DialogueQuality;
  description: DescriptionAnalysis;
  pointOfView: POVAnalysis;
  tense: TenseConsistency;
  showVsTell: ShowVsTellAnalysis;
}

export interface CulturalFramework {
  type: CulturalStoryType;
  origin: string;
  characteristics: string[];
  adaptations: string[];
  sensitivityNotes: string[];
}

export interface WritingSuggestion {
  id: string;
  type: SuggestionType;
  priority: Priority;
  category: SuggestionCategory;
  title: string;
  description: string;
  example?: string;
  location?: TextLocation;
  traumaInformed: boolean;
  culturallySensitive: boolean;
}

export interface TraumaInformedNote {
  id: string;
  type: TraumaType;
  severity: TreatmentSeverity;
  suggestion: string;
  resources?: string[];
  professionalRecommendation: boolean;
}

// Enums and supporting types
export enum CharacterRole {
  PROTAGONIST = 'protagonist',
  ANTAGONIST = 'antagonist',
  DEUTERAGONIST = 'deuteragonist',
  SUPPORTING = 'supporting',
  MINOR = 'minor',
  NARRATOR = 'narrator'
}

export enum CharacterArcType {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  FLAT = 'flat',
  COMPLEX = 'complex',
  FALL = 'fall',
  CORRUPTION = 'corruption',
  REDEMPTION = 'redemption'
}

export enum StoryFramework {
  THREE_ACT = 'three_act',
  HEROS_JOURNEY = 'heros_journey',
  SAVE_THE_CAT = 'save_the_cat',
  KISHOTENKETSU = 'kishotenketsu',
  FREYTAGS_PYRAMID = 'freytags_pyramid',
  SEVEN_POINT = 'seven_point',
  FICHTEAN_CURVE = 'fichtean_curve',
  CUSTOM = 'custom'
}

export enum CulturalStoryType {
  WESTERN_LINEAR = 'western_linear',
  KISHOTEN_KETSU = 'kishotenketsu',
  CIRCULAR_NARRATIVE = 'circular_narrative',
  EPISODIC = 'episodic',
  ORAL_TRADITION = 'oral_tradition',
  MYTHOLOGICAL = 'mythological',
  INDIGENOUS = 'indigenous',
  EASTERN_PHILOSOPHICAL = 'eastern_philosophical'
}

export enum SuggestionType {
  STRUCTURE = 'structure',
  CHARACTER = 'character',
  DIALOGUE = 'dialogue',
  PACING = 'pacing',
  THEME = 'theme',
  CRAFT = 'craft',
  CULTURAL = 'cultural',
  TRAUMA_INFORMED = 'trauma_informed'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum SuggestionCategory {
  STORY_STRUCTURE = 'story_structure',
  CHARACTER_DEVELOPMENT = 'character_development',
  WRITING_CRAFT = 'writing_craft',
  EMOTIONAL_SAFETY = 'emotional_safety',
  CULTURAL_SENSITIVITY = 'cultural_sensitivity',
  GENRE_CONVENTIONS = 'genre_conventions'
}

export enum TraumaType {
  EMOTIONAL_PROCESSING = 'emotional_processing',
  CRISIS_INDICATION = 'crisis_indication',
  TRIGGER_WARNING = 'trigger_warning',
  PROFESSIONAL_RESOURCE = 'professional_resource'
}

export enum TreatmentSeverity {
  GENTLE = 'gentle',
  MODERATE = 'moderate',
  PROFESSIONAL = 'professional',
  CRISIS = 'crisis'
}

// Supporting interfaces
export interface ArcStage {
  name: string;
  position: number; // 0-100
  completed: boolean;
  description: string;
}

export interface CharacterDevelopment {
  growth: number; // 0-100
  believability: number; // 0-100
  agency: number; // 0-100
  complexity: number; // 0-100
}

export interface CharacterRelationship {
  targetCharacter: string;
  type: RelationshipType;
  strength: number; // 0-100
  development: number; // 0-100
  conflict: boolean;
}

export interface EmotionalArc {
  startingEmotion: string;
  endingEmotion: string;
  keyEmotionalBeats: EmotionalBeat[];
  authenticity: number; // 0-100
}

export interface EmotionalBeat {
  position: number; // 0-100
  emotion: string;
  intensity: number; // 0-100
  trigger: string;
}

export interface DetectedStructure {
  framework: StoryFramework;
  confidence: number; // 0-100
  keyBeats: StructuralBeat[];
  missing: string[];
}

export interface StructuralBeat {
  name: string;
  expectedPosition: number; // 0-100
  actualPosition?: number; // 0-100
  present: boolean;
  strength: number; // 0-100
}

export interface ActAnalysis {
  act: number;
  startPosition: number; // 0-100
  endPosition: number; // 0-100
  purpose: string;
  effectiveness: number; // 0-100
  keyEvents: string[];
}

export interface PlotPoint {
  id: string;
  type: PlotPointType;
  position: number; // 0-100
  description: string;
  importance: number; // 0-100
  connected: boolean;
}

export interface ConflictAnalysis {
  type: ConflictType;
  intensity: number; // 0-100
  resolution: ConflictResolution;
  characters: string[];
  escalation: number[]; // progression points
}

export interface TensionCurve {
  points: TensionPoint[];
  peaks: number[];
  valleys: number[];
  overall: number; // 0-100
}

export interface TensionPoint {
  position: number; // 0-100
  intensity: number; // 0-100
  type: TensionType;
}

export interface DialogueAnalysis {
  naturalness: number; // 0-100
  characterVoice: number; // 0-100
  subtext: number; // 0-100
  purpose: number; // 0-100
  balance: number; // 0-100 (dialogue vs action)
}

export interface ActionSequenceAnalysis {
  clarity: number; // 0-100
  pacing: number; // 0-100
  stakes: number; // 0-100
  choreography: number; // 0-100
}

export interface PacingRecommendation {
  location: TextLocation;
  issue: string;
  suggestion: string;
  priority: Priority;
}

export interface TextLocation {
  chapter?: number;
  scene?: number;
  paragraph?: number;
  sentence?: number;
  wordStart?: number;
  wordEnd?: number;
}

export interface Inconsistency {
  type: InconsistencyType;
  description: string;
  locations: TextLocation[];
  severity: Priority;
}

// Analysis configuration
export interface AnalysisConfig {
  framework: StoryFramework;
  culturalSensitivity: boolean;
  traumaInformed: boolean;
  realTime: boolean;
  depth: AnalysisDepth;
  aiProvider: AIProvider;
}

export interface AnalysisRequest {
  userId: string;
  projectId: string;
  content: string;
  config: AnalysisConfig;
  metadata?: Record<string, any>;
}

export interface AnalysisResponse {
  success: boolean;
  analysis?: NarrativeAnalysis;
  error?: string;
  processingTime: number;
}

// Additional enums
export enum RelationshipType {
  FAMILY = 'family',
  ROMANTIC = 'romantic',
  FRIENDSHIP = 'friendship',
  MENTOR = 'mentor',
  ENEMY = 'enemy',
  ALLY = 'ally',
  RIVAL = 'rival',
  COLLEAGUE = 'colleague'
}

export enum PlotPointType {
  INCITING_INCIDENT = 'inciting_incident',
  PLOT_POINT_1 = 'plot_point_1',
  MIDPOINT = 'midpoint',
  PLOT_POINT_2 = 'plot_point_2',
  CLIMAX = 'climax',
  RESOLUTION = 'resolution',
  HOOK = 'hook',
  CATALYST = 'catalyst',
  DARK_MOMENT = 'dark_moment'
}

export enum ConflictType {
  PERSON_VS_PERSON = 'person_vs_person',
  PERSON_VS_SELF = 'person_vs_self',
  PERSON_VS_SOCIETY = 'person_vs_society',
  PERSON_VS_NATURE = 'person_vs_nature',
  PERSON_VS_TECHNOLOGY = 'person_vs_technology',
  PERSON_VS_FATE = 'person_vs_fate'
}

export enum ConflictResolution {
  RESOLVED = 'resolved',
  PARTIALLY_RESOLVED = 'partially_resolved',
  UNRESOLVED = 'unresolved',
  ONGOING = 'ongoing'
}

export enum TensionType {
  DRAMATIC = 'dramatic',
  ROMANTIC = 'romantic',
  SUSPENSE = 'suspense',
  MYSTERY = 'mystery',
  ACTION = 'action',
  EMOTIONAL = 'emotional'
}

export enum InconsistencyType {
  CHARACTER = 'character',
  PLOT = 'plot',
  SETTING = 'setting',
  TIMELINE = 'timeline',
  VOICE = 'voice',
  STYLE = 'style'
}

export enum AnalysisDepth {
  QUICK = 'quick',
  STANDARD = 'standard',
  COMPREHENSIVE = 'comprehensive'
}

export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  COMBINED = 'combined'
}

export enum PacingRhythm {
  TOO_SLOW = 'too_slow',
  SLOW = 'slow',
  BALANCED = 'balanced',
  FAST = 'fast',
  TOO_FAST = 'too_fast'
}

// Additional analysis interfaces
export interface ScenePacing {
  sceneId: string;
  rhythm: PacingRhythm;
  wordCount: number;
  actionToDialogueRatio: number;
  tensionLevel: number;
  recommendation?: string;
}

export interface ThemeDevelopment {
  theme: string;
  introduction: number; // position 0-100
  development: number[]; // positions where developed
  resolution: number; // position 0-100
  strength: number; // 0-100
}

export interface SymbolismAnalysis {
  symbol: string;
  meaning: string;
  frequency: number;
  effectiveness: number; // 0-100
  culturalContext?: string;
}

export interface MetaphorAnalysis {
  metaphor: string;
  effectiveness: number; // 0-100
  originality: number; // 0-100
  clarity: number; // 0-100
}

export interface VoiceAnalysis {
  consistency: number; // 0-100
  distinctiveness: number; // 0-100
  authenticity: number; // 0-100
  characterVoices: CharacterVoiceAnalysis[];
}

export interface CharacterVoiceAnalysis {
  character: string;
  distinctiveness: number; // 0-100
  consistency: number; // 0-100
  examples: string[];
}

export interface StyleAnalysis {
  sentenceVariety: number; // 0-100
  vocabularyRichness: number; // 0-100
  readability: number; // 0-100
  genreAppropriate: number; // 0-100
}

export interface ProseQuality {
  clarity: number; // 0-100
  flow: number; // 0-100
  imagery: number; // 0-100
  rhythm: number; // 0-100
}

export interface DialogueQuality {
  naturalness: number; // 0-100
  subtext: number; // 0-100
  characterDifferentiation: number; // 0-100
  purpose: number; // 0-100
}

export interface DescriptionAnalysis {
  vividness: number; // 0-100
  balance: number; // 0-100 (description vs action)
  sensoryDetails: number; // 0-100
  relevance: number; // 0-100
}

export interface POVAnalysis {
  consistency: number; // 0-100
  effectiveness: number; // 0-100
  violations: POVViolation[];
}

export interface POVViolation {
  type: string;
  location: TextLocation;
  description: string;
  severity: Priority;
}

export interface TenseConsistency {
  primary: string;
  consistency: number; // 0-100
  violations: TenseViolation[];
}

export interface TenseViolation {
  location: TextLocation;
  expected: string;
  actual: string;
  severity: Priority;
}

export interface ShowVsTellAnalysis {
  showPercentage: number; // 0-100
  tellPercentage: number; // 0-100
  balance: number; // 0-100
  improvements: ShowVsTellImprovement[];
}

export interface ShowVsTellImprovement {
  location: TextLocation;
  current: string;
  suggestion: string;
  type: 'show' | 'tell';
}

export interface StructurePacing {
  setup: number; // 0-100 percentage of story
  confrontation: number; // 0-100 percentage of story
  resolution: number; // 0-100 percentage of story
  balanced: boolean;
  recommendations: string[];
}