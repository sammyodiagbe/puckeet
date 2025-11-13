'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const fullName = `${firstName} ${lastName}`.trim()

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        name: fullName,
      }
    }
  })

  if (error) {
    return { error: error.message }
  }

  // Create user record in database if signup was successful
  if (authData.user) {
    try {
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          name: fullName,
          subscription_tier: 'free',
          settings: {},
        })

      // Ignore duplicate key errors (user already exists)
      if (dbError && dbError.code !== '23505') {
        console.error('Failed to create user record:', dbError)
      }
    } catch (err) {
      console.error('Error creating user record:', err)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
