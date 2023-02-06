import { signIn } from "next-auth/react";

export const LoginPage = () => (
  <main className="container mx-auto flex flex-col items-center justify-center h-screen p-4">
    <h1 className="text-5xl md:text-[5rem] leading-normal font-extrabold text-gray-300">
      UMoney
    </h1>
    <span className="text-3xl md:text-[2rem] leading-normal font-bold text-gray-300 text-center">
      Traccia le tue finanze
    </span>

    <div className="grid gap-3 pt-3 mt-3 text-center lg:w-1/3">
      <button
        className="text-center p-6 duration-500 border-2 border-gray-500 text-lg text-gray-300 rounded shadow-xl motion-safe:hover:scale-105"
        onClick={() => signIn("google")}
      >
        Login with Google
      </button>
    </div>
  </main>
);
