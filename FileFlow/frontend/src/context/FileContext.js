import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const FileContext = createContext();

export const useFiles = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFiles must be used within FileProvider');
  }
  return context;
};

export const FileProvider = ({ children }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [clipboard, setClipboard] = useState({ files: [], operation: null }); // cut or copy
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const fetchFiles = async (folderId = null) => {
    setLoading(true);
    try {
      const url = folderId ? `/api/folder/${folderId}` : '/api/files';
      const response = await axios.get(url);
      setFiles(response.data);
      setCurrentFolderId(folderId);
      
      // Update history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(folderId);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      fetchFiles(history[newIndex]);
    }
  };
  
  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      fetchFiles(history[newIndex]);
    }
  };
  
  const uploadFile = async (file, folderId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folder_id', folderId);
    
    try {
      await axios.post('/api/upload', formData);
      fetchFiles(currentFolderId);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };
  
  const createFolder = async (name) => {
    try {
      await axios.post('/api/create_folder', {
        folder_name: name,
        parent_folder_id: currentFolderId
      });
      fetchFiles(currentFolderId);
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };
  
  const deleteFiles = async (fileIds) => {
    try {
      await Promise.all(fileIds.map(id => axios.delete(`/api/delete_file/${id}`)));
      fetchFiles(currentFolderId);
    } catch (error) {
      console.error('Error deleting files:', error);
    }
  };
  
  const renameFile = async (fileId, newName) => {
    try {
      await axios.post(`/api/rename_file/${fileId}`, { new_name: newName });
      fetchFiles(currentFolderId);
    } catch (error) {
      console.error('Error renaming file:', error);
    }
  };
  
  const moveFiles = async (fileIds, destinationFolderId) => {
    try {
      await Promise.all(fileIds.map(id => 
        axios.post(`/api/move_file/${id}`, { destination_folder_id: destinationFolderId })
      ));
      fetchFiles(currentFolderId);
    } catch (error) {
      console.error('Error moving files:', error);
    }
  };
  
  const copyToClipboard = (fileIds) => {
    setClipboard({ files: fileIds, operation: 'copy' });
  };
  
  const cutToClipboard = (fileIds) => {
    setClipboard({ files: fileIds, operation: 'cut' });
  };
  
  const pasteFromClipboard = async () => {
    if (clipboard.operation === 'move' || clipboard.operation === 'cut') {
      await moveFiles(clipboard.files, currentFolderId);
    }
    // TODO: Implement copy operation
    setClipboard({ files: [], operation: null });
  };
  
  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return (
    <FileContext.Provider value={{
      files,
      loading,
      currentFolderId,
      clipboard,
      history,
      historyIndex,
      fetchFiles,
      goBack,
      goForward,
      uploadFile,
      createFolder,
      deleteFiles,
      renameFile,
      moveFiles,
      copyToClipboard,
      cutToClipboard,
      pasteFromClipboard
    }}>
      {children}
    </FileContext.Provider>
  );
};
