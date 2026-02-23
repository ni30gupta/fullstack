import api from './api';
import { gymStorage } from './storage';

const handleError = (error) => {
  if (error.response) {
    const { data, status } = error.response;
    const message = data?.message || data?.detail || data?.error || 'An error occurred';

    switch (status) {
      case 400:
        return new Error(message || 'Invalid request');
      case 401:
        return new Error('Please login to continue');
      case 403:
        return new Error('Access denied');
      case 404:
        return new Error('Resource not found');
      case 500:
        return new Error('Server error. Please try again later.');
      default:
        return new Error(message);
    }
  }

  if (error.request) {
    return new Error('Network error. Please check your connection.');
  }

  return new Error(error.message || 'An unexpected error occurred');
};

export const gymService = {
  async getGymInfo() {
    try {
      const response = await api.get('/api/gym/info/');
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async checkIn(gymId = null, bodyParts = []) {
    try {
      let id = gymId;
      if (!id) {
        const stored = await gymStorage.getGymInfo();
        id = stored?.gym_id ?? null;
      }

      if (!id) {
        throw new Error('No active gym selected');
      }

      const payload = bodyParts && bodyParts.length ? { body_parts: bodyParts } : {};
      const response = await api.post(`/api/gyms/${id}/checkin/`, payload);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async checkOut(sessionId) {
    try {
      const response = await api.post(`/api/gym/check-out/${sessionId}/`);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async getWorkoutHistory(page = 1, limit = 20) {
    try {
      const response = await api.get(`/api/gym/sessions/?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async getTrainers() {
    try {
      const response = await api.get('/api/gym/trainers/');
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async getMyActivity() {
    try {
      const response = await api.get('/api/gyms/my-activity/');
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async getTrainerSlots(trainerId, date) {
    try {
      const response = await api.get(`/api/gym/trainers/${trainerId}/slots/?date=${date}`);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async bookTrainerSlot(trainerId, slotId, notes) {
    try {
      const response = await api.post('/api/gym/bookings/', {
        trainer_id: trainerId,
        slot_id: slotId,
        notes,
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async getMyBookings() {
    try {
      const response = await api.get('/api/gym/bookings/');
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async cancelBooking(bookingId) {
    try {
      await api.delete(`/api/gym/bookings/${bookingId}/`);
    } catch (error) {
      throw handleError(error);
    }
  },
};

export default gymService;
