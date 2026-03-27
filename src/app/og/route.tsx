import { ImageResponse } from 'next/og'

export function GET(request: Request) {
  const url = new URL(request.url)
  const title = url.searchParams.get('title') || 'Applied AI Engineer'

  return new ImageResponse(
    (
      <div
        tw="flex flex-col w-full h-full justify-between p-16"
        style={{ backgroundColor: '#050810' }}
      >
        {/* Top accent line */}
        <div tw="flex w-full">
          <div
            tw="h-1 w-32 rounded-full"
            style={{
              background: 'linear-gradient(to right, #06b6d4, #3b82f6)',
            }}
          />
        </div>

        {/* Main content */}
        <div tw="flex flex-col">
          <div tw="flex text-2xl font-bold tracking-widest text-gray-500 mb-4" style={{ letterSpacing: '0.2em' }}>
            CAMILO MARTINEZ
          </div>
          <div
            tw="flex text-6xl font-bold leading-tight"
            style={{ color: '#f1f5f9' }}
          >
            {title}
          </div>
        </div>

        {/* Bottom info */}
        <div tw="flex items-center justify-between w-full">
          <div tw="flex items-center gap-4">
            <div tw="flex text-lg" style={{ color: '#94a3b8' }}>
              Audio/Speech ML  |  Multi-Agent Systems  |  NYC
            </div>
          </div>
          <div tw="flex text-lg" style={{ color: '#06b6d4' }}>
            camilomartinez.com
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
