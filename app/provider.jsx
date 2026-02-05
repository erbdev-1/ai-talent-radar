"use client"
import { UserDetailContext } from '@/context/UserDetailContext';
import { supabase } from '@/services/supabaseClient'
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import React, { useContext, useEffect, useState } from 'react'

function Provider({ children }) {

    const [user, setUser] = useState();

    return (
        <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID }}>
            <UserDetailContext.Provider value={{ user, setUser }}>
                <div>{children}</div>
            </UserDetailContext.Provider>
        </PayPalScriptProvider>
    )
}

export default Provider

export const useUser = () => {
    const context = useContext(UserDetailContext);
    return context;
}