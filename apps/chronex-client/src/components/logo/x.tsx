const XLogoIcon = ({
  size = 25,
  color = '#000000',
  background = 'transparent',
  opacity = 1,
  rotation = 0,
  shadow = 0,
  flipHorizontal = false,
  flipVertical = false,
  padding = 0,
}) => {
  const transforms = []
  if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`)
  if (flipHorizontal) transforms.push('scaleX(-1)')
  if (flipVertical) transforms.push('scaleY(-1)')

  const viewBox = `${-padding} ${-padding} ${512 + padding * 2} ${512 + padding * 2}`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      style={{
        color,
        opacity,
        transform: transforms.join(' ') || undefined,
        filter:
          shadow > 0 ? `drop-shadow(0 ${shadow}px ${shadow * 2}px rgba(0,0,0,0.3))` : undefined,
        backgroundColor: background !== 'transparent' ? background : undefined,
      }}
    >
      <path
        fill="currentColor"
        d="M296.591 223.331L455.427 42.667h-37.639L279.871 199.535L169.716 42.667H42.666l166.575 237.212L42.666 469.333h37.642l145.644-165.658l116.331 165.658h127.05L296.582 223.331zm-51.555 58.638l-16.877-23.621L93.87 70.393h57.815L260.057 222.08l16.878 23.621l140.871 197.168h-57.815l-114.955-160.89z"
      />
    </svg>
  )
}

export default XLogoIcon
