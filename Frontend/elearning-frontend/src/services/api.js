import axios from 'axios';

// Use environment variable with fallback to EC2 IP
const API_URL = import.meta.env.VITE_API_URL || 'http://13.49.159.89:8080/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;