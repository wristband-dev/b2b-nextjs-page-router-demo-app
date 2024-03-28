import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { AiOutlineMenu, AiOutlineClose } from 'react-icons/ai';

import Logo from '../../public/Logo.png';
import { clientRedirectToLogout } from '@/utils/client-auth';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const handleNav = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="fixed w-full h-16 shadow-xl bg-purple text-white">
      <div className="flex justify-between items-center h-full w-full px-4 2xl:px-16">
        <Link href="/">
          <Image src={Logo} alt="Logo" height="40" className="cursor-pointer" priority />
        </Link>
        <div className="hidden sm:flex">
          <ul className="hidden sm:flex">
            <Link href="/">
              <li className="ml-8 capitalize hover:border-b text-xl">Home</li>
            </Link>
            <Link href="/settings">
              <li className="ml-8 capitalize hover:border-b text-xl">Settings</li>
            </Link>
            <div onClick={clientRedirectToLogout} className="cursor-pointer">
              <li className="mx-8 capitalize hover:border-b text-xl">Log Out</li>
            </div>
          </ul>
        </div>
        <div onClick={handleNav} className="sm:hidden cursor-pointer pl-24">
          <AiOutlineMenu size={25} />
        </div>
      </div>
      <div
        className={
          menuOpen
            ? 'fixed left-0 top-0 w-[100%] sm:hidden h-screen bg-[#ecf0f3] p-10 ease-in duration-300'
            : 'fixed left-[-100%] top-0 p-10 ease-in duration-300'
        }
      >
        <div className="flex w-full items-center justify-end text-black">
          <div onClick={handleNav} className="cursor-pointer">
            <AiOutlineClose size={25} />
          </div>
        </div>
        <div className="flex-col py-4 text-black">
          <ul>
            <Link href="/">
              <li onClick={() => setMenuOpen(false)} className="py-4 cursor-pointer">
                Home
              </li>
            </Link>
            <Link href="/settings">
              <li onClick={() => setMenuOpen(false)} className="py-4 cursor-pointer">
                Settings
              </li>
            </Link>
            <div onClick={clientRedirectToLogout} className="cursor-pointer">
              <li onClick={() => setMenuOpen(false)} className="py-4 cursor-pointer">
                Log Out
              </li>
            </div>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
