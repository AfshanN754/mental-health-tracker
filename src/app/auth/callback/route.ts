// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(`${origin}/login?error=auth_failed`)
      }

      // If we have a user from the session exchange
      if (data?.user) {
        const userId = data.user.id
        const userEmail = data.user.email

        // Check if user exists in our users table
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('id, login_count, is_onboarded, last_login_at')
          .eq('id', userId)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('Error fetching user:', fetchError)
        }

        const now = new Date().toISOString()
        const userAgent = request.headers.get('user-agent') || ''
        const ipAddress = request.headers.get('x-forwarded-for') || 
                         request.headers.get('x-real-ip') || 
                         'unknown'

        if (!existingUser) {
          // First time user - create user record
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: userId,
              email: userEmail,
              name: userEmail?.split('@')[0].split('.').map(part => 
                part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
              ).join(' '),
              created_at: now,
              first_login_at: now,
              last_login_at: now,
              login_count: 1,
              is_onboarded: false,
              timezone: 'UTC' // You can detect this on frontend later
            })

          if (insertError) {
            console.error('Error creating user record:', insertError)
          }

          // Log the session
          await supabase
            .from('user_sessions')
            .insert({
              user_id: userId,
              login_at: now,
              ip_address: ipAddress,
              user_agent: userAgent
            })

          console.log('New user created:', userId)
        } else {
          // Existing user - update login tracking
          const { error: updateError } = await supabase
            .from('users')
            .update({
              last_login_at: now,
              login_count: (existingUser.login_count || 0) + 1
            })
            .eq('id', userId)

          if (updateError) {
            console.error('Error updating user login:', updateError)
          }

          // Log the session
          await supabase
            .from('user_sessions')
            .insert({
              user_id: userId,
              login_at: now,
              ip_address: ipAddress,
              user_agent: userAgent
            })

          console.log('Existing user logged in:', userId)
        }
      }
    } catch (error) {
      console.error('Unexpected error during auth callback:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }
  }

  // Redirect to homepage after successful authentication
  return NextResponse.redirect(`${origin}/`)
}