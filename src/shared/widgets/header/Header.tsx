"use client";

import Link from "next/link";
import React from "react";
import { Search } from "lucide-react";
import { ProfileIcon } from "@/assets/svg/profile-icon";
import { HeartIcon } from "@/assets/svg/heart-icon";
import { CartIcon } from "@/assets/svg/cart-icon";
import HeaderBottom from "./HeaderBottom";
import useUser from "@/hooks/useUser";

const Header = () => {
  const { user, isLoading } = useUser();
  return (
    <div className="w-full bg-white">
      <div className="w-[80%] py-5 mx-auto flex items-center justify-between">
        <div>
          <Link href={"/"}>
            <span className="text-3xl font-semibold">Tee-Shop</span>
          </Link>
        </div>

        <div className="w-[50%] relative">
          <input
            type="text"
            placeholder="search for products here..."
            className="w-full px-4 font-roboto font-medium border-[2.5px] border-[#3489ff] outline-none h-[55px]"
          />
          <div className="absolute w-[60px] cursor-pointer flex items-center justify-center h-[55px] top-0 right-0 bg-[#3489ff]">
            <Search color="#fff" />
          </div>
        </div>

        {/* User section and Cart section should be separate */}
        <div className="flex items-center gap-8 pb-2">
          {/* User Login Section */}
          <div className="flex items-center gap-2">
            {!isLoading && user ? (
              <>
                <Link
                  href={"/login"}
                  className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1c1a]"
                >
                  <ProfileIcon />
                </Link>

                <Link href={"/profile"}>
                  <div>
                    <span className="block font-medium">Hello,</span>
                    <span className="block font-semibold">
                      {user?.name?.split(" ")[0]}
                    </span>
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={"/login"}
                  className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1c1a]"
                >
                  <ProfileIcon />
                </Link>

                <Link href={"/login"}>
                  <div>
                    <span className="block font-medium">Hello,</span>
                    <span className="block font-semibold">
                      {isLoading ? "..." : "Sign In"}
                    </span>
                  </div>
                </Link>
              </>
            )}
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
      </div>

      {/* Border and HeaderBottom */}
      <div className="border-b border-b-[#999938]">
        <HeaderBottom />
      </div>
    </div>
  );
};

export default Header;
