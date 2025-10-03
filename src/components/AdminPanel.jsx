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

  // Handles file upload, with progress for model files
  const handleFileUpload = async (file, path, onProgress) => {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    // Use resumable upload for model files to show progress
    if (path === 'models' && onProgress) {
      return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            onProgress(progress);
          },
          (error) => reject(error),
          async () => {
            const url = await getDownloadURL(storageRef);
            resolve(url);
          }
        );
      });
    } else {
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    }
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setModelUploading(false);
    setModelProgress(0);

    try {
      // Model file upload with progress
      let modelUrl = null;
      if (projectForm.modelFile) {
        setModelUploading(true);
        modelUrl = await handleFileUpload(
          projectForm.modelFile,
          'models',
          (progress) => setModelProgress(progress)
        );
        setModelUploading(false);
        setModelProgress(100);
      }

      // Other files (no progress)
      const [dataUrl, pdfUrl, docUrl] = await Promise.all([
        projectForm.dataFile ? handleFileUpload(projectForm.dataFile, 'datasets') : null,
        projectForm.pdfFile ? handleFileUpload(projectForm.pdfFile, 'papers') : null,
        projectForm.docFile ? handleFileUpload(projectForm.docFile, 'documents') : null,
      ]);

      // Save to Firestore
      await addDoc(collection(db, 'projects'), {
        title: projectForm.title,
        description: projectForm.description,
        tags: projectForm.tags,
        modelUrl,
        dataUrl,
        pdfUrl,
        docUrl,
        createdAt: new Date().toISOString()
      });

      showMessage('success', 'Project added successfully!');
      // Reset form
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
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    } finally {
      setUploading(false);
      setModelUploading(false);
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
                    3D Model (.glb/.gltf)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".glb,.gltf"
                      onChange={(e) => setProjectForm({ ...projectForm, modelFile: e.target.files[0] })}
                      className="hidden"
                      id="model-upload"
                    />
                    <label
                      htmlFor="model-upload"
                      className="flex flex-col items-center justify-center w-full h-32 bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors"
                    >
                      <Box className="w-8 h-8 text-orange-400 mb-2" />
                      <span className="text-sm text-slate-400">
                        {projectForm.modelFile ? projectForm.modelFile.name : 'Choose file'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Dataset */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Dataset (.csv/.json)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv,.json"
                      onChange={(e) => setProjectForm({ ...projectForm, dataFile: e.target.files[0] })}
                      className="hidden"
                      id="data-upload"
                    />
                    <label
                      htmlFor="data-upload"
                      className="flex flex-col items-center justify-center w-full h-32 bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors"
                    >
                      <Database className="w-8 h-8 text-blue-400 mb-2" />
                      <span className="text-sm text-slate-400">
                        {projectForm.dataFile ? projectForm.dataFile.name : 'Choose file'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* PDF */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Research Paper (.pdf)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setProjectForm({ ...projectForm, pdfFile: e.target.files[0] })}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label
                      htmlFor="pdf-upload"
                      className="flex flex-col items-center justify-center w-full h-32 bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors"
                    >
                      <FileText className="w-8 h-8 text-red-400 mb-2" />
                      <span className="text-sm text-slate-400">
                        {projectForm.pdfFile ? projectForm.pdfFile.name : 'Choose file'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:from-slate-700 disabled:to-slate-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-orange-500/50"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Project
                  </>
                )}
              </button>
              {/* Model upload progress bar */}
              {modelUploading && (
                <div className="w-full bg-slate-800 rounded-lg h-3 mt-2">
                  <div
                    className="bg-orange-500 h-3 rounded-lg transition-all"
                    style={{ width: `${modelProgress}%` }}
                  ></div>
                  <div className="text-xs text-orange-300 mt-1">Model Upload: {modelProgress}%</div>
                </div>
              )}
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