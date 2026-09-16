export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'agent' | 'customer';
  phone?: string;
  avatar?: string;
  notificationPreferences: {
    email: boolean;
    assignment: boolean;
    slaBreach: boolean;
    feedback: boolean;
  };
  createdAt: string;
}

export interface Complaint {
  _id: string;
  complaintId: string;
  customerName: string;
  contactInformation: string;
  category: string;
  subject: string;
  description: string;
  channel: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Escalated' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo?: User;
  customerId?: string | User;
  slaDeadline: string;
  resolvedAt?: string;
  closedAt?: string;
  escalatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  _id: string;
  complaintId: string;
  userId?: User;
  type: string;
  message: string;
  createdAt: string;
}

export interface Feedback {
  _id: string;
  complaintId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  message: string;
  type: string;
  read: boolean;
  complaintId?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}

export interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
}

export interface TrendData {
  date: string;
  count: number;
}

export interface ChannelData {
  channel: string;
  count: number;
}
