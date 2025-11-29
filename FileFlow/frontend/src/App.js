import React, { useState, useEffect } from 'react';
import './App.css';
import Toolbar from './components/Toolbar';
import Breadcrumb from './components/Breadcrumb';
import FileList from './components/FileList';
import StatusBar from './components/StatusBar';
import SearchPanel from './components/SearchPanel';
import PreviewPanel from './components/PreviewPanel';
import ContextMenu from './components/ContextMenu';
import { ThemeProvider } from './context/ThemeContext';
import { FileProvider } from './context/FileContext';

function App() {
  const [viewMode, setViewMode] = useState('list'); // list, grid, details
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showPreview, setShowPreview] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + A: Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        // selectAll();
      }
      // Ctrl/Cmd + C: Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        // copyFiles();
      }
      // Ctrl/Cmd + X: Cut
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        // cutFiles();
      }
      // Ctrl/Cmd + V: Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        // pasteFiles();
      }
      // Delete: Delete selected files
      if (e.key === 'Delete') {
        e.preventDefault();
        // deleteFiles();
      }
      // F2: Rename
      if (e.key === 'F2') {
        e.preventDefault();
        // renameFile();
      }
      // Escape: Clear selection
      if (e.key === 'Escape') {
        setSelectedFiles([]);
        setContextMenu(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFiles]);
  
  return (
    <ThemeProvider>
      <FileProvider>
        <div className="App">
          <header className="App-header">
            <h1>FileFlow</h1>
          </header>
          
          <Toolbar 
            viewMode={viewMode}
            setViewMode={setViewMode}
            selectedFiles={selectedFiles}
          />
          
          <SearchPanel />
          
          <main className="App-main">
            <div className="file-browser">
              <Breadcrumb />
              <FileList 
                viewMode={viewMode}
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
                onContextMenu={setContextMenu}
              />
            </div>
            
            {showPreview && (
              <PreviewPanel 
                selectedFile={selectedFiles[0]}
                onClose={() => setShowPreview(false)}
              />
            )}
          </main>
          
          <StatusBar 
            selectedCount={selectedFiles.length}
            totalFiles={0}
          />
          
          {contextMenu && (
            <ContextMenu 
              x={contextMenu.x}
              y={contextMenu.y}
              selectedFiles={selectedFiles}
              onClose={() => setContextMenu(null)}
            />
          )}
        </div>
      </FileProvider>
    </ThemeProvider>
  );
}

export default App;
