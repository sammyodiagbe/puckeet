'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  // Ensure user record exists in database
  if (authData.user) {
    try {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single()

      // Create user record if it doesn't exist
      if (!existingUser) {
        const { error: dbError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            subscription_tier: 'free',
            settings: {},
          })

        if (dbError && dbError.code !== '23505') {
          console.error('Failed to create user record:', dbError)
        }
      }
    } catch (err) {
      console.error('Error ensuring user exists:', err)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
