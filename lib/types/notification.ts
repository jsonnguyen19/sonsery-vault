export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  read: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationDTO {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  userId: string;
}

export interface UpdateNotificationDTO {
  title?: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  read?: boolean;
}
