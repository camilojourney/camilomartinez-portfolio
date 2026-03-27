import { ImageResponse } from 'next/og'

export function GET(request: Request) {
  const url = new URL(request.url)
  const title = url.searchParams.get('title') || 'Camilo Martinez — AI Engineer'

  return new ImageResponse(
    (
      <div
        tw="flex flex-col w-full h-full justify-between p-16"
        style={{ backgroundColor: '#050810', color: '#ffffff' }}
      >
        <div tw="flex flex-col">
          <div
            tw="text-3xl font-bold mb-2"
            style={{ color: '#06b6d4' }}
          >
            Camilo Martinez
          </div>
          <div
            tw="text-6xl font-bold leading-tight mt-4"
            style={{ color: '#ffffff', maxWidth: '900px' }}
          >
            {title}
          </div>
        </div>
        <div tw="flex items-center justify-between w-full">
          <div tw="flex items-center">
            <div
              tw="text-xl"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              camilomartinez.co
            </div>
          </div>
          <div
            tw="text-lg"
            style={{ color: 'rgba(6,182,212,0.8)' }}
          >
            Applied AI Engineer · NYC
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
