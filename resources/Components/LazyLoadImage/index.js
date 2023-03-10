import { useEffect, useState, useCallback } from 'react'

export const LazyLoadImage = ({ src, placeholder, loadError, ...props }) => {
  const [imgSrc, initImg] = useState(placeholder || src)
  const onLoad = useCallback(() => {
    initImg(src)
  }, [src])
  const onError = useCallback(() => {
    initImg(loadError || placeholder)
  }, [loadError, placeholder])
  useEffect(() => {
    const imageObj = new Image()
    imageObj.src = src
    imageObj.addEventListener('load', onLoad)
    imageObj.addEventListener('error', onError)
    return () => {
      imageObj.removeEventListener('load', onLoad)
      imageObj.removeEventListener('error', onError)
    }
  }, [src, onLoad, onError])

  return <img alt={props.alt || imgSrc} src={imgSrc} loading='lazy' {...props} />
}
