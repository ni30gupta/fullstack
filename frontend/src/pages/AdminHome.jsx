import React from 'react';
import { Layout } from '../components/layout';
import { SlotSelector, BodyPartCard, LoadingSpinner, StatCard } from '../components/ui';
import { useGymInfo, useProfile, useBodyPartLoad, useSidebar } from '../hooks';
import GymRush from '../components/ui/GymRush';

const AdminHome = () => {
  // Custom hooks for data
  // const { gymInfo, loading: gymLoading } = useGymInfo();
  // const { profile, loading: profileLoading } = useProfile();
  // const { 
  //   bodyPartLoad, 
  //   slots, 
  //   selectedSlot, 
  //   loading: loadLoading, 
  //   changeSlot 
  // } = useBodyPartLoad();
  // const { isOpen, activeMenu, toggle, selectMenu, close } = useSidebar();


  return (

      <GymRush/>
      
  );
};

export default AdminHome;
