import React from 'react';

export default function DivCenter({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex flex-col  w-full  items-center px-0 sm:px-[2%] lg:px-[100px]  xl:px-[100px]'>
      {children}
    </div>
  );
}
