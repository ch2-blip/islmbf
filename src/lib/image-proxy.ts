/**
 * 通过 wsrv.nl 图片代理服务获取缩放后的图片 URL
 *
 * wsrv.nl 是免费开源的图片代理/CDN，支持缩放、裁剪、格式转换
 * 文档: https://wsrv.nl/docs/
 *
 * 用法:
 *   列表页: thumbUrl(url, 640, 75)   → ~50-100KB 缩略图
 *   详情页: thumbUrl(url, 1280, 80)  → ~150-300KB 高清图
 *   原图:   直接使用原始 URL
 */
export function thumbUrl(url: string, width = 640, quality = 75): string {
  if (!url) return url
  try {
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=${quality}&n=-1`
  } catch {
    return url
  }
}

/** 列表页缩略图: 640px 宽, 质量 75 */
export function listThumb(url: string): string {
  return thumbUrl(url, 640, 75)
}

/** 详情页高清图: 1280px 宽, 质量 80 */
export function detailThumb(url: string): string {
  return thumbUrl(url, 1280, 80)
}
