// Loader.jsx
import React, { useState } from 'react'
import { useProgress } from '@react-three/drei'

const Loader = ({ onStart }) => {
  const { progress } = useProgress()
  const isComplete = progress === 100
  const [fading, setFading] = useState(false)

  const handleStart = () => {
    setFading(true)
    setTimeout(onStart, 800) // wait for fade animation to finish
  }

  return (
 // In Loader.jsx — update the outer div's style:
<div
  style={{
    position: 'fixed',
    inset: 0,
    zIndex: 10,
  }}
>
  {/* ✅ Background image layer */}
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: 'url(/desert.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      zIndex: 0,
    }}
  />

  {/* ✅ Blur overlay layer */}
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      zIndex: 1,
    }}
  />

  {/* ✅ Content layer */}
  <div
    style={{
      position: 'relative',
      zIndex: 2,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      transition: 'opacity 0.8s ease',
      opacity: fading ? 0 : 1,
      pointerEvents: fading ? 'none' : 'auto',
    }}
  >
      {/* Company name */}
      <h1
        style={{
          color: 'rgba(255,255,255,0.9)',
          fontSize: '2rem',
          fontWeight: '300',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          marginBottom: '3rem',
        }}
      >
        COMPANY NAME
      </h1>

      {/* Progress bar */}
      <div
        style={{
          width: '200px',
          height: '1px',
          background: 'rgba(255,255,255,0.2)',
          marginBottom: '1rem',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'rgba(255,255,255,0.8)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Percentage */}
      <p
        style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: '0.85rem',
          letterSpacing: '0.1em',
          marginBottom: '2.5rem',
          transition: 'opacity 0.5s ease',
          opacity: isComplete ? 0 : 1,
        }}
      >
        {Math.round(progress)}%
      </p>

      {/* Start button — only appears at 100% */}
      <button
        onClick={handleStart}
        style={{
          opacity: isComplete ? 1 : 0,
          transform: isComplete ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s',
          pointerEvents: isComplete ? 'auto' : 'none',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.6)',
          color: 'rgba(245, 245, 245, 0.9)',
          padding: '12px 40px',
          fontSize: '0.8rem',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          transition: "all 0.3s ease",
          cursor: 'pointer',
        }}
onMouseEnter={e => {
  e.target.style.color = "black";
  e.target.style.background = "rgb(255, 255, 255)";
  e.target.style.boxShadow = "0 0 20px rgba(255, 255, 255, 0.93)";
  e.target.style.borderRadius = "25px";
}}
onMouseLeave={e => {
    e.target.style.color = "white";
  e.target.style.background = "transparent";
  e.target.style.boxShadow = "none";
  e.target.style.borderRadius = "0px"; // reset if needed
}}
      >
       Start
      </button>
    </div>
    </div>
  )
}

export default Loader