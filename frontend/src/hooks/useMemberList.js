import { useEffect, useState } from "react"
import { gymService } from '../api/gymService';


const useMemberList = (gym_id) => {
    const [members , setMembers ] = useState([])

    useEffect(() => {
       fetchMembers()
    }, [])
    
    const fetchMembers = async () => {
        try {
            const response = await gymService.getMembersList(gym_id); // Assuming gym_id is 1 for now
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