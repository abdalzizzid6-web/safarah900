import axios from 'axios';

// General client for local backend API calls (NOT proxied to football API)
const sysClient = axios.create({
  baseURL: '', // API calls will be absolute, like /api/...
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// Add auth token if required - for now, assuming caller handles token injection or using standard auth flow
// This client is strictly for local system APIs.

export default sysClient;
