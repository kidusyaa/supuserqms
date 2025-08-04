import React from 'react'
import Link from 'next/link'
import DivCenter from './divCenter'
import { Button } from './ui/button'
export default function Homepage() {
  return (
    <div>
        <DivCenter>
          <div className='my-auto'>
             <Link href={'/users'}>
            <Button >Users Queue</Button>
            </Link>
            <Link href={'/company'}>
            <Button className='ml-4'>Company Dashbord</Button>
            </Link>
            <Link href={'/registration'}>
            <Button className='ml-4'>Company Regstration</Button>
            </Link>
          </div>
        </DivCenter>
    </div>
  )
}
