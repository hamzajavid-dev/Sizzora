export const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (typeof imagePath === 'string') {
        const trimmedPath = imagePath.trim();
        if (trimmedPath.startsWith('http') || trimmedPath.startsWith('data:')) return trimmedPath;
        
        // Handle common user inputs like "www.google.com/..."
        if (trimmedPath.startsWith('www.')) return `https://${trimmedPath}`;
        
        // If it's specifically in the uploads folder
        if (trimmedPath.includes('uploads/')) {
             const cleanPath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
             return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${cleanPath}`;
        }

        // If it looks like an external domain (contains dot and slash, but not starting with slash)
        // e.g. "imgur.com/image.png"
        if (trimmedPath.includes('.') && trimmedPath.includes('/') && !trimmedPath.startsWith('/')) {
             return `https://${trimmedPath}`;
        }

        // Default to backend path for everything else (local files, relative paths starting with /)
        const path = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${path}`;
    }
    
    if (imagePath instanceof File) return URL.createObjectURL(imagePath);
    
    return '';
};
