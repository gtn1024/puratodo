import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Test connection by checking if we can query
    const { data, error } = await supabase.from('groups').select('count')

    if (error) {
      // If table doesn't exist yet, that's okay - connection works
      if (error.code === '42P01') {
        return NextResponse.json({
          status: 'connected',
          message: 'Supabase connection successful! Tables not created yet.',
          hint: 'Run the schema.sql in Supabase SQL Editor',
        })
      }
      return NextResponse.json({
        status: 'error',
        message: error.message,
        code: error.code,
        details: error.details,
      })
    }

    return NextResponse.json({
      status: 'connected',
      message: 'Supabase connection successful!',
      data,
    })
  }
  catch (error) {
    console.error('Supabase test error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
