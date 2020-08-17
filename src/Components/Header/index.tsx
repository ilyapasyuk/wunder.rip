import React, { useState } from 'react'

import LazyImage from 'react-lazy-image-loader'

import {
    StyledHeader,
    StyledAvatar,
    StyledDropdown,
    StyledDropdownItem,
    StyledEmail,
    StyledFullName,
} from './style'

interface Props {
    avatar: string
    email: string
    fullName: string
    onLogout: () => void
}

const Header = ({ avatar, email, fullName, onLogout }: Props) => {
    const [isShowMenu, setShowMenu] = useState<boolean>(false)

    return (
        <StyledHeader>
            Wunder Rip
            {avatar && (
                <StyledAvatar onClick={() => setShowMenu(true)}>
                    <LazyImage src={avatar} alt="avatar" height={30} width={30} borderRadius={4} />

                    {isShowMenu && (
                        <StyledDropdown>
                            <StyledDropdownItem>
                                <StyledFullName>{fullName}</StyledFullName>
                                <StyledEmail>{email}</StyledEmail>
                            </StyledDropdownItem>
                            <StyledDropdownItem type="isDanger" onClick={onLogout}>
                                Sign Out
                            </StyledDropdownItem>
                        </StyledDropdown>
                    )}
                </StyledAvatar>
            )}
        </StyledHeader>
    )
}

export { Header }
