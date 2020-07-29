import React, { useState } from 'react'

import { StyledImage } from './style'

const loadingClassName = 'img-loading'
const loadedClassName = 'img-loaded'

interface Props {
    src: string
    alt: string
    width?: number
    height?: number
}

const LazyImage = ({ src, alt, width, height }: Props) => {
    const [isLoaded, setLoaded] = useState(false)

    const onLoad = () => {
        setLoaded(true)
    }

    const className = `${isLoaded ? loadedClassName : loadingClassName}`

    return (
        <StyledImage img={src} className={className} width={width} height={height}>
            <img src={src} onLoad={onLoad} alt={alt} />
        </StyledImage>
    )
}

export default LazyImage
