import styled from 'styled-components'

const StyledHeader = styled.header`
    z-index: 9999;
    height: 50px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 1px 0 #ededed;
    user-select: none;
    -webkit-text-size-adjust: 100%;
    position: sticky;
    top: 0;
    display: flex;
    align-items: center;
    padding: 0 16px;
    justify-content: space-between;
`

const StyledAvatar = styled.div`
    border-radius: 3px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    cursor: pointer;
`
const StyledDropdown = styled.div`
    border: 1px solid rgba(0, 0, 0, 0.2);
    z-index: 9998;
    position: fixed;
    width: 180px;
    top: 50px;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    -webkit-border-radius: 0 0 4px 4px;
    border-radius: 0 0 4px 4px;
    right: 16px;
`

interface StyledDropdownItemProps {
    type?: 'isDanger' | 'isInfo' | 'isLink'
}

const getColor = (type = 'isInfo'): string => {
    switch (type) {
        case 'isDanger':
            return '#db3a29'
        case 'isLink':
            return '#1b7edf'
        case 'isInfo':
        default:
            return '#777'
    }
}

const StyledDropdownItem = styled.div`
    font-size: 14px;
    padding: 8px 15px;
    color: #777;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);

    &:hover {
        color: ${(props: StyledDropdownItemProps) => getColor(props.type)};
    }
`

const StyledEmail = styled.div`
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
`

const StyledFullName = styled.div`
    font-size: 14px;
`

export {
    StyledHeader,
    StyledAvatar,
    StyledDropdown,
    StyledDropdownItem,
    StyledEmail,
    StyledFullName,
}
