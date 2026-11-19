import React, { createContext, useContext, useState, useEffect } from 'react';
import { JobAlert, CareerPathResult } from '../utils/radarEngine';

export interface SavedJobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  numericMinSalary: number;
  numericMaxSalary: number;
  matchScore: number;
  skills: string[];
  sector: string;
  urgency: string;
  savedAt: string;
}

export interface SavedCareerPathItem {
  id: string;
  targetRole: string;
  currentRole: string;
  targetSalary: number;
  readinessScore: number;
  timelineMonths: number;
  milestonesCount: number;
  criticalSkills: string[];
  savedAt: string;
}

export interface SavedNewsItem {
  id: string;
  headline: string;
  company: string;
  sector: string;
  source: string;
  date: string;
  impact: 'Positive' | 'Neutral' | 'Risk';
  summary?: string;
  savedAt: string;
}

interface SavedItemsState {
  jobs: SavedJobItem[];
  careerPaths: SavedCareerPathItem[];
  news: SavedNewsItem[];
}

interface SavedItemsContextType {
  savedJobs: SavedJobItem[];
  savedCareerPaths: SavedCareerPathItem[];
  savedNews: SavedNewsItem[];
  totalSavedCount: number;
  // Job actions
  saveJob: (job: JobAlert) => void;
  removeJob: (jobId: string) => void;
  toggleSaveJob: (job: JobAlert) => void;
  isJobSaved: (jobId: string) => boolean;
  // Career Path actions
  saveCareerPath: (path: CareerPathResult) => void;
  removeCareerPath: (pathId: string) => void;
  toggleSaveCareerPath: (path: CareerPathResult) => void;
  isCareerPathSaved: (targetRole: string) => boolean;
  // News actions
  saveNewsItem: (item: SavedNewsItem) => void;
  removeNewsItem: (itemId: string) => void;
  toggleSaveNewsItem: (item: SavedNewsItem) => void;
  isNewsSaved: (itemId: string) => boolean;
  // Bulk
  clearAllBookmarks: () => void;
}

const STORAGE_KEY = 'talent_radar_saved_items_v1';

const INITIAL_SAVED_DATA: SavedItemsState = {
  jobs: [
    {
      id: 'ALERT-901',
      title: 'Staff Autonomous Systems Engineer',
      company: 'Skydio / Horizon Dynamics',
      location: 'San Francisco, CA (Hybrid)',
      salaryRange: '$220,000 - $295,000 + 0.15% Equity',
      numericMinSalary: 220000,
      numericMaxSalary: 295000,
      matchScore: 96,
      skills: ['Rust', 'ROS 2', 'Embedded Linux', 'CUDA'],
      sector: 'Autonomous Robotics',
      urgency: 'URGENT',
      savedAt: 'Today',
    },
    {
      id: 'ALERT-902',
      title: 'Principal AI Infrastructure Architect',
      company: 'TensorScale Labs',
      location: 'New York, NY / Remote',
      salaryRange: '$250,000 - $340,000 + Top Tier Grants',
      numericMinSalary: 250000,
      numericMaxSalary: 340000,
      matchScore: 94,
      skills: ['Distributed Systems', 'Ray', 'vLLM', 'InfiniBand'],
      sector: 'Frontier AI & Cloud Infrastructure',
      urgency: 'HIGH PRIORITY',
      savedAt: 'Yesterday',
    },
  ],
  careerPaths: [
    {
      id: 'cp-principal-ai',
      targetRole: 'Principal AI Infrastructure Architect',
      currentRole: 'Senior Distributed Systems Engineer',
      targetSalary: 320000,
      readinessScore: 88,
      timelineMonths: 14,
      milestonesCount: 3,
      criticalSkills: ['Custom Triton Kernels', 'Distributed Checkpointing', 'RoCE / InfiniBand'],
      savedAt: '2 days ago',
    },
  ],
  news: [
    {
      id: 'news-anthropic-inference',
      headline: 'Anthropic expands dedicated inference optimization task force',
      company: 'Anthropic & OpenAI Ecosystem',
      sector: 'Frontier AI & High-Performance Compute',
      source: 'Silicon Intel Intercept',
      date: '3 days ago',
      impact: 'Positive',
      summary: 'Aggressive talent poaching across systems infrastructure, prioritizing low-level token throughput engineers.',
      savedAt: 'Today',
    },
  ],
};

const SavedItemsContext = createContext<SavedItemsContextType | undefined>(undefined);

export const SavedItemsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SavedItemsState>(() => {
    if (typeof window === 'undefined') return INITIAL_SAVED_DATA;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load saved items from localStorage:', e);
    }
    return INITIAL_SAVED_DATA;
  });

  // Sync to local storage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to persist saved items to localStorage:', e);
    }
  }, [state]);

  // Job operations
  const saveJob = (job: JobAlert) => {
    setState((prev) => {
      if (prev.jobs.some((j) => j.id === job.id)) return prev;
      const newJobItem: SavedJobItem = {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        salaryRange: job.salaryRange,
        numericMinSalary: job.numericMinSalary,
        numericMaxSalary: job.numericMaxSalary,
        matchScore: job.matchScore,
        skills: job.skills,
        sector: job.sector,
        urgency: job.urgency,
        savedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
      return { ...prev, jobs: [newJobItem, ...prev.jobs] };
    });
  };

  const removeJob = (jobId: string) => {
    setState((prev) => ({
      ...prev,
      jobs: prev.jobs.filter((j) => j.id !== jobId),
    }));
  };

  const toggleSaveJob = (job: JobAlert) => {
    if (state.jobs.some((j) => j.id === job.id)) {
      removeJob(job.id);
    } else {
      saveJob(job);
    }
  };

  const isJobSaved = (jobId: string) => {
    return state.jobs.some((j) => j.id === jobId);
  };

  // Career Path operations
  const saveCareerPath = (path: CareerPathResult) => {
    setState((prev) => {
      const existingIdx = prev.careerPaths.findIndex((cp) => cp.targetRole === path.targetRole);
      const newCPItem: SavedCareerPathItem = {
        id: `cp-${path.targetRole.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        targetRole: path.targetRole,
        currentRole: path.currentRole,
        targetSalary: path.targetSalary || path.salaryProgression[path.salaryProgression.length - 1]?.salary || 300000,
        readinessScore: path.readinessScore,
        timelineMonths: path.estimatedTimelineMonths,
        milestonesCount: path.milestones.length,
        criticalSkills: path.skillGaps.slice(0, 3).map((s) => s.skill.split('(')[0].trim()),
        savedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };

      if (existingIdx >= 0) {
        const updated = [...prev.careerPaths];
        updated[existingIdx] = newCPItem;
        return { ...prev, careerPaths: updated };
      }
      return { ...prev, careerPaths: [newCPItem, ...prev.careerPaths] };
    });
  };

  const removeCareerPath = (pathId: string) => {
    setState((prev) => ({
      ...prev,
      careerPaths: prev.careerPaths.filter((cp) => cp.id !== pathId && cp.targetRole !== pathId),
    }));
  };

  const toggleSaveCareerPath = (path: CareerPathResult) => {
    if (state.careerPaths.some((cp) => cp.targetRole === path.targetRole)) {
      removeCareerPath(path.targetRole);
    } else {
      saveCareerPath(path);
    }
  };

  const isCareerPathSaved = (targetRole: string) => {
    return state.careerPaths.some(
      (cp) => cp.targetRole.toLowerCase() === targetRole.toLowerCase()
    );
  };

  // News operations
  const saveNewsItem = (item: SavedNewsItem) => {
    setState((prev) => {
      if (prev.news.some((n) => n.id === item.id)) return prev;
      return { ...prev, news: [item, ...prev.news] };
    });
  };

  const removeNewsItem = (itemId: string) => {
    setState((prev) => ({
      ...prev,
      news: prev.news.filter((n) => n.id !== itemId),
    }));
  };

  const toggleSaveNewsItem = (item: SavedNewsItem) => {
    if (state.news.some((n) => n.id === item.id)) {
      removeNewsItem(item.id);
    } else {
      saveNewsItem(item);
    }
  };

  const isNewsSaved = (itemId: string) => {
    return state.news.some((n) => n.id === itemId);
  };

  const clearAllBookmarks = () => {
    setState({ jobs: [], careerPaths: [], news: [] });
  };

  const totalSavedCount = state.jobs.length + state.careerPaths.length + state.news.length;

  return (
    <SavedItemsContext.Provider
      value={{
        savedJobs: state.jobs,
        savedCareerPaths: state.careerPaths,
        savedNews: state.news,
        totalSavedCount,
        saveJob,
        removeJob,
        toggleSaveJob,
        isJobSaved,
        saveCareerPath,
        removeCareerPath,
        toggleSaveCareerPath,
        isCareerPathSaved,
        saveNewsItem,
        removeNewsItem,
        toggleSaveNewsItem,
        isNewsSaved,
        clearAllBookmarks,
      }}
    >
      {children}
    </SavedItemsContext.Provider>
  );
};

export const useSavedItems = () => {
  const context = useContext(SavedItemsContext);
  if (!context) {
    throw new Error('useSavedItems must be used within a SavedItemsProvider');
  }
  return context;
};
