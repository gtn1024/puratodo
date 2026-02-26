import { type NextRequest, NextResponse } from 'next/server'
import { parseTaskInput, type ParsedTask } from '@/lib/nlp-parser'
import { createClient } from '@/lib/supabase/server'

export interface ParseTaskResponse {
  success: boolean
  data?: ParsedTask
  error?: string
}

/**
 * POST /api/v1/parse-task
 *
 * Parse natural language task input and extract structured fields.
 *
 * Request body:
 * - input: string - The free-text task input to parse
 *
 * Response:
 * - success: boolean
 * - data: ParsedTask object with title, due_date, plan_date, duration_minutes, starred, subtasks, confidence, detectedHints
 * - error: string (if failed)
 */
export async function POST(request: NextRequest): Promise<NextResponse<ParseTaskResponse>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { input } = body

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Input string is required' },
        { status: 400 },
      )
    }

    const result = parseTaskInput(input)

    // Log telemetry for parse quality improvements (optional future enhancement)
    // This could be stored in a separate table for analysis
    // await logParseTelemetry(user.id, input, result)

    return NextResponse.json({
      success: true,
      data: result,
    })
  }
  catch (error) {
    console.error('Error parsing task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to parse task' },
      { status: 500 },
    )
  }
}
