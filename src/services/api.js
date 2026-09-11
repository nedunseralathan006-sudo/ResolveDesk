async function apiRequest(method, url, body = null) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(new Error('Unauthorized'));
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || 'An unexpected error occurred.');
    }
    return data;
  } catch (error) {
    throw error;
  }
}

export const login = (identifier, password) => apiRequest('POST', '/api/auth/login', { identifier, password });
export const register = (data) => apiRequest('POST', '/api/auth/register', data);
export const getCurrentUser = () => apiRequest('GET', '/api/auth/me');
export const getCategories = () => apiRequest('GET', '/api/categories');


export const getComplaints = (filters = {}) => {
  const query = new URLSearchParams(Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)).toString();
  const url = query ? `/api/complaints?${query}` : '/api/complaints';
  return apiRequest('GET', url);
};

export const getComplaint = (ticketId) => apiRequest('GET', `/api/complaints/${ticketId}`);
export const createComplaint = (data) => apiRequest('POST', '/api/complaints', data);
export const updateComplaintStatus = (ticketId, status, extra = {}) => apiRequest('PATCH', `/api/complaints/${ticketId}/status`, { status, ...extra });
export const assignComplaint = (ticketId, agentId) => apiRequest('POST', `/api/complaints/${ticketId}/assign`, { agent_id: agentId });
export const getAssignmentHistory = (ticketId) => apiRequest('GET', `/api/complaints/${ticketId}/assignment-history`);
export const escalateComplaint = (ticketId, reason) => apiRequest('POST', `/api/complaints/${ticketId}/escalate`, { reason });
export const submitFeedback = (ticketId, rating, comment) => apiRequest('POST', `/api/complaints/${ticketId}/feedback`, { rating, comment });

export const getDashboardStats = () => apiRequest('GET', '/api/dashboard/stats');
export const getUrgentTickets = () => apiRequest('GET', '/api/dashboard/urgent');
export const getAgents = () => apiRequest('GET', '/api/dashboard/agents');
export const getAllFeedback = () => apiRequest('GET', '/api/dashboard/feedback');
export const getReports = () => apiRequest('GET', '/api/dashboard/reports');
