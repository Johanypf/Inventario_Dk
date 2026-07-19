export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const adminPin = process.env.NEXT_PUBLIC_ADMIN_PIN

  return Response.json({
    supabaseUrl: supabaseUrl ? `${supabaseUrl.slice(0, 20)}...` : 'NO SET',
    supabaseKey: supabaseKey ? `${supabaseKey.slice(0, 20)}...` : 'NO SET',
    adminPin: adminPin ? adminPin : 'NO SET (default: admin123)',
    nodeEnv: process.env.NODE_ENV,
  })
}
