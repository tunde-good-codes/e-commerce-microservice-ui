"use client";

import GoogleButton from "@/shared/components/google-button";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

type FormData = {
  email: string;
  password: string;
};

const ForgotPassword = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [userData, setUserData] = useState<FormData | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

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

  const requestOtpMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URI}/auth/forgot-password`,
        { email }
      );
      return response.data;
    },
    onSuccess: (_, { email }) => {
      setUserEmail(email);
      setStep("otp");
      setServerError(null);
      startResendTimer();

      setCanResend(false);
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error?.response?.data as { message?: string })?.message ||
        "Invalid otp. Try Again!";
      setServerError(errorMessage);
    },
  });
  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!userEmail) return;
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URI}/auth/verify-forgot-password-otp`,
        {
          email: userEmail,
          otp: otp.join(""),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      setStep("reset");
      setServerError(null);
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error?.response?.data as { message?: string })?.message ||
        "Invalid otp. Try Again!";
      setServerError(errorMessage);
    },
  });
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      if (!userEmail) return;
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URI}/auth/reset-password`,
        {
          email: userEmail,
          newPassword: password,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("password reset successfully!");
      setServerError(null);
      router.push("/login");
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error?.response?.data as { message?: string })?.message ||
        "Invalid otp. Try Again!";
      setServerError(errorMessage);
    },
  });

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

  const onSubmitEmail = ({ email }: { email: string }) => {
    requestOtpMutation.mutate({ email });
  };
  const onSubmitPassword = ({ password }: { password: string }) => {
    resetPasswordMutation.mutate({ password });
  };

  return (
    <div className="w-full py-10 min-h-[85vh] bg-[#f1f1f1]">
      <h1 className="text-4xl font-poppins font-semibold text-black text-center">
        Forgot Password
      </h1>
      <p className="text-lg text-center font-sm py-3 text-[#00000099]">
        Home . Forgot Password
      </p>
      <div className="w-full flex justify-center">
        <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">
          {step === "email" && (
            <>
              <h3 className="text-2xl font-semibold text-center mb-2">
                Forgot Password to Tee-Shop?
              </h3>
              <p className="text-center text-gray-500 mb-4">
                Go back to{" "}
                <Link
                  href={"/login"}
                  className="text-blue-500 hover:text-blue-600"
                >
                  Login?
                </Link>
              </p>

              <form onSubmit={handleSubmit(onSubmitEmail)}>
                <label className="text-gray-700 mb-1 block">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="jim@mail.com"
                  className="w-full p-3 border border-gray-300 outline-0 rounded-lg focus:border-blue-500 transition-colors"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // ✅ Fixed email regex
                      message: "Please enter a valid email address",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {String(errors.email.message)}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full text-lg cursor-pointer bg-black text-white py-3 rounded-lg mt-4 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  disabled={requestOtpMutation.isPending}
                >
                  {requestOtpMutation.isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
                {serverError && (
                  <p className="text-red-500 text-sm mt-2 text-center">
                    {serverError}
                  </p>
                )}
              </form>
            </>
          )}

          {step === "otp" && (
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
                    disabled={verifyOtpMutation.isPending}
                  />
                ))}
              </div>

              <button
                onClick={() => verifyOtpMutation.mutate()}
                disabled={verifyOtpMutation.isPending}
                className="w-full text-lg cursor-pointer bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {verifyOtpMutation.isPending ? (
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
                    onClick={() =>
                      requestOtpMutation.mutate({ email: userEmail! })
                    }
                    className="text-blue-500 hover:text-blue-600 disabled:text-gray-400 transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    Resend Otp{" "}
                  </button>
                ) : (
                  <p className="text-gray-500">Resend OTP in {timer}s</p>
                )}
              </div>
            </div>
          )}
          {serverError && (
            <p className="text-red-500 text-sm mt-2 text-center">
              {serverError}
            </p>
          )}

          {step === "reset" && (
            <>
              <h3 className="text-xl font-semibold text-center mb-4">
                Reset Password
              </h3>

              <form onSubmit={handleSubmit(onSubmitPassword)}>
                <label className="text-gray-700 mb-1 block">
                  New Password{" "}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={passwordVisible ? "text" : "password"}
                    placeholder="Enter your password"
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
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {passwordVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {String(errors.password.message)}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full text-lg cursor-pointer bg-black text-white py-3 rounded-lg mt-4 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending
                    ? "Resetting..."
                    : "Reset Password"}
                </button>
                {serverError && (
                  <p className="text-red-500 text-sm mt-2 text-center">
                    {serverError}
                  </p>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
