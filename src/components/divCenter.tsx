import React from 'react';

export default function DivCenter({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex flex-col items-center  w-full  px-[6%] sm:px-[6%] lg:px-[100px]  xl:px-[100px]'>
      {children}
    </div>
  );
}
