import api from './api';
import { gymStorage } from './storage';
import { ENDPOINTS, buildEndpoint } from '../constants/config';

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
      const response = await api.get(ENDPOINTS.GYM_INFO);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async searchGyms(query) {
    try {
      const params = { q: query };
      const response = await api.get(ENDPOINTS.GYM_SEARCH, { params });
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
      const response = await api.post(buildEndpoint(ENDPOINTS.GYM_CHECKIN, { id }), payload);
      console.log('resssssss',response)
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async checkOut(sessionId) {
    try {
      let url;
      if (sessionId) {
        url = buildEndpoint(ENDPOINTS.GYM_CHECKOUT, { id: sessionId });
      } else {
        url = ENDPOINTS.GYM_CHECKOUT_BASE || ENDPOINTS.GYM_CHECKOUT.replace('/:id', '/');
      }
      const response = await api.post(url);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async getWorkoutHistory(page = 1, limit = 20) {
    try {
      const response = await api.get(`${ENDPOINTS.GYM_SESSIONS}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async getMyWorkouts() {
    try {
      const response = await api.get(ENDPOINTS.GYMS_MY_WORKOUTS);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async getTrainers() {
    try {
      const response = await api.get(ENDPOINTS.GYM_TRAINERS);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async getMyActivity() {
    try {
      const response = await api.get(ENDPOINTS.GYMS_MY_ACTIVITY);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async getCurrentRush(gymId, dateStr, slot = 'current') {
    try {
      if (!gymId) {
        const info = await gymStorage.getGymInfo();
        gymId = info?.gym_id;
      }
      if (!gymId) {
        throw new Error('gym_id is required for getCurrentRush');
      }

      const params = { date: dateStr };
      if (slot) params.slot = slot;

      const response = await api.get(`/api/gyms/${encodeURIComponent(gymId)}/rush-data/`, { params });
      try {
        await gymStorage.saveCurrentRush({
          gym_id: gymId,
          date: dateStr,
          slot,
          data: response.data,
          fetched_at: new Date().toISOString(),
        });
      } catch (e) {
        // Ignore persistence failures and still return API data
      }
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async getActiveActivities(gymId, bodyPart = null, dateStr, slot = 'current') {
    try {
      if (!gymId) {
        const info = await gymStorage.getGymInfo();
        gymId = info?.gym_id;
      }
      if (!gymId) {
        throw new Error('gym_id is required for getActiveActivities');
      }

      const params = { date: dateStr, slot };
      if (bodyPart) params.body_part = bodyPart;

      const response = await api.get(`/api/gyms/${encodeURIComponent(gymId)}/active-activities/`, { params });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async getTrainerSlots(trainerId, date) {
    try {
      const response = await api.get(`${buildEndpoint(ENDPOINTS.TRAINER_SLOTS, { id: trainerId })}?date=${encodeURIComponent(date)}`);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async bookTrainerSlot(trainerId, slotId, notes) {
    try {
      const response = await api.post(ENDPOINTS.BOOKINGS, {
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
      const response = await api.get(ENDPOINTS.BOOKINGS);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async cancelBooking(bookingId) {
    try {
      await api.delete(buildEndpoint(ENDPOINTS.BOOKING_DELETE, { id: bookingId }));
    } catch (error) {
      throw handleError(error);
    }
  },
};

export default gymService;
