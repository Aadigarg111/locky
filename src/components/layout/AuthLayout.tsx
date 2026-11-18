import React from 'react'
import { Outlet } from 'react-router-dom'

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center">
            <LogoIcon className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="mt-6 text-center text-3xl font-bold text-gray-900">Family Safety</h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Real-time location sharing, geofencing & SOS alerts for family safety
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-gray-100 sm:px-10">
          <Outlet />
        </div>
        <p className="mt-6 text-center text-sm text-gray-500">
          A Minor Project by Group 41, B.Tech IT, ADGIPS (2026-27)
        </p>
      </div>
    </div>
  )
}