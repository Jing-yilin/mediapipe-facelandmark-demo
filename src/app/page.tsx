"use client";

import Head from "next/head";
import dynamic from "next/dynamic";

// Use dynamic loading to fix document undefined error
const FaceLandmarkCanvas = dynamic(
  () => {
    return import("../components/FaceLandmarkCanvas");
  },
  { ssr: false }
);

export default function Home() {
  return (
    <div className="">
      <div className="justify-center w-full h-screen">
        <FaceLandmarkCanvas />
      </div>
    </div>
  );
}
