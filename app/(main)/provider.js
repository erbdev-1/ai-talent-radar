"use client"
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import React, { useEffect } from 'react'
import { AppSidebar } from './_components/AppSidebar'
import WelcomeContainer from './dashboard/_components/WelcomeContainer'
import { useUser } from '../provider'
import { useRouter } from 'next/navigation'
import { supabase } from '@/services/supabaseClient'


function DashboardProvider({ children }) {
    const { user, setUser } = useUser();
    const router = useRouter();
    useEffect(() => {
        CreateNewUser();
    }, [])

    const CreateNewUser = () => {

        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) {
                router.replace('/auth')
            }
            //Check if user already exist
            let { data: Users, error } = await supabase
                .from('Users')
                .select("*")
                .eq('email', user?.email);

            console.log(Users)
            // If not then create new user 
            if (Users?.length == 0) {
                const { data, error } = await supabase.from("Users")
                    .insert([
                        {
                            name: user?.user_metadata?.name,
                            email: user?.email,
                            picture: user?.user_metadata?.picture
                        }
                    ])
                console.log(data);
                setUser(data);
                return;
            }

            setUser(Users[0]);
        })


    }
    return (
        <SidebarProvider>
            <AppSidebar />
            <div className='w-full p-10'>
                {/* <SidebarTrigger /> */}
                <WelcomeContainer />
                {children}
            </div>
        </SidebarProvider>
    )
}

export default DashboardProvider