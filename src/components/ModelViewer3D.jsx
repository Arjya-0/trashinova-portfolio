import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, useGLTF, Stage, Grid } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { Download, Maximize2, RotateCcw, Camera } from 'lucide-react';
import * as THREE from 'three';

// Model component that loads and displays the 3D model
function Model({ url, onLoad }) {
  const modelRef = useRef();
  const [error, setError] = useState(null);

  try {
    // Check file extension to determine loader
    const fileExtension = url.split('.').pop().toLowerCase();
    
    if (fileExtension === 'glb' || fileExtension === 'gltf') {
      const { scene } = useGLTF(url);
      
      React.useEffect(() => {
        if (scene) {
          onLoad && onLoad();
        }
      }, [scene, onLoad]);

      return (
        <primitive 
          ref={modelRef}
          object={scene} 
          scale={1}
          position={[0, 0, 0]}
        />
      );
    } else if (fileExtension === 'obj') {
      const obj = useLoader(OBJLoader, url);
      
      React.useEffect(() => {
        if (obj) {
          // Add basic material to OBJ models
          obj.traverse((child) => {
            if (child.isMesh) {
              child.material = new THREE.MeshStandardMaterial({ 
                color: '#888888',
                metalness: 0.1,
                roughness: 0.7
              });
            }
          });
          onLoad && onLoad();
        }
      }, [obj, onLoad]);

      return (
        <primitive 
          ref={modelRef}
          object={obj} 
          scale={0.1}
          position={[0, 0, 0]}
        />
      );
    } else {
      throw new Error('Unsupported file format');
    }
  } catch (err) {
    React.useEffect(() => {
      setError(err.message);
    }, [err]);
    return null;
  }
}

// Fallback loading component
function LoadingSpinner() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#3b82f6" wireframe />
    </mesh>
  );
}

// Main 3D Viewer Component
const ModelViewer3D = ({ modelUrl, modelName = "Model", onDownload }) => {
  const canvasRef = useRef();
  const controlsRef = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGrid, setShowGrid] = useState(true);

  // Error boundary for model loading
  const handleModelError = (error) => {
    console.error('3D Model Error:', error);
    setError(`Failed to load 3D model: ${error.message || 'Unknown error'}`);
    setIsLoading(false);
  };

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleFullscreen = () => {
    if (canvasRef.current) {
      if (canvasRef.current.requestFullscreen) {
        canvasRef.current.requestFullscreen();
      }
    }
  };

  const handleScreenshot = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current.querySelector('canvas');
      if (canvas) {
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${modelName}-screenshot.png`;
          a.click();
          URL.revokeObjectURL(url);
        });
      }
    }
  };

  const handleModelLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  // Validate model URL
  React.useEffect(() => {
    if (!modelUrl) {
      setError('No model URL provided');
      setIsLoading(false);
      return;
    }
    
    const supportedFormats = ['glb', 'gltf', 'obj'];
    const fileExtension = modelUrl.split('.').pop().toLowerCase();
    
    if (!supportedFormats.includes(fileExtension)) {
      setError(`Unsupported file format: .${fileExtension}. Supported formats: ${supportedFormats.join(', ')}`);
      setIsLoading(false);
      return;
    }
    
    // Reset states when URL changes
    setIsLoading(true);
    setError(null);
  }, [modelUrl]);

  return (
    <div className="relative w-full h-96 md:h-[500px] bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 rounded-xl overflow-hidden shadow-2xl border border-orange-900/20">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-orange-400 font-semibold">Loading 3D Model...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-20">
          <div className="text-center px-4">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <p className="text-red-400 font-semibold mb-2">Failed to load model</p>
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* 3D Canvas */}
      <div ref={canvasRef} className="w-full h-full">
        {!error && (
          <Canvas
            shadows
            camera={{ position: [5, 5, 5], fov: 50 }}
            gl={{ preserveDrawingBuffer: true }}
            onError={handleModelError}
          >
            <Suspense fallback={<LoadingSpinner />}>
              {/* Lighting */}
              <ambientLight intensity={0.5} />
              <spotLight 
                position={[10, 10, 10]} 
                angle={0.15} 
                penumbra={1} 
                intensity={1}
                castShadow 
              />
              <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff8800" />
              <pointLight position={[10, 10, 10]} intensity={0.5} color="#4488ff" />

              {/* Grid Helper */}
              {showGrid && (
                <Grid
                  args={[10, 10]}
                  cellSize={0.5}
                  cellThickness={0.5}
                  cellColor="#ff8800"
                  sectionSize={1}
                  sectionThickness={1}
                  sectionColor="#ff4400"
                  fadeDistance={25}
                  fadeStrength={1}
                  followCamera={false}
                  infiniteGrid={true}
                />
              )}

              {/* Model */}
              {modelUrl && (
                <Stage environment="city" intensity={0.5}>
                  <Model url={modelUrl} onLoad={handleModelLoad} />
                </Stage>
              )}

              {/* Environment */}
              <Environment preset="sunset" />

              {/* Camera Controls */}
              <OrbitControls
                ref={controlsRef}
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={2}
                maxDistance={20}
                autoRotate={false}
                autoRotateSpeed={0.5}
              />
            </Suspense>
          </Canvas>
        )}
      </div>

      {/* Control Panel */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={handleReset}
          className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-orange-800/50 rounded-lg backdrop-blur-sm transition-all shadow-lg hover:shadow-orange-500/20"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4 text-orange-400" />
        </button>
        
        <button
          onClick={() => setShowGrid(!showGrid)}
          className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-orange-800/50 rounded-lg backdrop-blur-sm transition-all shadow-lg hover:shadow-orange-500/20"
          title="Toggle Grid"
        >
          <span className="text-orange-400 text-sm font-bold">#</span>
        </button>

        <button
          onClick={handleScreenshot}
          className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-orange-800/50 rounded-lg backdrop-blur-sm transition-all shadow-lg hover:shadow-orange-500/20"
          title="Take Screenshot"
        >
          <Camera className="w-4 h-4 text-orange-400" />
        </button>

        <button
          onClick={handleFullscreen}
          className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-orange-800/50 rounded-lg backdrop-blur-sm transition-all shadow-lg hover:shadow-orange-500/20"
          title="Fullscreen"
        >
          <Maximize2 className="w-4 h-4 text-orange-400" />
        </button>

        {onDownload && (
          <button
            onClick={onDownload}
            className="p-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-lg backdrop-blur-sm transition-all shadow-lg hover:shadow-orange-500/50"
            title="Download Model"
          >
            <Download className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Model Info */}
      <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-orange-800/50 rounded-lg px-4 py-2 shadow-lg">
        <p className="text-orange-400 text-sm font-semibold">{modelName}</p>
      </div>
    </div>
  );
};

export default ModelViewer3D;