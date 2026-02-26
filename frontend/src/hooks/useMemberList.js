import { useEffect, useState } from "react"
import { useAuth } from '../context';
import { gymService } from '../api/gymService';


const useMemberList = (overrideGymId = null) => {
    const [members , setMembers ] = useState([])
    const { gymDetails, membership } = useAuth();
    const gymId = overrideGymId || gymDetails?.id || membership?.gym_id || null;

    useEffect(() => {
       fetchMembers()
    }, [])
    
    const fetchMembers = async () => {
        try {
            const response = await gymService.getMembersList(gymId);
            setMembers(response.data);
        } catch (err) {
            console.error('Failed to fetch members list:', err);
        }
    }

    return {
        members,
        refresh: fetchMembers,
    }
  
}

export default useMemberList