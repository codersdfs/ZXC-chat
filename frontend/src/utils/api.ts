import axios from 'axios';

declare const __API_URL__: string;

const API_BASE_URL = (typeof __API_URL__ !== 'undefined' && __API_URL__) || 'http://localhost:3001/api';

axios.defaults.baseURL = API_BASE_URL;

export default axios;