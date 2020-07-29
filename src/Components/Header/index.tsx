import React, { useState } from 'react'

import LazyImage from 'Components/LazyImage'

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
            {avatar && (
                <StyledAvatar onClick={() => setShowMenu(true)}>
                    <LazyImage src={avatar} alt="avatar" height={30} width={30} />

                    {isShowMenu && (
                        <StyledDropdown>
                            <StyledDropdownItem>
                                <StyledFullName>{fullName}</StyledFullName>
                                <StyledEmail>{email}</StyledEmail>
                            </StyledDropdownItem>
                            <StyledDropdownItem isDanger onClick={onLogout}>
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
