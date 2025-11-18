// Drag and drop file upload functionality
document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.querySelector('.file-upload-area');
    
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('drag-over');
    });
    
    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('drag-over');
    });
    
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        // Handle file upload logic here
    });
});