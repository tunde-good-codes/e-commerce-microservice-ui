"use client";

import { CartIcon } from "@/assets/svg/cart-icon";
import { HeartIcon } from "@/assets/svg/heart-icon";
import { ProfileIcon } from "@/assets/svg/profile-icon";
import { navItems } from "@/configs/constants";
import useUser from "@/hooks/useUser";
import { AlignLeft, ChevronDown } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const HeaderBottom = () => {
  const [show, setShow] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const { user } = useUser();
  console.log(user);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <div
      className={`w-full transition-all duration-300 ${
        isSticky ? "fixed top-0 left-0 z-[100] bg-white shadow-lg" : "relative"
      }`}
    >
      <div
        className={`w-[80%] relative mx-auto flex items-center justify-between ${
          isSticky ? "pt-3" : "py-0"
        } `}
      >
        {/* all drop down */}
        <div
          className={`w-[260px] ${
            isSticky && "-mb-2"
          }  cursor-pointer flex items-center justify-between px-5 h-[50px] bg-[#3489ff] `}
          onClick={() => setShow(!show)}
        >
          <div className="flex items-center gap-2">
            <AlignLeft color="white" />
            <span className="text-white font-medium">All Department</span>
          </div>
          <ChevronDown color="white" />
        </div>
        {/* dropdown menu */}
        {show && (
          <div
            className={`
                absolute left-0 ${
                  isSticky ? "top-[70px]" : "top-[50px]"
                }  w-[260px] h-[400px] bg-[#f5f5f5] `}
          ></div>
        )}

        <div className="flex items-center">
          {navItems.map((nav: NavItemsTypes, index: number) => (
            <Link
              href={nav.href}
              key={index}
              className="px-5 font-medium text-lg"
            >
              {nav.title}
            </Link>
          ))}
        </div>

        <div className="">
          {isSticky && (
            <div className="flex items-center gap-8 pb-2">
              {/* User Login Section */}
              <div className="flex items-center gap-2">
                <Link
                  href={"/login"}
                  className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1c1a]"
                >
                  <ProfileIcon />
                </Link>

                <Link href={"/login"}>
                  <div>
                    <span className="block font-medium">Hello,</span>
                    <span className="block font-semibold">Sign In</span>
                  </div>
                </Link>
              </div>

              {/* Cart & Wishlist Icons Section */}
              <div className="flex items-center gap-5">
                <Link href={"/wishlist"} className="relative">
                  <HeartIcon />
                  <div className="h-6 w-6 border-white bg-red-600 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]">
                    <span className="text-white font-medium text-sm">0</span>
                  </div>
                </Link>
                <Link href={"/cart"} className="relative">
                  <CartIcon />
                  <div className="h-6 w-6 border-white bg-red-600 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]">
                    <span className="text-white font-medium text-sm">0</span>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>{" "}
    </div>
  );
};

export default HeaderBottom;
