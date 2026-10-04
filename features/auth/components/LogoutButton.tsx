import React, { useState } from 'react'
import { LogoutButtonProps } from '../types';
import {useRouter} from 'next/navigation';
import {signOut} from 'next-auth/react';
import { Loader2 } from 'lucide-react';



const LogoutButton = ({children}: LogoutButtonProps) => {
    const router=useRouter();
    const [isLoading, setIsLoading] = useState(false);
    
    const handleLogout = async () => {
        try {
            setIsLoading(true);
            await signOut();
            router.refresh();
            setIsLoading(false);
    } catch (error) {
        console.error(error);
        setIsLoading(false);
    }
    }
    return (
        <span className='cursor-pointer' onClick={handleLogout}>
            {isLoading ? <Loader2 className='animate-spin' /> : children}
        </span>
    );
}

export default LogoutButton;