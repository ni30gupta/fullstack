import axiosInstance from './axiosInstance';
import { 
  GYM_ENDPOINTS, 
  USER_ENDPOINTS, 
  RUSH_ENDPOINTS, 
  SLOT_ENDPOINTS, 
  MEMBER_ENDPOINTS
} from './config';

export const gymService = {
  // Gym info
  getGymInfo: () => axiosInstance.get(GYM_ENDPOINTS.INFO),
  updateGymInfo: (data) => axiosInstance.patch(GYM_ENDPOINTS.UPDATE_INFO, data),
  getDashboardStats: () => axiosInstance.get(GYM_ENDPOINTS.DASHBOARD_STATS),
  
  // User profile
  getProfile: () => axiosInstance.get(USER_ENDPOINTS.PROFILE),
  updateProfile: (data) => axiosInstance.patch(USER_ENDPOINTS.UPDATE_PROFILE, data),
  
  // Rush/Load data
  // optionally pass slot as third parameter; backend will filter if provided
  getCurrentRush: (gym_id, dateStr, slot = 'current') => {
    const url = RUSH_ENDPOINTS.CURRENT(gym_id, dateStr);
    const params = slot ? { slot } : {};
    return axiosInstance.get(url, { params });
  },
  getSlotRush: (slotId) => axiosInstance.get(RUSH_ENDPOINTS.BY_SLOT(slotId)),
  getBodyPartLoad: (slotId = null) => {
    const params = slotId ? { slot: slotId } : {};
    return axiosInstance.get(RUSH_ENDPOINTS.BODYPART_LOAD, { params });
  },
  
  // Slots
  getAvailableSlots: () => axiosInstance.get(SLOT_ENDPOINTS.LIST),
  getSlotDetail: (slotId) => axiosInstance.get(SLOT_ENDPOINTS.DETAIL(slotId)),

  getMembersList: (gym_id) => axiosInstance.get(MEMBER_ENDPOINTS.LIST(gym_id)),
  updateMember: (gymId, memberId, data) => axiosInstance.patch(MEMBER_ENDPOINTS.DETAIL(gymId, memberId), data),
};

export default gymService;
