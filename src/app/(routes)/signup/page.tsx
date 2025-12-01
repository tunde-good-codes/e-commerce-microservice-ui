"use client";

import GoogleButton from "@/shared/components/google-button";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

type FormData = {
  email: string;
  name: string;
  password: string;
};

const SignUp = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(true);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [userData, setUserData] = useState<FormData | null>(null);
  const router = useRouter();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>();

  const signUpMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URI}/auth/user-registration`,
        data
      );
      return response.data;
    },
    onSuccess: (data, formData) => {
      setUserData(formData);
      setShowOtp(true);
      setCanResend(false);
      setTimer(60);
      startResendTimer();

      // Success toast
      toast.success("Registration successful! OTP sent to your email.");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        "Registration failed. Please try again.";

      // Error toast
      toast.error(errorMessage);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!userData) {
        console.log("❌ No userData found");
        return;
      }

      const payload = {
        ...userData,
        otp: otp.join(""),
      };

      console.log("🔄 Calling verify-user with:", payload);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URI}/auth/verify-user`,
        payload
      );

      console.log("✅ verify-user response:", response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log("🎉 Verification successful, redirecting...");
      toast.success("Account verified successfully! Redirecting...");
      router.push("/login");
    },
    onError: (error: any) => {
      console.log("💥 Verification error:", error.response?.data);
      const errorMessage =
        error.response?.data?.message || "OTP verification failed.";
      toast.error(errorMessage);
    },
  });

  const handleVerifyClick = () => {
    if (isVerifying) {
      console.log("⚠️ Verification already in progress");
      return;
    }

    setIsVerifying(true);
    verifyOtpMutation.mutate(undefined, {
      onSettled: () => {
        setIsVerifying(false);
      },
    });
  };

  const resendOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URI}/auth/resend-otp`,
        { email: userData?.email }
      );
      return response.data;
    },
    onSuccess: () => {
      setCanResend(false);
      setTimer(60);
      startResendTimer();
      toast.success("OTP resent successfully!");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || "Failed to resend OTP.";
      toast.error(errorMessage);
    },
  });

  const startResendTimer = () => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const onSubmit = (data: FormData) => {
    // Show loading toast
    const loadingToast = toast.loading("Creating your account...");

    signUpMutation.mutate(data, {
      onSettled: () => {
        toast.dismiss(loadingToast);
      },
    });
  };

  // const handleResendOtp = () => {
  //   if (!canResend) return;

  //   const loadingToast = toast.loading("Resending OTP...");

  //   resendOtpMutation.mutate(undefined, {
  //     onSettled: () => {
  //       toast.dismiss(loadingToast);
  //     },
  //   });
  // };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = () => {
    if (userData) {
      signUpMutation.mutate(userData);
    }
  };
  const isSignUpLoading = signUpMutation.isPending;
  const isVerifyOtpLoading = verifyOtpMutation.isPending;
  const isResendOtpLoading = resendOtpMutation.isPending;

  return (
    <div className="w-full py-10 min-h-[85vh] bg-[#f1f1f1]">
      <h1 className="text-4xl font-poppins font-semibold text-black text-center">
        Signup
      </h1>
      <p className="text-lg text-center font-medium py-3 text-[#00000099]">
        Home . Signup
      </p>
      <div className="w-full flex justify-center">
        <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">
          <h3 className="text-3xl font-semibold text-center mb-2">
            Signup to Tee-Shop
          </h3>
          <p className="text-center text-gray-500 mb-4">
            Already have an account?{" "}
            <Link
              href={"/login"}
              className="text-blue-500 hover:text-blue-600 transition-colors"
            >
              Login
            </Link>
          </p>

          <GoogleButton />

          <div className="flex items-center my-5 text-gray-400 text-sm">
            <div className="flex-1 border-t border-gray-300" />
            <span className="px-3">or Sign up With Email</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          {!showOtp ? (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <label
                    className="text-gray-700 mb-1 block font-medium"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    className="w-full p-3 border border-gray-300 outline-0 rounded-lg focus:border-blue-500 transition-colors"
                    {...register("name", {
                      required: "Name is required",
                    })}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">
                      {String(errors.name.message)}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className="text-gray-700 mb-1 block font-medium"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="w-full p-3 border border-gray-300 outline-0 rounded-lg focus:border-blue-500 transition-colors"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Please enter a valid email address",
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {String(errors.email.message)}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className="text-gray-700 mb-1 block font-medium"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={passwordVisible ? "text" : "password"}
                      placeholder="Enter your password (min 6 characters)"
                      className="w-full p-3 border border-gray-300 outline-0 rounded-lg focus:border-blue-500 transition-colors"
                      {...register("password", {
                        required: "Password is required",
                        minLength: {
                          value: 6,
                          message: "Password must be at least 6 characters",
                        },
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {passwordVisible ? (
                        <Eye size={20} />
                      ) : (
                        <EyeOff size={20} />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {String(errors.password.message)}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSignUpLoading}
                  className="w-full text-lg cursor-pointer bg-black text-white py-3 rounded-lg mt-2 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isSignUpLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing Up...
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">
                  Enter Verification Code
                </h3>
                <p className="text-gray-600">
                  We sent a 4-digit code to {userData?.email}
                </p>
              </div>

              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-14 h-14 text-center border border-gray-300 rounded-lg text-lg font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    disabled={isVerifyOtpLoading}
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyClick}
                disabled={
                  isVerifyOtpLoading || otp.join("").length !== 4 || isVerifying
                }
                className="w-full text-lg cursor-pointer bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isVerifyOtpLoading || isVerifying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </button>
              <div className="text-center">
                {canResend ? (
                  <button
                    onClick={handleResendOtp}
                    disabled={isResendOtpLoading}
                    className="text-blue-500 hover:text-blue-600 disabled:text-gray-400 transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    {isResendOtpLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        Resending...
                      </>
                    ) : (
                      "Resend OTP"
                    )}
                  </button>
                ) : (
                  <p className="text-gray-500">Resend OTP in {timer}s</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignUp;
