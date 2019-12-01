import React from 'react';

interface IProps {
  children: React.ReactElement | React.ReactElement[]
}

export default function Layout({ children }: IProps) {
  return (
    <div className='layout'>
      {children}
    </div>
  )
}
