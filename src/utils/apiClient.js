const apiClient = async (url, options = {}) => {
    const token = localStorage.getItem('accessToken');

    const headers = {
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Ensure JSON content type if body is present and not FormData
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });
    
    console.log(response);
    
    return response;
};

export default apiClient;
