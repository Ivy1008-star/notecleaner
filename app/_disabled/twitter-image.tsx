import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE, OG_ALT } from './og-content'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = OG_ALT
export const runtime = 'nodejs'

export default function Image() {
  return renderOgImage()
}
