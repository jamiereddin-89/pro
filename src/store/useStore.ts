import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ModelType, ChatMessage, generateSite, updateSite, generateComponent, listModels } from '../lib/gemini';

export type GenerationMode = 'website' | 'component';

export interface Version {
  id: string;
  html: string;
  timestamp: number;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  html: string;
  messages: ChatMessage[];
  timestamp: number;
  mode: GenerationMode;
  versions: Version[];
  isAutoSave?: boolean;
}

export interface AppSettings {
  theme: 'vs-dark' | 'light' | 'hc-black';
  fontSize: number;
  autoPreview: boolean;
  wordWrap: 'on' | 'off';
  minimap: boolean;
  apiKey: string;
  customModel: string;
}

interface AppState {
  html: string;
  userInput: string;
  isLoading: boolean;
  messages: ChatMessage[];
  model: ModelType | string;
  isThinking: boolean;
  previewMode: 'desktop' | 'tablet' | 'mobile';
  activeTab: 'preview' | 'code';
  error: string | null;
  lastAction: { type: 'generate' | 'update' | 'component'; payload: string } | null;
  
  // History (Undo/Redo)
  history: string[];
  historyIndex: number;
  
  // Projects & Versions
  savedProjects: Project[];
  currentProjectId: string | null;
  generationMode: GenerationMode;
  versions: Version[];
  searchQuery: string;

  // Settings
  settings: AppSettings;
  availableModels: any[];

  // Actions
  setHtml: (html: string) => void;
  setUserInput: (input: string) => void;
  setIsLoading: (loading: boolean) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setModel: (model: ModelType | string) => void;
  setIsThinking: (isThinking: boolean) => void;
  setPreviewMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;
  setActiveTab: (tab: 'preview' | 'code') => void;
  setError: (error: string | null) => void;
  setGenerationMode: (mode: GenerationMode) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setSearchQuery: (query: string) => void;
  
  // Complex Actions
  addMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  executeAiAction: (prompt: string) => Promise<void>;
  retryLastAction: () => Promise<void>;
  
  // History Actions
  pushToHistory: (html: string) => void;
  undo: () => void;
  redo: () => void;
  
  // Project & Version Actions
  saveProject: (name: string, isAutoSave?: boolean) => void;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;
  createVersion: (description: string) => void;
  revertToVersion: (versionId: string) => void;
  
  // API Actions
  fetchModels: () => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      html: '',
      userInput: '',
      isLoading: false,
      messages: [],
      model: ModelType.FLASH,
      isThinking: false,
      previewMode: 'desktop',
      activeTab: 'preview',
      error: null,
      lastAction: null,
      history: [],
      historyIndex: -1,
      savedProjects: [],
      currentProjectId: null,
      generationMode: 'website',
      versions: [],
      searchQuery: '',
      availableModels: [],
      settings: {
        theme: 'vs-dark',
        fontSize: 14,
        autoPreview: true,
        wordWrap: 'on',
        minimap: false,
        apiKey: '',
        customModel: '',
      },

      setHtml: (html) => {
        set({ html });
        get().pushToHistory(html);
      },
      setUserInput: (userInput) => set({ userInput }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setMessages: (messages) => set({ messages }),
      setModel: (model) => set({ model }),
      setIsThinking: (isThinking) => set({ isThinking }),
      setPreviewMode: (previewMode) => set({ previewMode }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setError: (error) => set({ error }),
      setGenerationMode: (generationMode) => set({ generationMode }),
      updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      setSearchQuery: (searchQuery) => set({ searchQuery }),

      addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
      
      clearChat: () => set({ 
        messages: [], 
        html: '', 
        error: null, 
        history: [], 
        historyIndex: -1,
        currentProjectId: null,
        versions: []
      }),

      pushToHistory: (html) => {
        const { history, historyIndex } = get();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(html);
        if (newHistory.length > 50) newHistory.shift();
        set({ 
          history: newHistory, 
          historyIndex: newHistory.length - 1 
        });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          set({ 
            historyIndex: newIndex, 
            html: history[newIndex] 
          });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          set({ 
            historyIndex: newIndex, 
            html: history[newIndex] 
          });
        }
      },

      executeAiAction: async (prompt: string) => {
        const { html, model, isThinking, generationMode, settings } = get();
        set({ isLoading: true, error: null });
        
        const actionType = generationMode === 'component' ? 'component' : (html ? 'update' : 'generate');
        set({ lastAction: { type: actionType, payload: prompt } });

        try {
          let result = '';
          const apiKey = settings.apiKey || undefined;
          
          if (generationMode === 'component') {
            result = await generateComponent(prompt, model as ModelType, isThinking, apiKey);
          } else if (actionType === 'generate') {
            result = await generateSite(prompt, model as ModelType, isThinking, apiKey);
          } else {
            result = await updateSite(html, prompt, model as ModelType, isThinking, apiKey);
          }

          const cleanedHtml = result.replace(/```html/g, '').replace(/```/g, '').trim();
          
          if (generationMode === 'website' && !cleanedHtml.startsWith('<!DOCTYPE html>') && !cleanedHtml.includes('<html')) {
            throw new Error("The AI returned an invalid HTML structure. Please try again.");
          }

          set({ 
            html: cleanedHtml, 
            isLoading: false,
            activeTab: 'preview'
          });
          get().pushToHistory(cleanedHtml);
          get().addMessage({ 
            role: 'model', 
            content: actionType === 'update' ? "I've updated the site." : `I've generated your ${generationMode}.` 
          });

          get().createVersion(prompt.substring(0, 30) + (prompt.length > 30 ? '...' : ''));
        } catch (err: any) {
          console.error("AI Action Error:", err);
          const errorMessage = err.message || "An unexpected error occurred.";
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          get().addMessage({ 
            role: 'model', 
            content: `Error: ${errorMessage}` 
          });
        }
      },

      retryLastAction: async () => {
        const { lastAction } = get();
        if (lastAction) {
          await get().executeAiAction(lastAction.payload);
        }
      },

      saveProject: (name, isAutoSave = false) => {
        const { html, messages, savedProjects, currentProjectId, generationMode, versions } = get();
        
        const id = isAutoSave 
          ? (currentProjectId ? `${currentProjectId}-autosave` : 'autosave-latest')
          : (currentProjectId || Math.random().toString(36).substring(7));
          
        const newProject: Project = {
          id,
          name: isAutoSave ? `[Auto-save] ${name || 'Untitled'}` : name,
          html,
          messages,
          timestamp: Date.now(),
          mode: generationMode,
          versions,
          isAutoSave
        };

        const existingIndex = savedProjects.findIndex(p => p.id === id);
        const newSavedProjects = [...savedProjects];
        
        if (existingIndex >= 0) {
          newSavedProjects[existingIndex] = newProject;
        } else {
          newSavedProjects.push(newProject);
        }

        set({ 
          savedProjects: newSavedProjects, 
          currentProjectId: isAutoSave ? currentProjectId : id 
        });
      },

      loadProject: (id) => {
        const { savedProjects } = get();
        const project = savedProjects.find(p => p.id === id);
        if (project) {
          set({ 
            html: project.html, 
            messages: project.messages, 
            currentProjectId: project.isAutoSave ? null : id,
            generationMode: project.mode,
            history: [project.html],
            historyIndex: 0,
            versions: project.versions || []
          });
        }
      },

      deleteProject: (id) => {
        set((state) => ({
          savedProjects: state.savedProjects.filter(p => p.id !== id),
          currentProjectId: state.currentProjectId === id ? null : state.currentProjectId
        }));
      },

      createVersion: (description) => {
        const { html, versions } = get();
        const newVersion: Version = {
          id: Math.random().toString(36).substring(7),
          html,
          timestamp: Date.now(),
          description
        };
        set({ versions: [newVersion, ...versions].slice(0, 20) });
      },

      revertToVersion: (versionId) => {
        const { versions } = get();
        const version = versions.find(v => v.id === versionId);
        if (version) {
          get().setHtml(version.html);
          get().addMessage({ role: 'model', content: `Reverted to version: ${version.description}` });
        }
      },

      fetchModels: async () => {
        const { settings } = get();
        try {
          const models = await listModels(settings.apiKey || undefined);
          set({ availableModels: models });
        } catch (err) {
          console.error("Failed to fetch models:", err);
        }
      }
    }),
    {
      name: 'gemini-builder-storage-v3',
      partialize: (state) => ({ 
        savedProjects: state.savedProjects,
        model: state.model,
        isThinking: state.isThinking,
        settings: state.settings
      }),
    }
  )
);
