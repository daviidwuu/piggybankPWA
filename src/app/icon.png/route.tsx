import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const alt = 'FinTrack Mini'
export const size = {
  width: 192,
  height: 192,
}

export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 100,
          background: '#1a1a1a', // A dark background matching the theme
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#4ade80', // A bright green color for the icon
          borderRadius: '24px'
        }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="128" 
          height="128" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M3 3v18h18"/>
          <path d="M18.7 8a6 6 0 0 0-6 0"/>
          <path d="M12.7 14a6 6 0 0 0-6 0"/>
          <path d="M6.7 20a6 6 0 0 0-6 0"/>
        </svg>
      </div>
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported icons size metadata
      // config to also set the ImageResponse's width and height.
      ...size,
    }
  )
}
