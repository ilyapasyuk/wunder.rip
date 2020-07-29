import styled, { createGlobalStyle } from 'styled-components'

type StyledImageProps = {
    img: string
    height?: number
    width?: number
}

const StyledImage = styled.div`
    width: ${(props: StyledImageProps) => `${props.width}`}px!important;
    height: ${(props: StyledImageProps) => `${props.height}`}px!important;
    border-radius: 2px;
    background-image: ${(props: StyledImageProps) => `url(${props.img})`};
    background-size: cover;

    img {
        display: none;
    }
`

const GlobalLazyImageStyle = createGlobalStyle`
    @keyframes fadeInImg {
        from { opacity: 0}
        to { opacity: 1}
    }
    
    .img-loading {
        opacity: 0;
        width: 100%;
        height: auto;
    }
   
    .img-loaded {
        animation: fadeInImg cubic-bezier(0.23, 1, 0.32, 1) 1;
        position: relative;
        opacity: 0;
        animation-fill-mode: forwards;
        animation-duration: 0.7s;
        animation-delay: 0.1s;
    }
`

export { StyledImage, GlobalLazyImageStyle }
