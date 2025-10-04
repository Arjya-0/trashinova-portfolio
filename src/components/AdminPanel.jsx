import React, { useState, useEffect } from 'react';
import { setDoc, doc as firestoreDoc, getDocs, collection as firestoreCollection, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { storage, db, auth } from '../config/firebase';
import { 
  Upload, Image, Box, FileText, Database, 
  Plus, Save, X, AlertCircle 
} from 'lucide-react';

const AdminPanel = ({ onEditModeChange }) => {
  const [editMode, setEditMode] = useState(false);
  // Notify parent/app of edit mode change
  useEffect(() => {
    if (onEditModeChange) onEditModeChange(editMode);
    // Persist immediately so navigating away preserves edit mode
    try {
      localStorage.setItem('editMode', editMode);
    } catch (e) {
      console.warn('Could not persist editMode to localStorage:', e);
    }
  }, [editMode, onEditModeChange]);
  const [team, setTeam] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [editingMember, setEditingMember] = useState(null);
  const [memberForm, setMemberForm] = useState({ name: '', role: '', bio: '', email: '', photo: '', photoFile: null });
  const [memberUploading, setMemberUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');
  const [uploading, setUploading] = useState(false);
  const [modelUploading, setModelUploading] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [settings, setSettings] = useState({ logo: '', tagline: '', about: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoProgress, setLogoProgress] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Project form state
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    summary: '',
    youtube: '',
    modelDetails: '',
    projectDetails: '',
    impact: '',
    tags: [],
    modelFile: null,
    dataFile: null,
    pdfFile: null,
    docFile: null
  });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Persist edit mode explicitly (local + Firestore)
  const saveEditMode = async () => {
    try {
      // Save locally first for instant effect
      localStorage.setItem('editMode', editMode);

      // If the current user is authenticated and is a team member, persist to Firestore
      const user = auth?.currentUser;
      if (user) {
        try {
          const teamDoc = await getDoc(firestoreDoc(db, 'teamMembers', user.uid));
          if (teamDoc.exists()) {
            await setDoc(firestoreDoc(db, 'settings', 'site'), { editMode }, { merge: true });
            showMessage('success', 'Edit mode saved locally and to cloud.');
            return;
          }
        } catch (e) {
          // If permission denied or other error, fall through to local-only save
          console.warn('Cloud save check failed:', e.message || e);
        }
      }

      // If we reach here, only local save happened
      showMessage('success', 'Edit mode saved locally. Sign in as a team member to save to cloud.');
    } catch (e) {
      // Generic error handling
      if (String(e).toLowerCase().includes('permission') || e.code === 'permission-denied') {
        showMessage('error', 'Could not save to cloud: insufficient permissions. Saved locally.');
      } else {
        showMessage('error', `Could not save edit mode: ${e.message || e}`);
      }
    }
  };

  // File validation constants
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = {
    models: ['.glb', '.gltf'],
    datasets: ['.csv', '.json', '.xlsx'],
    papers: ['.pdf'],
    documents: ['.doc', '.docx', '.txt'],
    images: ['.jpg', '.jpeg', '.png', '.webp']
  };

  // Validate file before upload
  const validateFile = (file, type) => {
    if (!file) throw new Error('No file selected');
    
    // Size check
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }
    
    // Type check
    if (ALLOWED_TYPES[type]) {
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_TYPES[type].includes(fileExt)) {
        throw new Error(`Invalid file type. Allowed: ${ALLOWED_TYPES[type].join(', ')}`);
      }
    }
    
    return true;
  };

  // Enhanced file upload with comprehensive error handling
  const handleFileUpload = async (file, path, onProgress = null) => {
    try {
      // Validate file first
      validateFile(file, path);
      
      // Sanitize filename
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageRef = ref(storage, `${path}/${Date.now()}_${sanitizedName}`);
      
      // Use resumable upload with progress
      if (onProgress) {
        return new Promise((resolve, reject) => {
          const uploadTask = uploadBytesResumable(storageRef, file);
          
          // Set timeout for stuck uploads
          const timeout = setTimeout(() => {
            uploadTask.cancel();
            reject(new Error('Upload timeout after 5 minutes'));
          }, 5 * 60 * 1000); // 5 minutes
          
          uploadTask.on('state_changed',
            (snapshot) => {
              try {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                onProgress(progress);
                console.log(`Upload ${progress}% complete for ${file.name}`);
              } catch (err) {
                console.error('Progress update error:', err);
              }
            },
            (error) => {
              clearTimeout(timeout);
              console.error('Upload error:', error);
              
              // Handle specific Firebase errors
              let message = 'Upload failed';
              switch (error.code) {
                case 'storage/unauthorized':
                  message = 'Permission denied. Please check authentication.';
                  break;
                case 'storage/canceled':
                  message = 'Upload was cancelled';
                  break;
                case 'storage/quota-exceeded':
                  message = 'Storage quota exceeded';
                  break;
                case 'storage/retry-limit-exceeded':
                  message = 'Upload failed after multiple retries';
                  break;
                default:
                  message = error.message || 'Upload failed unexpectedly';
              }
              
              reject(new Error(message));
            },
            async () => {
              try {
                clearTimeout(timeout);
                const url = await getDownloadURL(storageRef);
                console.log('Upload successful:', file.name, 'URL:', url);
                resolve(url);
              } catch (err) {
                console.error('Error getting download URL:', err);
                reject(new Error('Upload completed but failed to get download URL'));
              }
            }
          );
        });
      } else {
        // Simple upload without progress
        console.log('Starting simple upload:', file.name);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        console.log('Simple upload successful:', file.name);
        return url;
      }
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    
    // Reset all upload states
    setUploading(true);
    setModelUploading(false);
    setModelProgress(0);
    
    // Clear any previous messages
    setMessage({ type: '', text: '' });

    try {
      console.log('Starting project submission...');
      
      // Validate required fields
      if (!projectForm.title.trim()) {
        throw new Error('Project title is required');
      }
      if (!projectForm.description.trim()) {
        throw new Error('Project description is required');
      }

      const uploadResults = {};
      
      // Model file upload with progress
      if (projectForm.modelFile) {
        try {
          console.log('Uploading model file:', projectForm.modelFile.name);
          setModelUploading(true);
          uploadResults.modelUrl = await handleFileUpload(
            projectForm.modelFile,
            'models',
            (progress) => {
              setModelProgress(progress);
              console.log(`Model upload progress: ${progress}%`);
            }
          );
          setModelUploading(false);
          setModelProgress(100);
          console.log('Model upload complete');
        } catch (error) {
          setModelUploading(false);
          throw new Error(`Model upload failed: ${error.message}`);
        }
      }

      // Upload other files in parallel with individual error handling
      const otherUploads = [];
      
      if (projectForm.dataFile) {
        otherUploads.push(
          handleFileUpload(projectForm.dataFile, 'datasets')
            .then(url => ({ type: 'dataUrl', url }))
            .catch(err => ({ type: 'dataUrl', error: err.message }))
        );
      }
      
      if (projectForm.pdfFile) {
        otherUploads.push(
          handleFileUpload(projectForm.pdfFile, 'papers')
            .then(url => ({ type: 'pdfUrl', url }))
            .catch(err => ({ type: 'pdfUrl', error: err.message }))
        );
      }
      
      if (projectForm.docFile) {
        otherUploads.push(
          handleFileUpload(projectForm.docFile, 'documents')
            .then(url => ({ type: 'docUrl', url }))
            .catch(err => ({ type: 'docUrl', error: err.message }))
        );
      }

      // Wait for all other uploads to complete
      if (otherUploads.length > 0) {
        console.log(`Uploading ${otherUploads.length} additional files...`);
        const results = await Promise.allSettled(otherUploads.map(p => p));
        
        // Process results and collect errors
        const uploadErrors = [];
        for (const result of results) {
          if (result.status === 'fulfilled') {
            const { type, url, error } = result.value;
            if (error) {
              uploadErrors.push(`${type}: ${error}`);
            } else {
              uploadResults[type] = url;
            }
          } else {
            uploadErrors.push(`Upload failed: ${result.reason.message}`);
          }
        }
        
        // Show warnings for failed uploads but continue
        if (uploadErrors.length > 0) {
          console.warn('Some uploads failed:', uploadErrors);
          showMessage('error', `Some files failed to upload: ${uploadErrors.join(', ')}`);
        }
      }

      // Save to Firestore with successful uploads
      console.log('Saving project to Firestore...');
      const projectData = {
        title: projectForm.title.trim(),
        description: projectForm.description.trim(),
        summary: projectForm.summary.trim(),
        youtube: projectForm.youtube.trim(),
        modelDetails: projectForm.modelDetails.trim(),
        projectDetails: projectForm.projectDetails.trim(),
        impact: projectForm.impact.trim(),
        tags: projectForm.tags,
        ...uploadResults, // Spread the successful uploads
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'projects'), projectData);
      console.log('Project saved successfully with ID:', docRef.id);

      showMessage('success', `Project "${projectForm.title}" added successfully!`);
      
      // Reset form only on complete success
      setProjectForm({
        title: '',
        description: '',
        summary: '',
        youtube: '',
        modelDetails: '',
        projectDetails: '',
        impact: '',
        tags: [],
        modelFile: null,
        dataFile: null,
        pdfFile: null,
        docFile: null
      });
      setModelProgress(0);
      
      // Clear file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => input.value = '');

    } catch (error) {
      console.error('Project submission error:', error);
      
      // Show user-friendly error message
      let errorMessage = error.message;
      if (error.message.includes('permission-denied')) {
        errorMessage = 'Permission denied. Please ensure you are signed in and authorized.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      showMessage('error', errorMessage);
    } finally {
      // Always reset loading states
      setUploading(false);
      setModelUploading(false);
      console.log('Project submission completed');
    }
  };

  // Load team from Firestore
  useEffect(() => {
    const fetchTeam = async () => {
      setTeamLoading(true);
      try {
        const querySnapshot = await getDocs(firestoreCollection(db, 'team'));
        setTeam(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        setTeam([]);
      } finally {
        setTeamLoading(false);
      }
    };
    fetchTeam();
  }, []);

  const handleTagToggle = (tag) => {
    setProjectForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Edit Mode Toggle */}
        <div className="mb-6 flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={editMode} onChange={e => setEditMode(e.target.checked)} className="accent-orange-600 w-5 h-5" />
            <span className="text-orange-400 font-semibold">Edit Mode</span>
          </label>
          <button
            className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-md hover:bg-slate-700"
            onClick={saveEditMode}
          >
            Save Edit Mode
          </button>
          <span className="text-xs text-slate-500">Enable to edit content directly on the site.</span>
        </div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-slate-400">Manage your portfolio content</p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-900/20 border-green-800 text-green-400'
              : 'bg-red-900/20 border-red-800 text-red-400'
          }`}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['projects', 'team', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab === 'projects' && <Box className="w-4 h-4 inline mr-2" />}
              {tab === 'team' && <Image className="w-4 h-4 inline mr-2" />}
              {tab === 'settings' && <FileText className="w-4 h-4 inline mr-2" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="bg-slate-900 border border-orange-800/30 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="w-6 h-6 text-orange-400" />
              Add New Project
            </h2>

            <form onSubmit={handleProjectSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Mars Terrain Analysis"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Detailed description of your project..."
                  required
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Tags *
                </label>
                <div className="flex flex-wrap gap-2">
                  {['3D', 'dataset', 'research', 'demo'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        projectForm.tags.includes(tag)
                          ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* File Uploads */}
              <div className="grid md:grid-cols-4 gap-4">
                {/* Word/Notepad/Other Docs */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Document (.doc, .docx, .txt, .rtf, .odt)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".doc,.docx,.txt,.rtf,.odt"
                      onChange={(e) => setProjectForm({ ...projectForm, docFile: e.target.files[0] })}
                      className="hidden"
                      id="doc-upload"
                    />
                    <label
                      htmlFor="doc-upload"
                      className="flex flex-col items-center justify-center w-full h-32 bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors"
                    >
                      <FileText className="w-8 h-8 text-green-400 mb-2" />
                      <span className="text-sm text-slate-400">
                        {projectForm.docFile ? projectForm.docFile.name : 'Choose file'}
                      </span>
                    </label>
                  </div>
                </div>
                {/* 3D Model */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    3D Model (.glb/.gltf) - Max 50MB
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".glb,.gltf"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          try {
                            validateFile(file, 'models');
                            setProjectForm({ ...projectForm, modelFile: file });
                          } catch (error) {
                            showMessage('error', error.message);
                            e.target.value = ''; // Clear invalid file
                          }
                        } else {
                          setProjectForm({ ...projectForm, modelFile: null });
                        }
                      }}
                      className="hidden"
                      id="model-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="model-upload"
                      className={`flex flex-col items-center justify-center w-full h-32 bg-slate-800 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        uploading 
                          ? 'border-slate-600 cursor-not-allowed bg-slate-700' 
                          : 'border-slate-700 hover:bg-slate-750 hover:border-orange-600'
                      } ${projectForm.modelFile ? 'border-orange-500 bg-orange-900/20' : ''}`}
                    >
                      <Box className={`w-8 h-8 mb-2 ${projectForm.modelFile ? 'text-orange-400' : 'text-slate-400'}`} />
                      <span className={`text-sm ${projectForm.modelFile ? 'text-orange-300' : 'text-slate-400'}`}>
                        {projectForm.modelFile ? (
                          <div className="text-center">
                            <div className="font-medium">{projectForm.modelFile.name}</div>
                            <div className="text-xs opacity-75">
                              {(projectForm.modelFile.size / (1024 * 1024)).toFixed(1)}MB
                            </div>
                          </div>
                        ) : (
                          'Choose 3D model file (.glb/.gltf)'
                        )}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Dataset */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Dataset (.csv/.json/.xlsx) - Max 50MB
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv,.json,.xlsx"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          try {
                            validateFile(file, 'datasets');
                            setProjectForm({ ...projectForm, dataFile: file });
                          } catch (error) {
                            showMessage('error', error.message);
                            e.target.value = '';
                          }
                        } else {
                          setProjectForm({ ...projectForm, dataFile: null });
                        }
                      }}
                      className="hidden"
                      id="data-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="data-upload"
                      className={`flex flex-col items-center justify-center w-full h-32 bg-slate-800 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        uploading 
                          ? 'border-slate-600 cursor-not-allowed bg-slate-700' 
                          : 'border-slate-700 hover:bg-slate-750 hover:border-blue-600'
                      } ${projectForm.dataFile ? 'border-blue-500 bg-blue-900/20' : ''}`}
                    >
                      <Database className={`w-8 h-8 mb-2 ${projectForm.dataFile ? 'text-blue-400' : 'text-slate-400'}`} />
                      <span className={`text-sm ${projectForm.dataFile ? 'text-blue-300' : 'text-slate-400'}`}>
                        {projectForm.dataFile ? (
                          <div className="text-center">
                            <div className="font-medium">{projectForm.dataFile.name}</div>
                            <div className="text-xs opacity-75">
                              {(projectForm.dataFile.size / (1024 * 1024)).toFixed(1)}MB
                            </div>
                          </div>
                        ) : (
                          'Choose dataset file'
                        )}
                      </span>
                    </label>
                  </div>
                </div>

                {/* PDF */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Research Paper (.pdf) - Max 50MB
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          try {
                            validateFile(file, 'papers');
                            setProjectForm({ ...projectForm, pdfFile: file });
                          } catch (error) {
                            showMessage('error', error.message);
                            e.target.value = '';
                          }
                        } else {
                          setProjectForm({ ...projectForm, pdfFile: null });
                        }
                      }}
                      className="hidden"
                      id="pdf-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="pdf-upload"
                      className={`flex flex-col items-center justify-center w-full h-32 bg-slate-800 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        uploading 
                          ? 'border-slate-600 cursor-not-allowed bg-slate-700' 
                          : 'border-slate-700 hover:bg-slate-750 hover:border-red-600'
                      } ${projectForm.pdfFile ? 'border-red-500 bg-red-900/20' : ''}`}
                    >
                      <FileText className={`w-8 h-8 mb-2 ${projectForm.pdfFile ? 'text-red-400' : 'text-slate-400'}`} />
                      <span className={`text-sm ${projectForm.pdfFile ? 'text-red-300' : 'text-slate-400'}`}>
                        {projectForm.pdfFile ? (
                          <div className="text-center">
                            <div className="font-medium">{projectForm.pdfFile.name}</div>
                            <div className="text-xs opacity-75">
                              {(projectForm.pdfFile.size / (1024 * 1024)).toFixed(1)}MB
                            </div>
                          </div>
                        ) : (
                          'Choose PDF file'
                        )}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Upload Status & Progress */}
              <div className="space-y-4">
                {/* Upload Status Message */}
                <div 
                  role="status" 
                  aria-live="polite" 
                  aria-atomic="true"
                  className="min-h-[24px]"
                >
                  {uploading && !modelUploading && (
                    <div className="flex items-center gap-2 text-blue-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                      <span>Processing files...</span>
                    </div>
                  )}
                  {modelUploading && (
                    <div className="flex items-center gap-2 text-orange-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-400 border-t-transparent"></div>
                      <span>Uploading 3D model... {modelProgress}%</span>
                    </div>
                  )}
                </div>

                {/* Model Upload Progress Bar */}
                {modelUploading && (
                  <div className="w-full bg-slate-800 rounded-lg h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-lg transition-all duration-300 ease-out"
                      style={{ width: `${modelProgress}%` }}
                      role="progressbar"
                      aria-valuenow={modelProgress}
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-label={`Model upload progress: ${modelProgress}%`}
                    ></div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={uploading}
                  aria-describedby="upload-status"
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>
                        {modelUploading ? 'Uploading Model...' : 'Processing...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Project
                    </>
                  )}
                </button>

                {/* File Size Limits Info */}
                <div className="text-xs text-slate-500 text-center">
                  <p>Maximum file size: 50MB per file</p>
                  <p>Supported formats: .glb/.gltf (3D), .csv/.json (data), .pdf (papers)</p>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="bg-slate-900 border border-orange-800/30 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Image className="w-6 h-6 text-orange-400" />
              Upload Team Photos
            </h2>
            <div className="text-center py-12">
              <Upload className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">Team photo upload coming soon</p>
              <p className="text-sm text-slate-500">Upload individual photos or update team member info</p>
              {editMode && (
                <button
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-lg shadow-lg hover:from-orange-500 hover:to-red-500"
                  onClick={() => showMessage('success', 'Team changes would be saved here! (Implement logic)')}
                >
                  <Save className="w-5 h-5 inline mr-2" />
                  Save Team Changes
                </button>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-slate-900 border border-orange-800/30 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-orange-400" />
              Site Settings
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Site Logo
                </label>
                <input
                  type="file"
                  accept="image/*,.svg"
                  onChange={e => setLogoFile(e.target.files[0])}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-600 file:text-white hover:file:bg-orange-500"
                  disabled={!editMode}
                />
                {logoUploading && (
                  <div className="mt-2 text-orange-400 text-sm">Uploading: {logoProgress}%</div>
                )}
                {settings.logo && (
                  <img src={settings.logo} alt="Site Logo" className="mt-4 h-16" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tagline
                </label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={e => setSettings(s => ({ ...s, tagline: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Innovating Space Exploration..."
                  disabled={!editMode}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  About Team Trashinova
                </label>
                <textarea
                  value={settings.about}
                  onChange={e => setSettings(s => ({ ...s, about: e.target.value }))}
                  rows={8}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[120px]"
                  placeholder="Write or edit the About Team Trashinova section here..."
                  style={{ resize: 'vertical' }}
                  disabled={!editMode}
                />
                <div className="text-xs text-slate-500 mt-1">You can write or edit the About Team Trashinova section here. Changes will be saved and shown on the public site.</div>
              </div>
              <button
                className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-semibold rounded-lg transition-all shadow-lg"
                onClick={async (e) => {
                  e.preventDefault();
                  setLogoUploading(true);
                  let logoUrl = settings.logo;
                  if (logoFile) {
                    const storageRef = ref(storage, `assets/logo_${Date.now()}_${logoFile.name}`);
                    const uploadTask = uploadBytesResumable(storageRef, logoFile);
                    uploadTask.on('state_changed', (snapshot) => {
                      const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                      setLogoProgress(progress);
                    }, (error) => {
                      showMessage('error', `Upload failed: ${error.message}`);
                      setLogoUploading(false);
                    });
                    await uploadTask;
                    logoUrl = await getDownloadURL(storageRef);
                  }
                  await setDoc(firestoreDoc(db, 'settings', 'site'), {
                    logo: logoUrl,
                    tagline: settings.tagline,
                    about: settings.about
                  }, { merge: true });
                  setSettings(s => ({ ...s, logo: logoUrl }));
                  setLogoUploading(false);
                  setLogoProgress(0);
                  showMessage('success', 'Settings saved!');
                }}
                disabled={logoUploading}
              >
                <Save className="w-5 h-5 inline mr-2" />
                {logoUploading ? `Uploading: ${logoProgress}%` : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;